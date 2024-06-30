# stocks/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from .models import Stock, Watchlist
from .serializers import StockSerializer, WatchlistSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_search_view(request):
    try:
        search_query = request.GET.get('query', '')
        if search_query:
            results = Stock.objects.filter(Q(symbol__icontains=search_query))
            
    except ObjectDoesNotExist:
        # No stocks found
        return Response([], status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Other unexpected errors
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    serializer = StockSerializer(results, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def stock_list(request):
    if request.method == 'GET':
        stocks = Stock.objects.all()
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = StockSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def stock_detail(request, pk):
    try:
        stock = Stock.objects.get(pk=pk)
    except Stock.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = StockSerializer(stock)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = StockSerializer(stock, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        stock.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def watchlist_view(request):
    try:
        user = request.user
        watchlist = Watchlist.objects.get(user=user)
        stocks = watchlist.stocks.all()
        
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data, status=200)
    
    except Watchlist.DoesNotExist:
        return Response({'message': 'Watchlist is empty'}, status=200)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_watchlist_view(request, stock_id):
    try:
        stock = get_object_or_404(Stock, pk=stock_id)
        user = request.user
        
        # Check if the stock is already in the user's watchlist
        watchlist, created = Watchlist.objects.get_or_create(user=user)
        if stock in watchlist.stocks.all():
            return Response({'message': 'Stock already in watchlist'}, status=400)
        
        # Add the stock to the watchlist
        watchlist.stocks.add(stock)
        watchlist.save()
        
        return Response({'message': 'Stock added to watchlist'}, status=200)
    
    except Stock.DoesNotExist:
        return Response({'error': 'Stock not found'}, status=404)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)