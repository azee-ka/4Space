from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import *
from .serializers import *
from uuid import UUID
import subprocess  
from django.http import FileResponse
import tempfile
from rest_framework.parsers import MultiPartParser
import os
from textwrap import dedent
from django.http import FileResponse
from .models import Project
from django.apps import apps
import re
import unicodedata

SPACE_APP_DIR = apps.get_app_config("space").path
STATIC_LATEX_DIR = os.path.join(SPACE_APP_DIR, "static_latex")




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_richtext_version(request, project_id):
    project = Project.objects.get(id=project_id, owner=request.user)
    content = request.data.get("content", "")
    RichTextContent.objects.create(project=project, content=content)
    return Response({"status": "version saved"})







def sanitize_latex(text):
    """
    Replace common problematic Unicode characters in LaTeX source with ASCII equivalents.
    """
    replacements = {
        "’": "'",  # smart apostrophe
        "‘": "'",  # left single quote
        "“": '"',  # left double quote
        "”": '"',  # right double quote
        "–": "--",  # en dash
        "—": "---",  # em dash
        "…": "...",  # ellipsis
        "‐": "-",  # non-breaking hyphen
        " ": " ",  # narrow non-breaking space
        " ": " ",  # non-breaking space
        "−": "-",  # minus sign
        "×": r"\times",  # multiplication symbol
        "÷": r"\div",  # division symbol
    }

    for bad, good in replacements.items():
        text = text.replace(bad, good)

    return unicodedata.normalize("NFKC", text)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def render_latex_pdf(request, project_id):
    try:
        project = Project.objects.get(id=project_id, owner=request.user)
        if project.tool_type != "latex":
            return Response({"detail": "This project is not a LaTeX type."}, status=400)

        with tempfile.TemporaryDirectory() as tmpdir:
            uploaded_names = []

            # Step 1: Write main LaTeX file
            tex_path = os.path.join(tmpdir, "document.tex")
            tex_file = request.FILES.get("tex")
            if tex_file:
                with open(tex_path, "w", encoding="utf-8") as f:
                    raw = tex_file.read().decode("utf-8", errors="replace")
                    f.write(sanitize_latex(raw))
            else:
                with open(os.path.join(STATIC_LATEX_DIR, "default_document.tex"), "r", encoding="utf-8") as src:
                    with open(tex_path, "w", encoding="utf-8") as dst:
                        dst.write(sanitize_latex(src.read()))

            # Step 2: Write all uploaded files (.sty, images, etc.)
            for f in request.FILES.getlist("files"):
                name = f.name
                uploaded_names.append(name)
                with open(os.path.join(tmpdir, name), "wb") as out:
                    for chunk in f.chunks():
                        out.write(chunk)

            # Step 3: Inject fallback header.sty if not provided
            if "header.sty" not in uploaded_names:
                with open(os.path.join(STATIC_LATEX_DIR, "default_header.sty"), "r", encoding="utf-8") as src:
                    with open(os.path.join(tmpdir, "header.sty"), "w", encoding="utf-8") as dst:
                        dst.write(sanitize_latex(src.read()))

            # Step 4: Compile with tectonic
            result = subprocess.run(
                ["tectonic", tex_path, "--outdir", tmpdir],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            stdout = result.stdout.decode("utf-8", errors="replace")
            stderr = result.stderr.decode("utf-8", errors="replace")
            print("Tectonic stdout:", stdout)
            print("Tectonic stderr:", stderr)

            if result.returncode != 0:
                return Response({
                    "error": "LaTeX compilation failed.",
                    "stderr": stderr,
                    "stdout": stdout
                }, status=500)

            pdf_path = os.path.join(tmpdir, "document.pdf")
            if not os.path.exists(pdf_path):
                return Response({"error": "PDF not generated."}, status=500)

            return FileResponse(open(pdf_path, "rb"), content_type="application/pdf")

    except Project.DoesNotExist:
        return Response({"detail": "Project not found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)










@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def projects_view(request):
    if request.method == "POST":
        data = request.data.copy()
        data["owner"] = request.user.id  # Set owner directly
        serializer = ProjectSerializer(data=data)
        if serializer.is_valid():
            project = serializer.save()
            return Response(ProjectSerializer(project).data)
        return Response(serializer.errors, status=400)
    else:
        projects = Project.objects.filter(owner=request.user)
        return Response(ProjectSerializer(projects, many=True).data)



@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def tool_content_view(request, project_id, tool):
    try:
        project = Project.objects.get(id=project_id, owner=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Project not found or unauthorized."}, status=404)

    model_map = {
        "markdown": (MarkdownContent, MarkdownSerializer),
        "richtext": (RichTextContent, RichTextSerializer),
        "latex": (LaTeXContent, LaTeXSerializer),
        "code": (CodeContent, CodeSerializer),
        "notebook": (NotebookContent, NotebookSerializer),
    }

    if tool not in model_map:
        return Response({"detail": "Invalid tool."}, status=400)

    model, serializer_class = model_map[tool]
    content, _ = model.objects.get_or_create(project=project)

    if request.method == "PUT":
        data = request.data.copy()
        data["project"] = str(project.id)  # Inject project into data

        serializer = serializer_class(content, data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    return Response(serializer_class(content).data)

