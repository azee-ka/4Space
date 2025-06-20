# views.py

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework import status
import logging

from .models import CalculatorExpression
from .serializers import CalculatorExpressionSerializer
from .utils import compute_expression

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def solve_expression(request):
    expression = request.data.get("expression")
    if not isinstance(expression, str) or not expression.strip():
        return Response({"error": "Missing or invalid 'expression'."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        latex_out, raw_result = compute_expression(expression.strip())

        record = CalculatorExpression.objects.create(
            user=request.user,
            input_latex=expression,
            output_latex=latex_out,
            raw_result=raw_result
        )
        return Response(CalculatorExpressionSerializer(record).data)

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception("Unhandled error")
        return Response({"error": "Unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_calculations(request):
    records = CalculatorExpression.objects.filter(user=request.user).order_by('-created_at')
    return Response(CalculatorExpressionSerializer(records, many=True).data)
