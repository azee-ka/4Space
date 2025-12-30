// src/features/space/components/apps/BudgetApp/BudgetApp.jsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './BudgetApp.css';
import {
  FaWallet, FaPlus, FaDownload, FaUpload, FaEdit,
  FaTrash, FaExclamationTriangle, FaCheckCircle, FaChartBar,
  FaChartPie, FaDollarSign, FaPercentage, FaCalendarAlt
} from 'react-icons/fa';

import {
  fetchBudgets,
  fetchBudgetStats,
  fetchBudgetLineItems,
  createBudget,
  updateBudget,
  deleteBudget,
  createBudgetLineItem
} from '../../../../../services/spaceApps/financeServices';

const BudgetApp = () => {
  const { spaceId, widgetId } = useParams();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState('active'); // active, draft, closed, all
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);
  const [showAddLineItemModal, setShowAddLineItemModal] = useState(false);

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['budget-stats', spaceId, widgetId],
    queryFn: () => fetchBudgetStats(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', spaceId, widgetId, activeView],
    queryFn: () => {
      const params = {};
      if (activeView !== 'all') params.status = activeView;
      return fetchBudgets(spaceId, widgetId, params);
    },
    enabled: !!spaceId && !!widgetId
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['budget-line-items', spaceId, widgetId, selectedBudget],
    queryFn: () => fetchBudgetLineItems(spaceId, widgetId, selectedBudget),
    enabled: !!spaceId && !!widgetId && !!selectedBudget
  });

  // Mutations
  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId) => deleteBudget(spaceId, widgetId, budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budget-stats']);
      if (selectedBudget) {
        setSelectedBudget(null);
      }
    }
  });

  // Auto-select first budget if none selected
  React.useEffect(() => {
    if (!selectedBudget && budgets.length > 0) {
      setSelectedBudget(budgets[0].id);
    }
  }, [budgets, selectedBudget]);

  const currentBudget = budgets.find(b => b.id === selectedBudget);

  return (
    <div className="budget-app">
      {/* Header */}
      <div className="budget-app-header">
        <div className="budget-app-title">
          <FaWallet />
          <h1>Budget Manager</h1>
        </div>
        <div className="budget-app-actions">
          <button className="header-action-btn">
            <FaDownload />
            Export
          </button>
          <button className="header-action-btn">
            <FaUpload />
            Import
          </button>
          <button
            className="header-action-btn primary"
            onClick={() => setShowCreateBudgetModal(true)}
          >
            <FaPlus />
            Create Budget
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="budget-stats-overview">
        <div className="stat-overview-card large">
          <div className="stat-overview-label">Active Budgets</div>
          <div className="stat-overview-value">
            ${stats?.active_budget_total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-overview-subtext">Total allocated</div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaDollarSign />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Spent</div>
            <div className="stat-overview-value">
              ${stats?.active_budget_spent?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaDollarSign />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Remaining</div>
            <div className={`stat-overview-value ${stats?.active_budget_remaining < 0 ? 'negative' : 'positive'}`}>
              ${Math.abs(stats?.active_budget_remaining || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaPercentage />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Utilization</div>
            <div className={`stat-overview-value ${
              stats?.utilization_percent > 100 ? 'negative' : 
              stats?.utilization_percent > 80 ? 'warning' : ''
            }`}>
              {stats?.utilization_percent?.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="budget-app-nav">
        <button
          className={`nav-btn ${activeView === 'active' ? 'active' : ''}`}
          onClick={() => setActiveView('active')}
        >
          <FaCheckCircle />
          Active
        </button>
        <button
          className={`nav-btn ${activeView === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveView('draft')}
        >
          Draft
        </button>
        <button
          className={`nav-btn ${activeView === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveView('closed')}
        >
          Closed
        </button>
        <button
          className={`nav-btn ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          All Budgets
          <span className="nav-count">{stats?.total_budgets || 0}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="budget-app-body">
        {/* Budget List Sidebar */}
        <div className="budget-list-sidebar">
          <div className="budget-list-header">
            <h3>Budgets</h3>
          </div>
          <div className="budget-list-scroll">
            {budgets.length === 0 ? (
              <div className="budget-list-empty">
                <p>No budgets found</p>
                <button
                  className="create-first-btn"
                  onClick={() => setShowCreateBudgetModal(true)}
                >
                  <FaPlus /> Create Budget
                </button>
              </div>
            ) : (
              budgets.map(budget => {
                const util = budget.total_budget > 0 
                  ? (budget.total_spent / budget.total_budget) * 100 
                  : 0;
                const isOver = util > 100;
                const isWarning = util > 80 && util <= 100;
                
                return (
                  <button
                    key={budget.id}
                    className={`budget-list-item-full ${selectedBudget === budget.id ? 'active' : ''}`}
                    onClick={() => setSelectedBudget(budget.id)}
                  >
                    <div className="budget-list-item-header">
                      <div className="budget-list-item-name">{budget.name}</div>
                      <span className={`budget-status-pill ${budget.status}`}>
                        {budget.status}
                      </span>
                    </div>
                    <div className="budget-list-item-meta">
                      {budget.period} • {new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="budget-list-item-amounts">
                      <span className="amount-spent">
                        ${budget.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                      <span className="amount-separator">/</span>
                      <span className="amount-total">
                        ${budget.total_budget?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="budget-list-progress-mini">
                      <div 
                        className={`progress-mini-fill ${isOver ? 'over' : isWarning ? 'warning' : ''}`}
                        style={{ width: `${Math.min(util, 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Budget Details Main Area */}
        <div className="budget-details-main">
          {currentBudget ? (
            <BudgetDetails
              budget={currentBudget}
              lineItems={lineItems}
              onAddLineItem={() => setShowAddLineItemModal(true)}
              onDeleteBudget={() => deleteBudgetMutation.mutate(currentBudget.id)}
            />
          ) : (
            <div className="budget-details-empty">
              <div className="empty-state-icon">
                <FaWallet />
              </div>
              <h3>No budget selected</h3>
              <p>Select a budget from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateBudgetModal && (
        <CreateBudgetModal
          spaceId={spaceId}
          widgetId={widgetId}
          onClose={() => setShowCreateBudgetModal(false)}
        />
      )}

      {showAddLineItemModal && currentBudget && (
        <AddLineItemModal
          spaceId={spaceId}
          widgetId={widgetId}
          budgetId={currentBudget.id}
          onClose={() => setShowAddLineItemModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// BUDGET DETAILS COMPONENT
// ============================================

const BudgetDetails = ({ budget, lineItems, onAddLineItem, onDeleteBudget }) => {
  const [activeTab, setActiveTab] = useState('breakdown'); // breakdown, analysis, settings

  const util = budget.total_budget > 0 ? (budget.total_spent / budget.total_budget) * 100 : 0;
  const isOver = util > 100;
  const isWarning = util > 80 && util <= 100;

  return (
    <div className="budget-details">
      {/* Header */}
      <div className="budget-details-header">
        <div className="budget-header-info">
          <h2>{budget.name}</h2>
          <div className="budget-header-meta">
            {budget.period} • {new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(budget.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="budget-header-actions">
          <button className="icon-btn">
            <FaEdit />
          </button>
          <button className="icon-btn delete" onClick={onDeleteBudget}>
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className={`budget-overview-large ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
        <div className="budget-amounts-row">
          <div className="budget-amount-col">
            <div className="amount-label">Total Budget</div>
            <div className="amount-value">
              ${budget.total_budget?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="budget-amount-col">
            <div className="amount-label">Spent</div>
            <div className="amount-value spent">
              ${budget.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="budget-amount-col">
            <div className="amount-label">Remaining</div>
            <div className={`amount-value ${isOver ? 'negative' : 'positive'}`}>
              ${Math.abs(budget.total_remaining || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="budget-progress-large">
          <div className="progress-header-large">
            <span>Utilization</span>
            <span className={`progress-percent-large ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
              {util.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar-xlarge">
            <div 
              className={`progress-fill-xlarge ${isOver ? 'over' : isWarning ? 'warning' : ''}`}
              style={{ width: `${Math.min(util, 100)}%` }}
            />
          </div>
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
            <span>Approaching budget limit - {(100 - util).toFixed(1)}% remaining</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="budget-details-tabs">
        <button
          className={`detail-tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          <FaChartBar />
          Line Items
          <span className="tab-count">{lineItems.length}</span>
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <FaChartPie />
          Analysis
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="budget-details-content">
        {activeTab === 'breakdown' && (
          <LineItemsBreakdown
            lineItems={lineItems}
            budget={budget}
            onAddLineItem={onAddLineItem}
          />
        )}
        {activeTab === 'analysis' && (
          <BudgetAnalysis lineItems={lineItems} budget={budget} />
        )}
        {activeTab === 'settings' && (
          <BudgetSettings budget={budget} />
        )}
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const LineItemsBreakdown = ({ lineItems, budget, onAddLineItem }) => {
  if (lineItems.length === 0) {
    return (
      <div className="line-items-empty">
        <div className="empty-state-icon">
          <FaChartBar />
        </div>
        <h3>No line items yet</h3>
        <p>Add line items to track your budget breakdown</p>
        <button className="add-first-line-item-btn" onClick={onAddLineItem}>
          <FaPlus /> Add Line Item
        </button>
      </div>
    );
  }

  return (
    <div className="line-items-breakdown">
      <div className="line-items-header">
        <h3>Budget Line Items</h3>
        <button className="add-line-item-btn" onClick={onAddLineItem}>
          <FaPlus /> Add Line Item
        </button>
      </div>

      <div className="line-items-table-wrapper">
        <table className="line-items-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Budgeted</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map(item => {
              const util = item.budgeted_amount > 0 
                ? (item.spent_amount / item.budgeted_amount) * 100 
                : 0;
              const isOver = util > 100;
              const isWarning = util > 80 && util <= 100;
              
              return (
                <tr key={item.id}>
                  <td className="line-item-name">
                    <strong>{item.name}</strong>
                  </td>
                  <td>
                    {item.category && (
                      <span className="category-badge-small">
                        {item.category.name}
                      </span>
                    )}
                  </td>
                  <td className="line-item-amount">
                    ${item.budgeted_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="line-item-amount">
                    ${item.spent_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`line-item-amount ${isOver ? 'negative' : 'positive'}`}>
                    <strong>
                      ${Math.abs(item.remaining_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    <div className="line-item-progress-cell">
                      <div className="line-item-progress-bar-small">
                        <div 
                          className={`line-item-progress-fill-small ${isOver ? 'over' : isWarning ? 'warning' : ''}`}
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                      <span className={`line-item-percent-small ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>
                        {util.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn">
                        <FaEdit />
                      </button>
                      <button className="icon-btn delete">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BudgetAnalysis = ({ lineItems, budget }) => (
  <div className="budget-analysis">
    <div className="analysis-chart-placeholder">
      <FaChartPie />
      <h3>Budget Analysis</h3>
      <p>Spending breakdown and insights</p>
      <span className="coming-soon-badge">Interactive charts coming soon</span>
    </div>

    <div className="analysis-top-spending">
      <h4>Top Spending Categories</h4>
      <div className="top-spending-list">
        {lineItems
          .sort((a, b) => b.spent_amount - a.spent_amount)
          .slice(0, 5)
          .map(item => {
            const percentage = budget.total_spent > 0 
              ? ((item.spent_amount / budget.total_spent) * 100).toFixed(1)
              : 0;
            
            return (
              <div key={item.id} className="top-spending-item">
                <div className="spending-item-info">
                  <span className="spending-item-name">{item.name}</span>
                  <span className="spending-item-amount">
                    ${item.spent_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="spending-item-bar">
                  <div 
                    className="spending-item-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="spending-item-percent">{percentage}%</span>
              </div>
            );
          })}
      </div>
    </div>
  </div>
);

const BudgetSettings = ({ budget }) => (
  <div className="budget-settings">
    <div className="settings-section">
      <h4>Budget Information</h4>
      <div className="settings-grid">
        <div className="settings-field">
          <label>Name</label>
          <div className="settings-value">{budget.name}</div>
        </div>
        <div className="settings-field">
          <label>Period</label>
          <div className="settings-value">{budget.period}</div>
        </div>
        <div className="settings-field">
          <label>Start Date</label>
          <div className="settings-value">
            {new Date(budget.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className="settings-field">
          <label>End Date</label>
          <div className="settings-value">
            {new Date(budget.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
      {budget.description && (
        <div className="settings-field full-width">
          <label>Description</label>
          <div className="settings-value">{budget.description}</div>
        </div>
      )}
    </div>
  </div>
);

// ============================================
// MODAL COMPONENTS
// ============================================

const CreateBudgetModal = ({ spaceId, widgetId, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Create Budget</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <p>Budget creation form coming soon...</p>
      </div>
    </div>
  </div>
);

const AddLineItemModal = ({ spaceId, widgetId, budgetId, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Add Line Item</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <p>Line item form coming soon...</p>
      </div>
    </div>
  </div>
);

export default BudgetApp;