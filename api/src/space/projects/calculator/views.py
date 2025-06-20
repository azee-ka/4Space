# views.py

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework import status

from .models import CalculatorExpression
from .serializers import CalculatorExpressionSerializer
from .utils import compute_expression

import logging
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def solve_expression(request):
    expression = request.data.get("expression")

    if not isinstance(expression, str) or not expression.strip():
        return Response(
            {"error": "Missing or invalid 'expression' in request."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        input_latex = expression.strip()
        output_latex, raw_result = compute_expression(input_latex)

        record = CalculatorExpression.objects.create(
            user=request.user,
            input_latex=input_latex,
            output_latex=output_latex,
            raw_result=raw_result
        )

        return Response(CalculatorExpressionSerializer(record).data)

    except ImportError as e:
        if "antlr4" in str(e).lower():
            return Response({
                "error": "LaTeX parsing requires the ANTLR4 runtime. Install it using: pip install antlr4-python3-runtime==4.11"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.exception("Computation failed")
        return Response(
            {"error": f"Failed to solve the expression: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_calculations(request):
    records = CalculatorExpression.objects.filter(user=request.user).order_by('-created_at')
    return Response(CalculatorExpressionSerializer(records, many=True).data)
