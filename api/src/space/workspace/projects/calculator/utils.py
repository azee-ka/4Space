# utils.py

import re
import logging
from sympy import (
    Eq, Integral, simplify, solve, latex, Mul, Matrix, And, Or, Not, symbols, Symbol
)
from sympy.parsing.latex import parse_latex
from sympy.core.sympify import sympify, SympifyError
from sympy.logic.boolalg import BooleanFunction

logger = logging.getLogger(__name__)


def normalize_latex(expr):
    expr = expr.replace("\\cdot", "*").replace("\\times", "*")
    expr = re.sub(r'(?<=[0-9])(?=[a-zA-Z])', '*', expr)  # 2x -> 2*x
    expr = expr.replace("\\land", "&").replace("\\lor", "|").replace("\\neg", "~")
    return expr


def fix_multiplication_structure(expr):
    if isinstance(expr, Mul):
        coeffs = []
        integral = None
        for arg in expr.args:
            if isinstance(arg, Integral):
                integral = arg
            else:
                coeffs.append(arg)
        if integral:
            return Integral(Mul(*coeffs) * integral.function, *integral.limits)
    return expr


def detect_expression_type(expr):
    if isinstance(expr, Matrix):
        return "matrix"
    if isinstance(expr, Eq):
        return "equation"
    if isinstance(expr, Integral):
        return "integral"
    if isinstance(expr, BooleanFunction):
        return "logic"
    return "general"


def compute_expression(input_latex):
    expr = normalize_latex(input_latex)

    # Try parsing LaTeX
    try:
        parsed = parse_latex(expr)
    except Exception as e:
        logger.warning(f"LaTeX parse failed: {e}, attempting sympify fallback.")
        try:
            parsed = sympify(expr)
        except SympifyError as fallback_err:
            raise ValueError(f"Invalid expression: {input_latex} → {fallback_err}")

    parsed = fix_multiplication_structure(parsed)

    expr_type = detect_expression_type(parsed)
    result = None

    try:
        if expr_type == "equation":
            result = solve(parsed)
        elif expr_type == "integral":
            result = parsed.doit()
        elif expr_type == "matrix":
            result = parsed
        elif expr_type == "logic":
            result = simplify(parsed)
        else:
            result = simplify(parsed)

        return latex(result), str(result)

    except Exception as solve_err:
        logger.exception("Error during solving/simplification")
        raise ValueError(f"Evaluation error: {solve_err}")
