import requests
import logging
from celery import shared_task
from django.conf import settings
from .models import Stock
from django.db import transaction

logger = logging.getLogger(__name__)

@shared_task
def update_stock_data():
    api_token = settings.REACT_APP_WEBSOCKET_TOKEN
    base_url = 'https://finnhub.io/api/v1'
    response = requests.get(f'{base_url}/stock/symbol?exchange=US&token={api_token}')
    
    if response.status_code == 200:
        data = response.json()
        print(data[0])
        with transaction.atomic():  # Use transaction.atomic to wrap database operations
            for stock in data:
                Stock.objects.update_or_create(
                    symbol=stock['symbol'],
                    defaults={
                        'description': stock['description'],
                        'display_symbol': stock['displaySymbol'],
                        'type': stock['type']
                    }
                )
            logger.info('Stock data updated successfully')
    else:
        logger.error(f'Failed to fetch stock data. Status code: {response.status_code}')