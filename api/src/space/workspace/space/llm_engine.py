import requests

def run_remote_llm(prompt: str, model="llama3:2"):
    try:
        res = requests.post("http://localhost:11434/api/generate", json={
            "model": model,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.7,
            "max_tokens": 1024
        })
        return res.json()["response"]
    except Exception as e:
        print("❌ Ollama call failed:", e)
        return "Agent failed to generate a result."
