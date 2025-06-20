# utils.py

import re
import logging
from sympy import Eq, Integral, simplify, solve, latex, Mul
from sympy.parsing.latex import parse_latex
from sympy.core.sympify import sympify, SympifyError

logger = logging.getLogger(__name__)


def normalize_latex(expr):
    expr = expr.replace("\\cdot", "*").replace("\\times", "*")
    expr = re.sub(r'(?<=[0-9])(?=[a-zA-Z])', '*', expr)
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


def compute_expression(input_latex):
    expr = normalize_latex(input_latex)

    try:
        parsed = parse_latex(expr)
    except Exception as e:
        logger.warning(f"LaTeX parse failed: {e}, attempting fallback.")
        try:
            parsed = sympify(expr)
        except SympifyError as fallback_err:
            raise ValueError(f"Invalid expression: {input_latex} → {fallback_err}")

    parsed = fix_multiplication_structure(parsed)

    try:
        if isinstance(parsed, Eq):
            result = solve(parsed)
        elif isinstance(parsed, Integral):
            result = parsed.doit()
        else:
            result = simplify(parsed)

        return latex(result), str(result)

    except Exception as solve_err:
        logger.exception("Error during solving/simplification")
        raise ValueError(f"Evaluation error: {solve_err}")
