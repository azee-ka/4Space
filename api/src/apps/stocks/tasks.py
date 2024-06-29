import requests
import logging
from celery import shared_task
from django.conf import settings
from .models import Stock
from django.db import transaction
import math

logger = logging.getLogger(__name__)

@shared_task
def update_stock_data():
    api_token = settings.REACT_APP_WEBSOCKET_TOKEN
    base_url = 'https://finnhub.io/api/v1'
    response = requests.get(f'{base_url}/stock/symbol?exchange=US&token={api_token}')
    
    if response.status_code == 200:
        data = response.json()
        batch_size = 50
        total_batches = math.ceil(len(data) / batch_size)
        
        for i in range(total_batches):
            batch_data = data[i*batch_size:(i+1)*batch_size]
            update_stock_batch.apply_async((batch_data,), countdown=i*60)
        
        logger.info('Scheduled all batches for stock data update.')
    else:
        logger.error(f'Failed to fetch stock data. Status code: {response.status_code}')

@shared_task
def update_stock_batch(batch_data):
    api_token = settings.REACT_APP_WEBSOCKET_TOKEN
    base_url = 'https://finnhub.io/api/v1'
    
    current_batch = 1
    with transaction.atomic():  # Use transaction.atomic to wrap database operations
        for stock in batch_data:
            print(f'current_batch {current_batch}')
            symbol = stock['symbol']
            detailed_url = f'{base_url}/stock/profile2?symbol={symbol}&token={api_token}'
            detailed_response = requests.get(detailed_url)
            
            if detailed_response.status_code == 200:
                detailed_data = detailed_response.json()
                print(f'detailed_data {detailed_data}')
                stock_obj = Stock.objects.update_or_create(
                    symbol=symbol,
                    defaults={
                        'symbol': stock['symbol'],
                        'display_symbol': stock['displaySymbol'],
                        'description': stock['description'],
                        'market_capitalization': detailed_data.get('marketCapitalization'),
                        'name': detailed_data.get('name'),
                        'ticker': detailed_data.get('ticker'),
                        'logo': detailed_data.get('logo'),
                        'industry': detailed_data.get('industry'),
                    }
                )
                print(f'object created: {stock_obj}')
            else:
                logger.error(f'Failed to fetch detailed data for {symbol}. Status code: {detailed_response.status_code}')
            
    logger.info(f'Successfully updated stock data for batch starting with symbol {batch_data[0]["symbol"]}')
