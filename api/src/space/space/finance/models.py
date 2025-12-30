# api/src/space/finance/models.py

import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from src.space.space.models import Space, SpaceWidget


# ============================================================================
# PORTFOLIO MANAGER MODELS
# ============================================================================

class PortfolioAccount(models.Model):
    """
    Investment accounts (brokerage, 401k, IRA, etc.)
    """
    ACCOUNT_TYPES = [
        ('brokerage', 'Brokerage'),
        ('401k', '401(k)'),
        ('ira', 'IRA'),
        ('roth_ira', 'Roth IRA'),
        ('hsa', 'HSA'),
        ('crypto', 'Crypto Wallet'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='portfolio_accounts')
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='portfolio_accounts')
    
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=50, choices=ACCOUNT_TYPES)
    account_number = models.CharField(max_length=100, blank=True)
    
    institution = models.CharField(max_length=255, blank=True)
    color = models.CharField(max_length=7, default='#3b82f6')
    
    # Aggregated values (updated via transactions)
    cost_basis = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_gain = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    gain_percent = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    
    is_active = models.BooleanField(default=True)
    
    owner = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='portfolio_accounts'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-current_value', 'name']
        indexes = [
            models.Index(fields=['space', 'widget']),
            models.Index(fields=['owner', '-current_value']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.owner.username}"


class PortfolioHolding(models.Model):
    """
    Individual holdings (stocks, bonds, etc.) within an account
    """
    ASSET_TYPES = [
        ('stock', 'Stock'),
        ('etf', 'ETF'),
        ('mutual_fund', 'Mutual Fund'),
        ('bond', 'Bond'),
        ('crypto', 'Cryptocurrency'),
        ('option', 'Option'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(PortfolioAccount, on_delete=models.CASCADE, related_name='holdings')
    
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=255, blank=True)
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPES, default='stock')
    
    shares = models.DecimalField(max_digits=15, decimal_places=4)
    average_cost = models.DecimalField(max_digits=15, decimal_places=4)
    cost_basis = models.DecimalField(max_digits=15, decimal_places=2)
    
    current_price = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    market_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Calculated fields
    total_gain = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    gain_percent = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    
    # Price update tracking
    last_price_update = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-market_value', 'symbol']
        unique_together = [['account', 'symbol']]
        indexes = [
            models.Index(fields=['account', '-market_value']),
            models.Index(fields=['symbol']),
        ]
    
    def __str__(self):
        return f"{self.symbol} - {self.shares} shares"
    
    def update_market_value(self):
        """Recalculate market value and gains"""
        self.market_value = self.shares * self.current_price
        self.total_gain = self.market_value - self.cost_basis
        if self.cost_basis > 0:
            self.gain_percent = (self.total_gain / self.cost_basis) * 100
        self.save()


class PortfolioTransaction(models.Model):
    """
    Buy/sell transactions for portfolio holdings
    """
    TRANSACTION_TYPES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
        ('dividend', 'Dividend'),
        ('interest', 'Interest'),
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
        ('split', 'Stock Split'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(PortfolioAccount, on_delete=models.CASCADE, related_name='transactions')
    holding = models.ForeignKey(PortfolioHolding, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    symbol = models.CharField(max_length=20, blank=True)
    
    shares = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    price = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    fees = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    date = models.DateField()
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='portfolio_transactions'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['account', '-date']),
            models.Index(fields=['holding', '-date']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.symbol or 'N/A'} - {self.date}"


class PortfolioStats(models.Model):
    """
    Cached statistics for portfolio widgets
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.OneToOneField(
        SpaceWidget,
        on_delete=models.CASCADE,
        related_name='portfolio_stats'
    )
    
    total_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost_basis = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_gain = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_gain_percent = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    
    total_holdings = models.IntegerField(default=0)
    today_change = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    ytd_return = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stats for {self.widget.name}"


# ============================================================================
# EXPENSES MANAGER MODELS
# ============================================================================

class ExpenseCategory(models.Model):
    """
    Categories for expense classification
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='expense_categories')
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='expense_categories')
    
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#6b7280')
    icon = models.CharField(max_length=50, default='tag')
    
    budget_limit = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Monthly budget limit for this category"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Expense Categories'
        unique_together = [['space', 'widget', 'name']]
    
    def __str__(self):
        return self.name


