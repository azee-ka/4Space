# ai_math_router.py

import re
from src.space.space.llm_engine import run_remote_llm

def ai_clean_latex(expr: str) -> str:
    prompt = f"""You are a LaTeX math fixer. Clean the following LaTeX math expression so it is valid and parseable. Return only the corrected expression with no explanation:

LaTeX: {expr}
Clean:
"""
    return run_remote_llm(prompt).strip()


def ai_detect_type(expr: str) -> str:
    prompt = f"""
You are a math classifier. Given this LaTeX/math expression, classify it into one of these categories:
- algebra
- calculus
- logic
- matrix
- numerical
- equation
- set
- other

Expression: {expr}
Type (one word):
"""
    return run_remote_llm(prompt).strip().lower()
