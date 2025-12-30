// src/features/space/components/apps/BudgetApp/BudgetWidget.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './BudgetWidget.css';
import { 
  FaWallet, FaPlus, FaExternalLinkAlt, FaChartBar,
  FaExclamationTriangle, FaCheckCircle, FaChartPie,
  FaCalendarAlt, FaEdit, FaTrash
} from 'react-icons/fa';

import {
  fetchBudgets,
  fetchBudgetStats,
  fetchBudgetLineItems,
  createBudget
} from '../../../../../../../../services/spaceApps/financeServices';

// ============================================
// COMPACT MODE (In Widget Card)
// ============================================

const BudgetCompact = ({ widget, spaceId }) => {
  const { data: stats } = useQuery({
    queryKey: ['budget-stats', spaceId, widget.id],
    queryFn: () => fetchBudgetStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', spaceId, widget.id],
    queryFn: () => fetchBudgets(spaceId, widget.id, { status: 'active' }),
    enabled: !!spaceId && !!widget.id
  });

  if (!stats || budgets.length === 0) {
    return (
      <div className="budget-compact-empty">
        <div className="compact-empty-state">
          <div className="empty-icon-wrapper">
            <FaWallet />
          </div>
          <p>No budgets yet</p>
          <span>Click to create budget</span>
        </div>
      </div>
    );
  }

  const utilizationPercent = stats.utilization_percent || 0;
  const isOverBudget = utilizationPercent > 100;
  const isNearLimit = utilizationPercent > 80 && utilizationPercent <= 100;

  return (
    <div className="budget-compact">
      {/* Budget Overview Card */}
      <div className={`budget-overview-card ${isOverBudget ? 'over' : isNearLimit ? 'warning' : ''}`}>
        <div className="overview-header">
          <span className="overview-label">Active Budget</span>
          {isOverBudget ? <FaExclamationTriangle /> : <FaWallet />}
        </div>
        <div className="overview-amount">
          ${stats.active_budget_total?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </div>
        <div className="overview-progress">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${isOverBudget ? 'over' : isNearLimit ? 'warning' : ''}`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
          <div className="progress-text">
            <span className="spent">${stats.active_budget_spent?.toLocaleString('en-US', { minimumFractionDigits: 0 })} spent</span>
            <span className="percent">{utilizationPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="budget-stats-row">
        <div className="budget-stat-mini">
          <div className="stat-mini-label">Remaining</div>
          <div className={`stat-mini-value ${isOverBudget ? 'negative' : ''}`}>
            ${stats.active_budget_remaining?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
        </div>
        <div className="budget-stat-mini">
          <div className="stat-mini-label">Budgets</div>
          <div className="stat-mini-value">{stats.total_budgets || 0}</div>
        </div>
      </div>

      {/* Active Budgets List */}
      <div className="compact-budgets-list">
        {budgets.slice(0, 3).map(budget => {
          const util = budget.total_budget > 0 
            ? (budget.total_spent / budget.total_budget) * 100 
            : 0;
          const budgetOver = util > 100;
          const budgetWarning = util > 80 && util <= 100;
          
          return (
            <div key={budget.id} className="compact-budget-item">
              <div className="budget-item-info">
                <div className="budget-item-name">{budget.name}</div>
                <div className="budget-item-period">{budget.period}</div>
              </div>
              <div className="budget-item-status">
                <div className={`budget-item-util ${budgetOver ? 'over' : budgetWarning ? 'warning' : ''}`}>
                  {util.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="compact-view-all">
        <span>Click to manage budgets</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE (Dashboard)
// ============================================

const BudgetModal = ({ widget, spaceId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBudget, setSelectedBudget] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ['budget-stats', spaceId, widget.id],
    queryFn: () => fetchBudgetStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', spaceId, widget.id],
    queryFn: () => fetchBudgets(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['budget-line-items', spaceId, widget.id, selectedBudget],
    queryFn: () => fetchBudgetLineItems(spaceId, widget.id, selectedBudget),
    enabled: !!spaceId && !!widget.id && !!selectedBudget
  });

  const handleOpenApp = () => {
    window.open(`/space/${spaceId}/budget/${widget.id}`, '_blank');
  };

  // Auto-select first active budget if none selected
  React.useEffect(() => {
    if (!selectedBudget && budgets.length > 0) {
      const activeBudget = budgets.find(b => b.status === 'active') || budgets[0];
      setSelectedBudget(activeBudget.id);
    }
  }, [budgets, selectedBudget]);

  const currentBudget = budgets.find(b => b.id === selectedBudget);

  return (
    <div className="budget-modal-content">
      {/* Left Sidebar - Budget List */}
      <div className="budget-sidebar">
        <div className="sidebar-header">
          <h3>Budgets</h3>
          <button className="add-budget-btn" title="Create Budget">
            <FaPlus />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="sidebar-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <FaWallet />
            </div>
            <div className="summary-content">
              <div className="summary-value">
                ${stats?.active_budget_total?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <div className="summary-label">Total Budget</div>
            </div>
          </div>

          <div className="summary-progress-card">
            <div className="summary-progress-header">
              <span>Utilization</span>
              <span className="summary-percent">{stats?.utilization_percent?.toFixed(1)}%</span>
            </div>
            <div className="summary-progress-bar">
              <div 
                className={`summary-progress-fill ${
                  stats?.utilization_percent > 100 ? 'over' : 
                  stats?.utilization_percent > 80 ? 'warning' : ''
                }`}
                style={{ width: `${Math.min(stats?.utilization_percent || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Budgets List */}
        <div className="budgets-list">
          <div className="budgets-list-header">Your Budgets</div>
          {budgets.map(budget => {
            const util = budget.total_budget > 0 
              ? (budget.total_spent / budget.total_budget) * 100 
              : 0;
            const isOver = util > 100;
            const isWarning = util > 80 && util <= 100;
            
            return (
              <button
                key={budget.id}
                className={`budget-list-item ${selectedBudget === budget.id ? 'active' : ''}`}
                onClick={() => setSelectedBudget(budget.id)}
              >
                <div className="budget-list-icon">
                  {isOver ? <FaExclamationTriangle /> : <FaWallet />}
                </div>
                <div className="budget-list-info">
                  <div className="budget-list-name">{budget.name}</div>
                  <div className="budget-list-period">
                    {budget.period} • {budget.status}
                  </div>
                  <div className="budget-list-progress-mini">
                    <div 
                      className={`progress-mini-fill ${isOver ? 'over' : isWarning ? 'warning' : ''}`}
                      style={{ width: `${Math.min(util, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="budget-list-amount">
                  <div className="budget-list-total">
                    ${budget.total_budget?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <div className={`budget-list-util ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
                    {util.toFixed(0)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button className="sidebar-open-app-btn" onClick={handleOpenApp}>
          <FaExternalLinkAlt />
          Open Full Budget Manager
        </button>
      </div>

      {/* Main Content */}
      <div className="budget-main-content">
        {/* Tabs */}
        <div className="budget-tabs-nav">
          <button
            className={`budget-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`budget-tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
            onClick={() => setActiveTab('breakdown')}
          >
            <FaChartBar />
            Line Items
            <span className="tab-count">{lineItems.length}</span>
          </button>
          <button
            className={`budget-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <FaChartPie />
            Analysis
          </button>
        </div>

        {/* Tab Content */}
        <div className="budget-tab-content">
          {activeTab === 'overview' && <OverviewTab budget={currentBudget} />}
          {activeTab === 'breakdown' && <BreakdownTab lineItems={lineItems} budget={currentBudget} />}
          {activeTab === 'analysis' && <AnalysisTab lineItems={lineItems} budget={currentBudget} />}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const OverviewTab = ({ budget }) => {
  if (!budget) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaWallet />
        </div>
        <h3>No budget selected</h3>
        <p>Select a budget to view details</p>
      </div>
    );
  }

  const util = budget.total_budget > 0 ? (budget.total_spent / budget.total_budget) * 100 : 0;
  const isOver = util > 100;
  const isWarning = util > 80 && util <= 100;

  return (
    <div className="overview-content">
      {/* Main Budget Card */}
      <div className={`budget-overview-large ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
        <div className="overview-large-header">
          <div>
            <h2>{budget.name}</h2>
            <div className="budget-meta">
              {budget.period} • {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
            </div>
          </div>
          <div className={`budget-status-badge ${budget.status}`}>
            {budget.status}
          </div>
        </div>

        <div className="budget-amounts-grid">
          <div className="amount-card">
            <div className="amount-label">Total Budget</div>
            <div className="amount-value">
              ${budget.total_budget?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="amount-card">
            <div className="amount-label">Spent</div>
            <div className="amount-value spent">
              ${budget.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="amount-card">
            <div className="amount-label">Remaining</div>
            <div className={`amount-value ${isOver ? 'negative' : 'positive'}`}>
              ${budget.total_remaining?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="budget-progress-section">
          <div className="progress-header">
            <span>Budget Utilization</span>
            <span className={`progress-percent ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
              {util.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar-large">
            <div 
              className={`progress-fill-large ${isOver ? 'over' : isWarning ? 'warning' : ''}`}
              style={{ width: `${Math.min(util, 100)}%` }}
            />
          </div>
          {isOver && (
            <div className="budget-alert over">
              <FaExclamationTriangle />
              <span>Over budget by ${Math.abs(budget.total_remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {isWarning && !isOver && (
            <div className="budget-alert warning">
              <FaExclamationTriangle />
              <span>Approaching budget limit</span>
            </div>
          )}
        </div>

        {budget.description && (
          <div className="budget-description">
            <strong>Description:</strong> {budget.description}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn primary">
          <FaEdit /> Edit Budget
        </button>
        <button className="action-btn">
          <FaCalendarAlt /> View History
        </button>
        <button className="action-btn danger">
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

const BreakdownTab = ({ lineItems, budget }) => {
  if (lineItems.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaChartBar />
        </div>
        <h3>No line items yet</h3>
        <p>Add line items to track your budget breakdown</p>
      </div>
    );
  }

  return (
    <div className="breakdown-content">
      <div className="breakdown-header">
        <h3>Budget Line Items</h3>
        <button className="add-line-item-btn">
          <FaPlus /> Add Line Item
        </button>
      </div>

      <div className="line-items-list">
        {lineItems.map(item => {
          const util = item.budgeted_amount > 0 
            ? (item.spent_amount / item.budgeted_amount) * 100 
            : 0;
          const isOver = util > 100;
          const isWarning = util > 80 && util <= 100;
          
          return (
            <div key={item.id} className="line-item-card">
              <div className="line-item-header">
                <div className="line-item-title">
                  <h4>{item.name}</h4>
                  {item.category && (
                    <span className="line-item-category">{item.category.name}</span>
                  )}
                </div>
                <div className="line-item-actions">
                  <button className="icon-btn"><FaEdit /></button>
                  <button className="icon-btn"><FaTrash /></button>
                </div>
              </div>

              <div className="line-item-amounts">
                <div className="line-item-amount-col">
                  <span className="amount-col-label">Budgeted</span>
                  <span className="amount-col-value">
                    ${item.budgeted_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="line-item-amount-col">
                  <span className="amount-col-label">Spent</span>
                  <span className="amount-col-value spent">
                    ${item.spent_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="line-item-amount-col">
                  <span className="amount-col-label">Remaining</span>
                  <span className={`amount-col-value ${isOver ? 'negative' : 'positive'}`}>
                    ${item.remaining_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="line-item-progress">
                <div className="line-item-progress-bar">
                  <div 
                    className={`line-item-progress-fill ${isOver ? 'over' : isWarning ? 'warning' : ''}`}
                    style={{ width: `${Math.min(util, 100)}%` }}
                  />
                </div>
                <span className={`line-item-percent ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
                  {util.toFixed(1)}%
                </span>
              </div>

              {item.notes && (
                <div className="line-item-notes">{item.notes}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnalysisTab = ({ lineItems, budget }) => (
  <div className="analysis-content">
    <div className="analysis-chart-placeholder">
      <FaChartPie />
      <h3>Budget Analysis</h3>
      <p>Detailed breakdown and spending patterns</p>
      <span className="coming-soon-badge">Available in full Budget Manager app</span>
    </div>

    <div className="analysis-summary">
      <h4>Top Spending Categories</h4>
      {lineItems
        .sort((a, b) => b.spent_amount - a.spent_amount)
        .slice(0, 5)
        .map(item => {
          const percentage = budget?.total_spent > 0 
            ? ((item.spent_amount / budget.total_spent) * 100).toFixed(1)
            : 0;
          
          return (
            <div key={item.id} className="analysis-item">
              <div className="analysis-item-info">
                <span className="analysis-item-name">{item.name}</span>
                <span className="analysis-item-amount">
                  ${item.spent_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="analysis-item-bar">
                <div 
                  className="analysis-item-bar-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="analysis-item-percent">{percentage}%</span>
            </div>
          );
        })}
    </div>
  </div>
);

// ============================================
// MAIN EXPORT
// ============================================

const BudgetWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <BudgetCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <BudgetModal widget={widget} spaceId={spaceId} />;
};

export default BudgetWidget;