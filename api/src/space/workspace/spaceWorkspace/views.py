from rest_framework.decorators import api_view, permission_classes, renderer_classes, parser_classes
from .renderers import EventStreamRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404

from .models import Workflow, AgentTask, Project, ProjectFile
from .serializers import WorkflowSerializer, ProjectSerializer
from .ai_engine import split_tasks, run_remote_llm, run_remote_llm_stream
import json
from django.http import StreamingHttpResponse
import threading



@api_view(["GET"])
@permission_classes([IsAuthenticated])
@renderer_classes([EventStreamRenderer])
def stream_agent(request, task_id):
    """
    SSE endpoint that streams tokens for a given AgentTask.
    Includes the user’s original prompt and asks
    for raw Markdown without any extra preamble.
    """
    task = get_object_or_404(AgentTask, id=task_id)
    # mark as running
    task.status = "running"
    task.save()

    # grab the original user prompt from the workflow
    user_prompt = task.workflow.prompt

    # build the LLM instruction
    instruction = (
        f"You are a **{task.role}** developer.\n"
        f"Task: **{task.name}**\n\n"
        f"{user_prompt}\n\n"
        "=== OUTPUT INSTRUCTIONS ===\n"
        "- Respond *only* with the content in valid Markdown.\n"
        "- Do NOT include any preamble like “Sure…” or internal commentary.\n"
    )

    def event_stream():
        # let the client know we’ve started
        yield f"event: start\ndata: {{\"id\":{task.id}}}\n\n"

        buffer = []
        for token in run_remote_llm_stream(instruction):
            buffer.append(token)
            payload = json.dumps({"id": task.id, "token": token})
            yield f"data: {payload}\n\n"

        # once finished, save full result and close out
        full = "".join(buffer).strip()
        task.result = full
        task.status = "done"
        task.save()

        yield "event: done\ndata: {}\n\n"

    resp = StreamingHttpResponse(event_stream(),
                                 content_type="text/event-stream")
    # disable buffering so each yield goes straight to the client
    resp["Cache-Control"]     = "no-cache"
    resp["X-Accel-Buffering"] = "no"  
    return resp


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def create_workflow(request):
    prompt = request.data.get('prompt', '')
    
    # Create project
    project = Project.objects.create(
        owner=request.user,
        title=prompt[:64],  # truncate to fit
        description=prompt
    )

    # Create workflow
    workflow = Workflow.objects.create(prompt=prompt)

    tasks = split_tasks(prompt)
    for task in tasks:
        AgentTask.objects.create(
            workflow=workflow,
            name=task.get("name", "Unnamed Task"),
            role=task.get("role", "General")
        )

    # Link workflow to project by saving project id in frontend
    return Response({
        'workflow': WorkflowSerializer(workflow).data,
        'project': ProjectSerializer(project).data
    })





@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_agent(request, task_id):
    task = get_object_or_404(AgentTask, id=task_id)
    task.status = 'running'
    task.save()

    def _run():
        instruction = (
            f"You are a **{task.role}** developer.\n"
            f"Task: **{task.name}**\n\n"
            "Please format your entire answer in **Markdown**.  "
            "Use:\n"
            "- Triple-backticks for code blocks, with a language tag, e.g. ```js```\n"
            "- Single backticks for inline code, e.g. `npm install`\n"
            "- Bullet lists, headings, etc.\n\n"
            "Begin your answer now."
        )
        output = run_remote_llm(instruction)
        task.result = output
        task.status = 'done'
        task.save()

        # Save output to ProjectFile
        project = task.workflow.project
        if project:
            from .models import ProjectFile
            ProjectFile.objects.update_or_create(
                project=project,
                filename=task.name,
                defaults={"content": output}
            )

    threading.Thread(target=_run).start()
    return Response({"status": "running"})



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_workflow_detail(request, pk):
    workflow = get_object_or_404(Workflow, pk=pk)
    return Response(WorkflowSerializer(workflow).data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project(request):
    title = request.data.get('title', '')
    description = request.data.get('description', '')
    project = Project.objects.create(owner=request.user, title=title, description=description)
    return Response(ProjectSerializer(project).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_projects(request):
    projects = Project.objects.filter(owner=request.user)
    return Response(ProjectSerializer(projects, many=True).data)