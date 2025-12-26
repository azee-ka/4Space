import json
import re
import requests
from typing import List, Dict, Iterator

OLLAMA_MODELS = ["mistral:latest", "llama3.2:latest", "llama3:instruct", "llama3:8b"]

def run_remote_llm_stream(prompt: str) -> Iterator[str]:
    """
    Yield each token chunk from Ollama as it arrives.
    """
    for model in OLLAMA_MODELS:
        try:
            with requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": True,
                    "temperature": 0.7,
                    "max_tokens": 1024
                },
                stream=True,
                timeout=120
            ) as res:
                res.raise_for_status()
                for line in res.iter_lines():
                    if not line:
                        continue
                    payload = json.loads(line)
                    token = payload.get("response", "")
                    if token:
                        yield token
                return
        except Exception:
            continue
    # fallback if none succeeded
    yield "\n❌ All models failed to generate output.\n"



def run_remote_llm(prompt: str) -> str:
    for model in OLLAMA_MODELS:
        print(f"🔍 Trying model: {model}")
        try:
            with requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": True,
                    "temperature": 0.7,
                    "max_tokens": 1024
                },
                stream=True,
                timeout=120
            ) as res:
                res.raise_for_status()
                chunks = []
                for line in res.iter_lines():
                    if line:
                        try:
                            payload = json.loads(line)
                            chunks.append(payload.get("response", ""))
                        except Exception as e:
                            print("⚠️ Error parsing line:", line, e)
                return "".join(chunks).strip()

        except Exception as e:
            print(f"❌ Model '{model}' failed:", e)

    return "All models failed to generate output."





def _parse_tasks(raw: str) -> List[Dict]:
    # 1) direct load
    try:
        return json.loads(raw)
    except Exception:
        pass

    # 2) raw_decode (skipping any preamble)
    try:
        tasks, _ = json.JSONDecoder().raw_decode(raw)
        return tasks
    except Exception:
        pass

    # 3) first [...] span
    start = raw.find('[')
    end   = raw.rfind(']')
    if start != -1 and end != -1 and end > start:
        snippet = raw[start:end+1]
        try:
            return json.loads(snippet)
        except Exception:
            pass

    # 4) extract individual {...} blocks
    objs = re.findall(r'\{[\s\S]*?\}', raw)
    tasks = []
    for o in objs:
        try:
            tasks.append(json.loads(o))
        except Exception:
            continue
    return tasks

def split_tasks(prompt: str) -> List[Dict]:
    """
    Always delegate splitting logic to the LLM; then parse robustly.
    """
    instruction = f"""
You are a senior project planner.  The user’s request is:

“{prompt}”

**Step 1**: If this can be answered in one shot (simple Q&A or very short directive),
return exactly one task:
[
  {{
    "name": "Answer prompt",
    "role": "General",
    "description": "{prompt}"
  }}
]

**Step 2**: Otherwise, split into the **fewest possible** independent subtasks.
Each must cover a unique slice of work—no overlap.
For each task, supply:
  • name: a concise title (3–5 words)  
  • role: one of [Research, Design, Implementation, QA, General]  
  • description: one sentence describing only that task  

**Output** *only* the JSON array of tasks—no extra text, no markdown, no commentary.
"""
    raw = run_remote_llm(instruction)
    tasks = _parse_tasks(raw)

    # Validate & clean
    clean: List[Dict] = []
    for t in (tasks if isinstance(tasks, list) else []):
        if (
            isinstance(t, dict)
            and isinstance(t.get("name"), str)
            and isinstance(t.get("role"), str)
            and isinstance(t.get("description"), str)
        ):
            clean.append({
                "name": t["name"].strip(),
                "role": t["role"].strip(),
                "description": t["description"].strip(),
            })

    # Fallback to single answer if nothing parsed
    if not clean:
        clean = [{
            "name": "Answer prompt",
            "role": "General",
            "description": prompt
        }]

    return clean