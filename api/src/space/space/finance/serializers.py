# api/src/space/finance/serializers.py

from rest_framework import serializers
from .models import (
    PortfolioAccount, PortfolioHolding, PortfolioTransaction, PortfolioStats,
    Expense, ExpenseCategory, ExpenseStats,
    Budget, BudgetLineItem, BudgetStats,
    CryptoHolding
)
from src.user.serializers import MinimalUserSerializer


# ============================================================================
# PORTFOLIO SERIALIZERS
# ============================================================================

class PortfolioAccountSerializer(serializers.ModelSerializer):
    """Serializer for portfolio accounts"""
    owner = MinimalUserSerializer(read_only=True)
    holdings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioAccount
        fields = [
            'id', 'name', 'account_type', 'account_number', 'institution',
            'color', 'cost_basis', 'current_value', 'total_gain', 'gain_percent',
            'is_active', 'owner', 'holdings_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'cost_basis', 'current_value', 'total_gain', 'gain_percent', 'created_at', 'updated_at']
    
    def get_holdings_count(self, obj):
        return obj.holdings.count()


class PortfolioHoldingSerializer(serializers.ModelSerializer):
    """Serializer for portfolio holdings"""
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = PortfolioHolding
        fields = [
            'id', 'account', 'account_name', 'symbol', 'name', 'asset_type',
            'shares', 'average_cost', 'cost_basis', 'current_price',
            'market_value', 'total_gain', 'gain_percent',
            'last_price_update', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'market_value', 'total_gain', 'gain_percent', 'last_price_update', 'created_at', 'updated_at']


class PortfolioTransactionSerializer(serializers.ModelSerializer):
    """Serializer for portfolio transactions"""
    created_by = MinimalUserSerializer(read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = PortfolioTransaction
        fields = [
            'id', 'account', 'account_name', 'holding', 'transaction_type',
            'symbol', 'shares', 'price', 'amount', 'fees', 'date', 'notes',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PortfolioStatsSerializer(serializers.ModelSerializer):
    """Serializer for portfolio statistics"""
    class Meta:
        model = PortfolioStats
        fields = [
            'id', 'total_value', 'total_cost_basis', 'total_gain',
            'total_gain_percent', 'total_holdings', 'today_change',
            'ytd_return', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


# ============================================================================
# EXPENSE SERIALIZERS
# ============================================================================

class ExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer for expense categories"""
    expense_count = serializers.SerializerMethodField()
    month_total = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpenseCategory
        fields = [
            'id', 'name', 'color', 'icon', 'budget_limit',
            'expense_count', 'month_total', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_expense_count(self, obj):
        return obj.expenses.filter(status='approved').count()
    
    def get_month_total(self, obj):
        from django.utils import timezone
        from datetime import datetime
        now = timezone.now()
        month_expenses = obj.expenses.filter(
            status='approved',
            date__year=now.year,
            date__month=now.month
        )
        return sum(e.amount for e in month_expenses)


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for expenses"""
    submitted_by = MinimalUserSerializer(read_only=True)
    approved_by = MinimalUserSerializer(read_only=True)
    category = ExpenseCategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'merchant', 'amount', 'currency', 'category', 'category_id',
            'date', 'description', 'status', 'receipt', 'receipt_url',
            'submitted_by', 'approved_by', 'approved_at', 'rejection_reason',
            'is_reimbursable', 'is_reimbursed', 'reimbursed_at', 'tags',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'submitted_by', 'approved_by', 'approved_at', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category_id'] = category_id
        return Expense.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            instance.category_id = category_id
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ExpenseStatsSerializer(serializers.ModelSerializer):
    """Serializer for expense statistics"""
    class Meta:
        model = ExpenseStats
        fields = [
            'id', 'total_expenses', 'month_total', 'pending_count',
            'approved_count', 'rejected_count', 'pending_amount', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


# ============================================================================
# BUDGET SERIALIZERS
# ============================================================================

class BudgetLineItemSerializer(serializers.ModelSerializer):
    """Serializer for budget line items"""
    category = ExpenseCategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    utilization_percent = serializers.SerializerMethodField()
    
    class Meta:
        model = BudgetLineItem
        fields = [
            'id', 'name', 'category', 'category_id', 'budgeted_amount',
            'spent_amount', 'remaining_amount', 'utilization_percent',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'spent_amount', 'remaining_amount', 'created_at', 'updated_at']
    
    def get_utilization_percent(self, obj):
        if obj.budgeted_amount > 0:
            return (obj.spent_amount / obj.budgeted_amount) * 100
        return 0


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for budgets"""
    owner = MinimalUserSerializer(read_only=True)
    line_items = BudgetLineItemSerializer(many=True, read_only=True)
    utilization_percent = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'description', 'period', 'start_date', 'end_date',
            'total_budget', 'total_spent', 'total_remaining', 'status',
            'owner', 'line_items', 'utilization_percent', 'items_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_spent', 'total_remaining', 'created_at', 'updated_at']
    
    def get_utilization_percent(self, obj):
        if obj.total_budget > 0:
            return (obj.total_spent / obj.total_budget) * 100
        return 0
    
    def get_items_count(self, obj):
        return obj.line_items.count()


class BudgetStatsSerializer(serializers.ModelSerializer):
    """Serializer for budget statistics"""
    class Meta:
        model = BudgetStats
        fields = [
            'id', 'total_budgets', 'active_budget_total', 'active_budget_spent',
            'active_budget_remaining', 'utilization_percent', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


# ============================================================================
# CRYPTO SERIALIZERS
# ============================================================================

class CryptoHoldingSerializer(serializers.ModelSerializer):
    """Serializer for crypto holdings"""
    owner = MinimalUserSerializer(read_only=True)
    
    class Meta:
        model = CryptoHolding
        fields = [
            'id', 'symbol', 'name', 'amount', 'average_cost', 'cost_basis',
            'current_price', 'market_value', 'total_gain', 'gain_percent',
            'wallet_address', 'chain', 'owner', 'last_price_update',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'market_value', 'total_gain', 'gain_percent', 'last_price_update', 'created_at', 'updated_at']


# ============================================================================
# BULK OPERATION SERIALIZERS
# ============================================================================

class BulkApproveExpensesSerializer(serializers.Serializer):
    """Serializer for bulk expense approval"""
    expense_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    
    def validate_expense_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one expense ID is required")
        return value


class BulkActionSerializer(serializers.Serializer):
    """Generic serializer for bulk actions"""
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    action = serializers.ChoiceField(
        choices=['approve', 'reject', 'delete', 'export'],
        required=True
    )
    
    def validate_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one ID is required")
        return value