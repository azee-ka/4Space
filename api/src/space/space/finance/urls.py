# api/src/space/finance/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # ============================================================================
    # PORTFOLIO MANAGER URLS
    # ============================================================================
    
    # Accounts
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/portfolio/accounts/',
        views.portfolio_accounts_list_create,
        name='portfolio-accounts-list-create'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/portfolio/accounts/<uuid:account_id>/',
        views.portfolio_account_detail,
        name='portfolio-account-detail'
    ),
    
    # Holdings
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/portfolio/holdings/',
        views.portfolio_holdings_list,
        name='portfolio-holdings-list'
    ),
    
    # Transactions
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/portfolio/transactions/',
        views.portfolio_transactions_list_create,
        name='portfolio-transactions-list-create'
    ),
    
    # Stats & Actions
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/portfolio/stats/',
        views.portfolio_stats,
        name='portfolio-stats'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/portfolio/sync-prices/',
        views.sync_portfolio_prices,
        name='sync-portfolio-prices'
    ),
    
    # ============================================================================
    # EXPENSES MANAGER URLS
    # ============================================================================
    
    # Expenses
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/',
        views.expenses_list_create,
        name='expenses-list-create'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/<uuid:expense_id>/',
        views.expense_detail,
        name='expense-detail'
    ),
    
    # Expense Actions
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/<uuid:expense_id>/approve/',
        views.approve_expense,
        name='approve-expense'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/<uuid:expense_id>/reject/',
        views.reject_expense,
        name='reject-expense'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/bulk-approve/',
        views.bulk_approve_expenses,
        name='bulk-approve-expenses'
    ),
    
    # Categories & Stats
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/categories/',
        views.expense_categories_list,
        name='expense-categories-list'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/expenses/stats/',
        views.expense_stats,
        name='expense-stats'
    ),
    
    # ============================================================================
    # BUDGET MANAGER URLS
    # ============================================================================
    
    # Budgets
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/budgets/',
        views.budgets_list_create,
        name='budgets-list-create'
    ),
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/budgets/<uuid:budget_id>/',
        views.budget_detail,
        name='budget-detail'
    ),
    
    # Budget Line Items
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/budgets/<uuid:budget_id>/items/',
        views.budget_line_items,
        name='budget-line-items'
    ),
    
    # Stats
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/budgets/stats/',
        views.budget_stats,
        name='budget-stats'
    ),
    
    # ============================================================================
    # CRYPTO TRACKER URLS
    # ============================================================================
    
    # Crypto Holdings
    path(
        '<uuid:space_id>/widgets/<uuid:widget_id>/crypto/holdings/',
        views.crypto_holdings_list_create,
        name='crypto-holdings-list-create'
    ),
]