class Expense(models.Model):
    """
    Individual expense records
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='expenses')
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='expenses')
    
    merchant = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=3, default='USD')
    
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, related_name='expenses')
    
    date = models.DateField()
    description = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Receipt
    receipt = models.FileField(upload_to='expenses/receipts/%Y/%m/', null=True, blank=True)
    receipt_url = models.URLField(blank=True)
    
    # Submitter and approver
    submitted_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_expenses'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    rejection_reason = models.TextField(blank=True)
    
    # Reimbursement
    is_reimbursable = models.BooleanField(default=True)
    is_reimbursed = models.BooleanField(default=False)
    reimbursed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['space', 'widget', '-date']),
            models.Index(fields=['submitted_by', '-date']),
            models.Index(fields=['status', '-date']),
            models.Index(fields=['category', '-date']),
        ]
    
    def __str__(self):
        return f"{self.merchant} - ${self.amount} - {self.date}"


class ExpenseStats(models.Model):
    """
    Cached statistics for expense widgets
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.OneToOneField(
        SpaceWidget,
        on_delete=models.CASCADE,
        related_name='expense_stats'
    )
    
    total_expenses = models.IntegerField(default=0)
    month_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pending_count = models.IntegerField(default=0)
    approved_count = models.IntegerField(default=0)
    rejected_count = models.IntegerField(default=0)
    pending_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stats for {self.widget.name}"


# ============================================================================
# BUDGET MANAGER MODELS
# ============================================================================

class Budget(models.Model):
    """
    Budget periods (monthly, quarterly, annual)
    """
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='budgets')
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='budgets')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    
    total_budget = models.DecimalField(max_digits=15, decimal_places=2)
    total_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_remaining = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    owner = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['space', 'widget', '-start_date']),
            models.Index(fields=['status', '-start_date']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.period}"


class BudgetLineItem(models.Model):
    """
    Individual line items within a budget
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='line_items')
    
    name = models.CharField(max_length=255)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='budget_items')
    
    budgeted_amount = models.DecimalField(max_digits=15, decimal_places=2)
    spent_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['budget', 'category']),
        ]
    
    def __str__(self):
        return f"{self.name} - ${self.budgeted_amount}"


class BudgetStats(models.Model):
    """
    Cached statistics for budget widgets
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    widget = models.OneToOneField(
        SpaceWidget,
        on_delete=models.CASCADE,
        related_name='budget_stats'
    )
    
    total_budgets = models.IntegerField(default=0)
    active_budget_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    active_budget_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    active_budget_remaining = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    utilization_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stats for {self.widget.name}"


# ============================================================================
# CRYPTO TRACKER MODELS
# ============================================================================

class CryptoHolding(models.Model):
    """
    Cryptocurrency holdings
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='crypto_holdings')
    widget = models.ForeignKey(SpaceWidget, on_delete=models.CASCADE, related_name='crypto_holdings')
    
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=255)
    
    amount = models.DecimalField(max_digits=25, decimal_places=10)
    average_cost = models.DecimalField(max_digits=15, decimal_places=4)
    cost_basis = models.DecimalField(max_digits=15, decimal_places=2)
    
    current_price = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    market_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    total_gain = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    gain_percent = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    
    wallet_address = models.CharField(max_length=255, blank=True)
    chain = models.CharField(max_length=50, blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_PROFILE_MODEL,
        on_delete=models.CASCADE,
        related_name='crypto_holdings'
    )
    
    last_price_update = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-market_value', 'symbol']
        indexes = [
            models.Index(fields=['space', 'widget', '-market_value']),
            models.Index(fields=['symbol']),
        ]
    
    def __str__(self):
        return f"{self.symbol} - {self.amount}"