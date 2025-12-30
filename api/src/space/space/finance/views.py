# api/src/space/finance/views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from src.space.space.models import Space, SpaceWidget
from .models import (
    PortfolioAccount, PortfolioHolding, PortfolioTransaction, PortfolioStats,
    Expense, ExpenseCategory, ExpenseStats,
    Budget, BudgetLineItem, BudgetStats,
    CryptoHolding
)
from .serializers import (
    PortfolioAccountSerializer, PortfolioHoldingSerializer, 
    PortfolioTransactionSerializer, PortfolioStatsSerializer,
    ExpenseSerializer, ExpenseCategorySerializer, ExpenseStatsSerializer,
    BudgetSerializer, BudgetLineItemSerializer, BudgetStatsSerializer,
    CryptoHoldingSerializer, BulkApproveExpensesSerializer
)


# ============================================================================
# PORTFOLIO MANAGER VIEWS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def portfolio_accounts_list_create(request, space_id, widget_id):
    """List all accounts or create a new account"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    # Check permissions
    if not space.members.filter(id=request.user.id).exists():
        return Response({'error': 'Not a member of this space'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        accounts = PortfolioAccount.objects.filter(space=space, widget=widget, is_active=True)
        serializer = PortfolioAccountSerializer(accounts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PortfolioAccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(space=space, widget=widget, owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def portfolio_account_detail(request, space_id, widget_id, account_id):
    """Retrieve, update, or delete an account"""
    account = get_object_or_404(PortfolioAccount, id=account_id, space_id=space_id, widget_id=widget_id)
    
    if request.method == 'GET':
        serializer = PortfolioAccountSerializer(account)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = PortfolioAccountSerializer(account, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_holdings_list(request, space_id, widget_id):
    """List all holdings, optionally filtered by account"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    account_id = request.query_params.get('account')
    
    holdings = PortfolioHolding.objects.filter(account__space=space, account__widget=widget)
    
    if account_id:
        holdings = holdings.filter(account_id=account_id)
    
    holdings = holdings.select_related('account')
    
    serializer = PortfolioHoldingSerializer(holdings, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def portfolio_transactions_list_create(request, space_id, widget_id):
    """List transactions or create a new transaction"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if request.method == 'GET':
        account_id = request.query_params.get('account')
        
        transactions = PortfolioTransaction.objects.filter(
            account__space=space,
            account__widget=widget
        )
        
        if account_id:
            transactions = transactions.filter(account_id=account_id)
        
        transactions = transactions.select_related('account', 'holding', 'created_by')[:100]
        
        serializer = PortfolioTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        account_id = request.data.get('account')
        account = get_object_or_404(PortfolioAccount, id=account_id, space=space, widget=widget)
        
        serializer = PortfolioTransactionSerializer(data=request.data)
        if serializer.is_valid():
            transaction = serializer.save(created_by=request.user)
            
            # Update holdings and account values
            update_portfolio_from_transaction(transaction)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_stats(request, space_id, widget_id):
    """Get portfolio statistics"""
    widget = get_object_or_404(SpaceWidget, id=widget_id, space_id=space_id)
    
    stats, created = PortfolioStats.objects.get_or_create(widget=widget)
    
    # Update stats if stale (older than 1 hour)
    if created or (timezone.now() - stats.updated_at) > timedelta(hours=1):
        update_portfolio_stats(widget, stats)
    
    serializer = PortfolioStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_portfolio_prices(request, space_id, widget_id):
    """Sync current prices for all holdings (placeholder for price API integration)"""
    widget = get_object_or_404(SpaceWidget, id=widget_id, space_id=space_id)
    
    # TODO: Integrate with price API (Alpha Vantage, IEX Cloud, etc.)
    # For now, return success
    
    holdings = PortfolioHolding.objects.filter(account__widget=widget)
    for holding in holdings:
        holding.last_price_update = timezone.now()
        holding.save()
    
    # Update stats
    stats = PortfolioStats.objects.get(widget=widget)
    update_portfolio_stats(widget, stats)
    
    return Response({'message': 'Prices synced successfully'})


# ============================================================================
# EXPENSE MANAGER VIEWS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expenses_list_create(request, space_id, widget_id):
    """List expenses or create a new expense"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if request.method == 'GET':
        expenses = Expense.objects.filter(space=space, widget=widget)
        
        # Filters
        status_filter = request.query_params.get('status')
        category_id = request.query_params.get('category')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        limit = request.query_params.get('limit')
        
        if status_filter:
            expenses = expenses.filter(status=status_filter)
        if category_id:
            expenses = expenses.filter(category_id=category_id)
        if date_from:
            expenses = expenses.filter(date__gte=date_from)
        if date_to:
            expenses = expenses.filter(date__lte=date_to)
        
        expenses = expenses.select_related('category', 'submitted_by', 'approved_by')
        expenses = expenses.order_by('-date', '-created_at')
        
        if limit:
            expenses = expenses[:int(limit)]
        
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(space=space, widget=widget, submitted_by=request.user)
            
            # Update stats
            update_expense_stats(widget)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, space_id, widget_id, expense_id):
    """Retrieve, update, or delete an expense"""
    expense = get_object_or_404(Expense, id=expense_id, space_id=space_id, widget_id=widget_id)
    
    if request.method == 'GET':
        serializer = ExpenseSerializer(expense)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            update_expense_stats(expense.widget)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        widget = expense.widget
        expense.delete()
        update_expense_stats(widget)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_expense(request, space_id, widget_id, expense_id):
    """Approve an expense"""
    expense = get_object_or_404(Expense, id=expense_id, space_id=space_id, widget_id=widget_id)
    
    expense.status = 'approved'
    expense.approved_by = request.user
    expense.approved_at = timezone.now()
    expense.save()
    
    update_expense_stats(expense.widget)
    
    serializer = ExpenseSerializer(expense)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_expense(request, space_id, widget_id, expense_id):
    """Reject an expense"""
    expense = get_object_or_404(Expense, id=expense_id, space_id=space_id, widget_id=widget_id)
    
    rejection_reason = request.data.get('rejection_reason', '')
    
    expense.status = 'rejected'
    expense.approved_by = request.user
    expense.approved_at = timezone.now()
    expense.rejection_reason = rejection_reason
    expense.save()
    
    update_expense_stats(expense.widget)
    
    serializer = ExpenseSerializer(expense)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_approve_expenses(request, space_id, widget_id):
    """Bulk approve expenses"""
    widget = get_object_or_404(SpaceWidget, id=widget_id, space_id=space_id)
    
    serializer = BulkApproveExpensesSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    expense_ids = serializer.validated_data['expense_ids']
    
    expenses = Expense.objects.filter(
        id__in=expense_ids,
        space_id=space_id,
        widget=widget,
        status='pending'
    )
    
    count = expenses.update(
        status='approved',
        approved_by=request.user,
        approved_at=timezone.now()
    )
    
    update_expense_stats(widget)
    
    return Response({'approved_count': count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_categories_list(request, space_id, widget_id):
    """List expense categories"""
    widget = get_object_or_404(SpaceWidget, id=widget_id, space_id=space_id)
    
    categories = ExpenseCategory.objects.filter(space_id=space_id, widget=widget)
    serializer = ExpenseCategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_stats(request, space_id, widget_id):
    """Get expense statistics"""
    widget = get_object_or_404(SpaceWidget, id=widget_id, space_id=space_id)
    
    stats, created = ExpenseStats.objects.get_or_create(widget=widget)
    
    # Update if stale
    if created or (timezone.now() - stats.updated_at) > timedelta(hours=1):
        update_expense_stats(widget, stats)
    
    serializer = ExpenseStatsSerializer(stats)
    return Response(serializer.data)


# ============================================================================
# BUDGET MANAGER VIEWS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def budgets_list_create(request, space_id, widget_id):
    """List budgets or create a new budget"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if request.method == 'GET':
        budgets = Budget.objects.filter(space=space, widget=widget)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            budgets = budgets.filter(status=status_filter)
        
        budgets = budgets.select_related('owner')
        
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = BudgetSerializer(data=request.data)
        if serializer.is_valid():
            budget = serializer.save(space=space, widget=widget, owner=request.user)
            budget.total_remaining = budget.total_budget
            budget.save()
            
            update_budget_stats(widget)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def budget_detail(request, space_id, widget_id, budget_id):
    """Retrieve, update, or delete a budget"""
    budget = get_object_or_404(Budget, id=budget_id, space_id=space_id, widget_id=widget_id)
    
    if request.method == 'GET':
        serializer = BudgetSerializer(budget)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = BudgetSerializer(budget, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            update_budget_stats(budget.widget)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        widget = budget.widget
        budget.delete()
        update_budget_stats(widget)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def budget_line_items(request, space_id, widget_id, budget_id):
    """List or create budget line items"""
    budget = get_object_or_404(Budget, id=budget_id, space_id=space_id, widget_id=widget_id)
    
    if request.method == 'GET':
        line_items = BudgetLineItem.objects.filter(budget=budget).select_related('category')
        serializer = BudgetLineItemSerializer(line_items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = BudgetLineItemSerializer(data=request.data)
        if serializer.is_valid():
            line_item = serializer.save(budget=budget)
            line_item.remaining_amount = line_item.budgeted_amount
            line_item.save()
            
            # Update budget totals
            update_budget_totals(budget)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_stats(request, space_id, widget_id):
    """Get budget statistics"""
    widget = get_object_or_404(SpaceWidget, id=widget_id, space_id=space_id)
    
    stats, created = BudgetStats.objects.get_or_create(widget=widget)
    
    if created or (timezone.now() - stats.updated_at) > timedelta(hours=1):
        update_budget_stats(widget, stats)
    
    serializer = BudgetStatsSerializer(stats)
    return Response(serializer.data)


# ============================================================================
# CRYPTO TRACKER VIEWS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def crypto_holdings_list_create(request, space_id, widget_id):
    """List or create crypto holdings"""
    space = get_object_or_404(Space, id=space_id)
    widget = get_object_or_404(SpaceWidget, id=widget_id, space=space)
    
    if request.method == 'GET':
        holdings = CryptoHolding.objects.filter(space=space, widget=widget)
        serializer = CryptoHoldingSerializer(holdings, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CryptoHoldingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(space=space, widget=widget, owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def update_portfolio_from_transaction(transaction):
    """Update holdings and account values after a transaction"""
    if transaction.transaction_type in ['buy', 'sell']:
        holding, created = PortfolioHolding.objects.get_or_create(
            account=transaction.account,
            symbol=transaction.symbol,
            defaults={
                'name': transaction.symbol,
                'asset_type': 'stock',
                'shares': 0,
                'average_cost': 0,
                'cost_basis': 0,
                'current_price': transaction.price or 0
            }
        )
        
        if transaction.transaction_type == 'buy':
            # Update shares and average cost
            total_cost = (holding.shares * holding.average_cost) + (transaction.shares * transaction.price)
            total_shares = holding.shares + transaction.shares
            
            holding.shares = total_shares
            holding.average_cost = total_cost / total_shares if total_shares > 0 else 0
            holding.cost_basis = total_cost
            holding.current_price = transaction.price
            
        elif transaction.transaction_type == 'sell':
            holding.shares -= transaction.shares
            if holding.shares <= 0:
                holding.delete()
                return
            holding.cost_basis = holding.shares * holding.average_cost
        
        holding.update_market_value()
    
    # Update account totals
    account = transaction.account
    holdings = PortfolioHolding.objects.filter(account=account)
    
    account.cost_basis = sum(h.cost_basis for h in holdings)
    account.current_value = sum(h.market_value for h in holdings)
    account.total_gain = account.current_value - account.cost_basis
    if account.cost_basis > 0:
        account.gain_percent = (account.total_gain / account.cost_basis) * 100
    account.save()


def update_portfolio_stats(widget, stats=None):
    """Update portfolio statistics"""
    if stats is None:
        stats, _ = PortfolioStats.objects.get_or_create(widget=widget)
    
    accounts = PortfolioAccount.objects.filter(widget=widget, is_active=True)
    
    stats.total_value = sum(a.current_value for a in accounts)
    stats.total_cost_basis = sum(a.cost_basis for a in accounts)
    stats.total_gain = stats.total_value - stats.total_cost_basis
    if stats.total_cost_basis > 0:
        stats.total_gain_percent = (stats.total_gain / stats.total_cost_basis) * 100
    
    stats.total_holdings = PortfolioHolding.objects.filter(account__widget=widget).count()
    
    # TODO: Calculate today_change and ytd_return from historical data
    stats.today_change = 0
    stats.ytd_return = 0
    
    stats.save()


def update_expense_stats(widget, stats=None):
    """Update expense statistics"""
    if stats is None:
        stats, _ = ExpenseStats.objects.get_or_create(widget=widget)
    
    expenses = Expense.objects.filter(widget=widget)
    
    stats.total_expenses = expenses.count()
    
    now = timezone.now()
    month_expenses = expenses.filter(date__year=now.year, date__month=now.month)
    stats.month_total = sum(e.amount for e in month_expenses if e.status == 'approved')
    
    stats.pending_count = expenses.filter(status='pending').count()
    stats.approved_count = expenses.filter(status='approved').count()
    stats.rejected_count = expenses.filter(status='rejected').count()
    
    pending_expenses = expenses.filter(status='pending')
    stats.pending_amount = sum(e.amount for e in pending_expenses)
    
    stats.save()


def update_budget_stats(widget, stats=None):
    """Update budget statistics"""
    if stats is None:
        stats, _ = BudgetStats.objects.get_or_create(widget=widget)
    
    budgets = Budget.objects.filter(widget=widget)
    
    stats.total_budgets = budgets.count()
    
    active_budgets = budgets.filter(status='active')
    stats.active_budget_total = sum(b.total_budget for b in active_budgets)
    stats.active_budget_spent = sum(b.total_spent for b in active_budgets)
    stats.active_budget_remaining = stats.active_budget_total - stats.active_budget_spent
    
    if stats.active_budget_total > 0:
        stats.utilization_percent = (stats.active_budget_spent / stats.active_budget_total) * 100
    else:
        stats.utilization_percent = 0
    
    stats.save()


def update_budget_totals(budget):
    """Update budget total amounts from line items"""
    line_items = BudgetLineItem.objects.filter(budget=budget)
    
    budget.total_budget = sum(item.budgeted_amount for item in line_items)
    budget.total_spent = sum(item.spent_amount for item in line_items)
    budget.total_remaining = budget.total_budget - budget.total_spent
    budget.save()