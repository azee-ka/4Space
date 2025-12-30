// src/features/space/components/apps/ExpensesApp/ExpensesWidget.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './ExpensesWidget.css';
import { 
  FaReceipt, FaPlus, FaExternalLinkAlt, FaCheckCircle,
  FaClock, FaTimes, FaChartPie, FaDollarSign,
  FaFileInvoice, FaCalendarAlt, FaFilter, FaCheck
} from 'react-icons/fa';

import {
  fetchExpenses,
  fetchExpenseStats,
  fetchExpenseCategories,
  createExpense,
  updateExpense,
  bulkApproveExpenses
} from '../../../../../../../../services/spaceApps/financeServices';

// ============================================
// COMPACT MODE (In Widget Card)
// ============================================

const ExpensesCompact = ({ widget, spaceId }) => {
  const { data: stats } = useQuery({
    queryKey: ['expense-stats', spaceId, widget.id],
    queryFn: () => fetchExpenseStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', spaceId, widget.id, 'pending'],
    queryFn: () => fetchExpenses(spaceId, widget.id, { status: 'pending', limit: 5 }),
    enabled: !!spaceId && !!widget.id
  });

  if (!stats) {
    return (
      <div className="expenses-compact-empty">
        <div className="compact-empty-state">
          <div className="empty-icon-wrapper">
            <FaReceipt />
          </div>
          <p>No expenses yet</p>
          <span>Click to add expense</span>
        </div>
      </div>
    );
  }

  return (
    <div className="expenses-compact">
      {/* Stats Cards */}
      <div className="expenses-stats-row">
        <div className="expense-stat-compact">
          <div className="stat-compact-label">This Month</div>
          <div className="stat-compact-value">
            ${stats.month_total?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
        </div>
        <div className="expense-stat-compact pending">
          <div className="stat-compact-label">Pending</div>
          <div className="stat-compact-value">
            {stats.pending_count || 0}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="compact-expenses-list">
        <div className="compact-list-header">
          <span>Recent Expenses</span>
          <FaClock />
        </div>
        {expenses.length === 0 ? (
          <div className="compact-no-expenses">
            <p>No pending expenses</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="compact-expense-item">
              <div className="expense-item-info">
                <div className="expense-item-merchant">{expense.merchant}</div>
                <div className="expense-item-category">{expense.category?.name}</div>
              </div>
              <div className="expense-item-amount">
                ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="compact-view-all">
        <span>Click to view all expenses</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE (Dashboard)
// ============================================

const ExpensesModal = ({ widget, spaceId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [filter, setFilter] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ['expense-stats', spaceId, widget.id],
    queryFn: () => fetchExpenseStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', spaceId, widget.id],
    queryFn: () => fetchExpenseCategories(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', spaceId, widget.id, activeTab, filter],
    queryFn: () => {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (filter) params.category = filter;
      return fetchExpenses(spaceId, widget.id, params);
    },
    enabled: !!spaceId && !!widget.id
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (expenseIds) => bulkApproveExpenses(spaceId, widget.id, { expense_ids: expenseIds }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-stats']);
      setSelectedExpenses(new Set());
    }
  });

  const handleSelectExpense = (expenseId) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)));
    }
  };

  const handleBulkApprove = () => {
    const expenseIds = Array.from(selectedExpenses);
    bulkApproveMutation.mutate(expenseIds);
  };

  const handleOpenApp = () => {
    window.open(`/space/${spaceId}/expenses/${widget.id}`, '_blank');
  };

  return (
    <div className="expenses-modal-content">
      {/* Left Sidebar - Stats */}
      <div className="expenses-sidebar">
        <div className="sidebar-header">
          <h3>Expenses</h3>
          <button className="add-expense-btn" title="Add Expense">
            <FaPlus />
          </button>
        </div>

        <div className="sidebar-stats-cards">
          <div className="sidebar-stat-card large">
            <div className="sidebar-stat-icon">
              <FaDollarSign />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">
                ${stats?.month_total?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <div className="sidebar-stat-label">This Month</div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon pending">
              <FaClock />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats?.pending_count || 0}</div>
              <div className="sidebar-stat-label">Pending</div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon approved">
              <FaCheckCircle />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats?.approved_count || 0}</div>
              <div className="sidebar-stat-label">Approved</div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Filter by Category</div>
          <div className="category-filters">
            <button
              className={`category-filter-btn ${!filter ? 'active' : ''}`}
              onClick={() => setFilter(null)}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-filter-btn ${filter === category.id ? 'active' : ''}`}
                onClick={() => setFilter(category.id)}
              >
                <span className="category-dot" style={{ background: category.color }} />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <button className="sidebar-open-app-btn" onClick={handleOpenApp}>
          <FaExternalLinkAlt />
          Open Full Expenses
        </button>
      </div>

      {/* Main Content */}
      <div className="expenses-main-content">
        {/* Tabs */}
        <div className="expenses-tabs-nav">
          <button
            className={`expenses-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FaClock />
            Pending
            <span className="tab-count">{stats?.pending_count || 0}</span>
          </button>
          <button
            className={`expenses-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            <FaCheckCircle />
            Approved
          </button>
          <button
            className={`expenses-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <FaTimes />
            Rejected
          </button>
          <button
            className={`expenses-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Expenses
            <span className="tab-count">{stats?.total_expenses || 0}</span>
          </button>
        </div>

        {/* Selection Bar */}
        {selectedExpenses.size > 0 && (
          <div className="selection-bar">
            <span>{selectedExpenses.size} selected</span>
            <div className="selection-actions">
              <button onClick={handleSelectAll}>
                {selectedExpenses.size === expenses.length ? 'Deselect' : 'Select All'}
              </button>
              {activeTab === 'pending' && (
                <button 
                  onClick={handleBulkApprove}
                  className="approve-btn"
                  disabled={bulkApproveMutation.isLoading}
                >
                  <FaCheck /> Approve Selected
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="expenses-tab-content">
          <ExpensesList 
            expenses={expenses}
            selectedExpenses={selectedExpenses}
            onSelectExpense={handleSelectExpense}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXPENSES LIST COMPONENT
// ============================================

const ExpensesList = ({ expenses, selectedExpenses, onSelectExpense }) => {
  if (expenses.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaReceipt />
        </div>
        <h3>No expenses found</h3>
        <p>Start tracking your expenses</p>
      </div>
    );
  }

  return (
    <div className="expenses-list">
      {expenses.map(expense => {
        const isSelected = selectedExpenses.has(expense.id);
        
        return (
          <div
            key={expense.id}
            className={`expense-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectExpense(expense.id)}
          >
            {selectedExpenses.size > 0 && (
              <div className="expense-checkbox">
                <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <FaCheck />}
                </div>
              </div>
            )}

            <div className="expense-card-content">
              <div className="expense-card-header">
                <div className="expense-merchant">{expense.merchant}</div>
                <div className={`expense-status ${expense.status}`}>
                  {expense.status === 'pending' && <FaClock />}
                  {expense.status === 'approved' && <FaCheckCircle />}
                  {expense.status === 'rejected' && <FaTimes />}
                  {expense.status}
                </div>
              </div>

              <div className="expense-card-details">
                <div className="expense-detail-item">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value amount">
                    ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="expense-detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">
                    <span 
                      className="category-badge" 
                      style={{ borderColor: expense.category?.color, color: expense.category?.color }}
                    >
                      {expense.category?.name}
                    </span>
                  </span>
                </div>
                <div className="expense-detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {new Date(expense.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                {expense.submitted_by && (
                  <div className="expense-detail-item">
                    <span className="detail-label">Submitted by</span>
                    <span className="detail-value">{expense.submitted_by.username}</span>
                  </div>
                )}
              </div>

              {expense.description && (
                <div className="expense-description">
                  {expense.description}
                </div>
              )}

              {expense.receipt_url && (
                <div className="expense-receipt">
                  <FaFileInvoice />
                  <span>Receipt attached</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

const ExpensesWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <ExpensesCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <ExpensesModal widget={widget} spaceId={spaceId} />;
};

export default ExpensesWidget;