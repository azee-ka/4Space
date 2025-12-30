// src/features/space/components/apps/PortfolioApp/PortfolioApp.jsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './PortfolioApp.css';
import {
  FaChartPie, FaChartLine, FaCoins, FaPlus, FaSync,
  FaDownload, FaUpload, FaFilter, FaSearch, FaEdit,
  FaTrash, FaDollarSign, FaPercentage,
  FaArrowUp, FaArrowDown, FaWallet, FaHistory
} from 'react-icons/fa';

import {
  fetchPortfolioAccounts,
  fetchPortfolioHoldings,
  fetchPortfolioTransactions,
  fetchPortfolioStats,
  createPortfolioAccount,
  createPortfolioTransaction,
  syncPortfolioPrices,
  deletePortfolioAccount
} from '../../../../../services/spaceApps/financeServices';

const PortfolioApp = () => {
  const { spaceId, widgetId } = useParams();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState('overview'); // overview, holdings, transactions, accounts
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssetType, setFilterAssetType] = useState('all');

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats', spaceId, widgetId],
    queryFn: () => fetchPortfolioStats(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['portfolio-accounts', spaceId, widgetId],
    queryFn: () => fetchPortfolioAccounts(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio-holdings', spaceId, widgetId, selectedAccount],
    queryFn: () => fetchPortfolioHoldings(spaceId, widgetId, { account: selectedAccount }),
    enabled: !!spaceId && !!widgetId
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['portfolio-transactions', spaceId, widgetId, selectedAccount],
    queryFn: () => fetchPortfolioTransactions(spaceId, widgetId, { account: selectedAccount }),
    enabled: !!spaceId && !!widgetId
  });

  // Mutations
  const syncPricesMutation = useMutation({
    mutationFn: () => syncPortfolioPrices(spaceId, widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-stats']);
      queryClient.invalidateQueries(['portfolio-accounts']);
    }
  });

  // Filtered data
  const filteredHoldings = holdings.filter(holding => {
    const matchesSearch = holding.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         holding.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterAssetType === 'all' || holding.asset_type === filterAssetType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="portfolio-app">
      {/* Header */}
      <div className="portfolio-app-header">
        <div className="portfolio-app-title">
          <FaWallet />
          <h1>Portfolio Manager</h1>
        </div>
        <div className="portfolio-app-actions">
          <button
            className="header-action-btn"
            onClick={() => syncPricesMutation.mutate()}
            disabled={syncPricesMutation.isLoading}
          >
            <FaSync className={syncPricesMutation.isLoading ? 'spinning' : ''} />
            Sync Prices
          </button>
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
            onClick={() => setShowAddTransactionModal(true)}
          >
            <FaPlus />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="portfolio-stats-overview">
        <div className="stat-overview-card large">
          <div className="stat-overview-label">Total Portfolio Value</div>
          <div className="stat-overview-value">
            ${stats?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`stat-overview-change ${(stats?.total_gain || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(stats?.total_gain || 0) >= 0 ? <FaArrowUp /> : <FaArrowDown />}
            ${Math.abs(stats?.total_gain || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="change-percent">({stats?.total_gain_percent?.toFixed(2)}%)</span>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaDollarSign />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Today's Change</div>
            <div className={`stat-overview-value ${(stats?.today_change || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.today_change || 0) >= 0 ? '+' : ''}${Math.abs(stats?.today_change || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaChartLine />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">YTD Return</div>
            <div className={`stat-overview-value ${(stats?.ytd_return || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.ytd_return || 0) >= 0 ? '+' : ''}{stats?.ytd_return?.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaCoins />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Total Holdings</div>
            <div className="stat-overview-value">{stats?.total_holdings || 0}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="portfolio-app-nav">
        <button
          className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-btn ${activeView === 'holdings' ? 'active' : ''}`}
          onClick={() => setActiveView('holdings')}
        >
          <FaCoins />
          Holdings
          <span className="nav-count">{holdings.length}</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveView('transactions')}
        >
          <FaHistory />
          Transactions
        </button>
        <button
          className={`nav-btn ${activeView === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveView('accounts')}
        >
          <FaWallet />
          Accounts
          <span className="nav-count">{accounts.length}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="portfolio-app-content">
        {activeView === 'overview' && (
          <OverviewView
            stats={stats}
            accounts={accounts}
            holdings={holdings}
            onAccountSelect={setSelectedAccount}
            onViewChange={setActiveView}
          />
        )}

        {activeView === 'holdings' && (
          <HoldingsView
            holdings={filteredHoldings}
            accounts={accounts}
            selectedAccount={selectedAccount}
            onAccountSelect={setSelectedAccount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterAssetType={filterAssetType}
            onFilterChange={setFilterAssetType}
          />
        )}

        {activeView === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
            selectedAccount={selectedAccount}
            onAccountSelect={setSelectedAccount}
          />
        )}

        {activeView === 'accounts' && (
          <AccountsView
            accounts={accounts}
            onAddAccount={() => setShowAddAccountModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      {showAddAccountModal && (
        <AddAccountModal
          spaceId={spaceId}
          widgetId={widgetId}
          onClose={() => setShowAddAccountModal(false)}
        />
      )}

      {showAddTransactionModal && (
        <AddTransactionModal
          spaceId={spaceId}
          widgetId={widgetId}
          accounts={accounts}
          onClose={() => setShowAddTransactionModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// VIEW COMPONENTS
// ============================================

const OverviewView = ({ stats, accounts, holdings, onAccountSelect, onViewChange }) => (
  <div className="overview-view">
    <div className="overview-section">
      <div className="section-header">
        <h2>Accounts Summary</h2>
        <button className="section-action" onClick={() => onViewChange('accounts')}>
          View All
        </button>
      </div>
      <div className="accounts-grid">
        {accounts.map(account => {
          const accountGain = account.total_gain || 0;
          const isPositive = accountGain >= 0;
          
          return (
            <div key={account.id} className="account-overview-card" onClick={() => onAccountSelect(account.id)}>
              <div className="account-overview-header">
                <div className="account-overview-icon" style={{ background: account.color }}>
                  {account.account_type?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="account-overview-name">{account.name}</div>
                  <div className="account-overview-type">{account.account_type}</div>
                </div>
              </div>
              <div className="account-overview-value">
                ${account.current_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className={`account-overview-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{account.gain_percent?.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="overview-section">
      <div className="section-header">
        <h2>Top Holdings</h2>
        <button className="section-action" onClick={() => onViewChange('holdings')}>
          View All
        </button>
      </div>
      <div className="top-holdings-list">
        {holdings.slice(0, 10).map(holding => {
          const gain = (holding.market_value || 0) - (holding.cost_basis || 0);
          const gainPercent = holding.cost_basis > 0 ? (gain / holding.cost_basis) * 100 : 0;
          const isPositive = gain >= 0;
          
          return (
            <div key={holding.id} className="top-holding-item">
              <div className="holding-info">
                <div className="holding-symbol">{holding.symbol}</div>
                <div className="holding-name">{holding.name || holding.symbol}</div>
              </div>
              <div className="holding-shares">
                {holding.shares?.toLocaleString('en-US', { maximumFractionDigits: 2 })} shares
              </div>
              <div className="holding-value">
                ${holding.market_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className={`holding-gain ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="overview-charts">
      <div className="chart-placeholder">
        <FaChartPie />
        <h3>Asset Allocation</h3>
        <p>Interactive charts available in next update</p>
      </div>
      <div className="chart-placeholder">
        <FaChartLine />
        <h3>Performance History</h3>
        <p>Interactive charts available in next update</p>
      </div>
    </div>
  </div>
);

const HoldingsView = ({
  holdings,
  accounts,
  selectedAccount,
  onAccountSelect,
  searchQuery,
  onSearchChange,
  filterAssetType,
  onFilterChange
}) => (
  <div className="holdings-view">
    <div className="holdings-toolbar">
      <div className="search-box">
        <FaSearch />
        <input
          type="text"
          placeholder="Search holdings..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="filter-group">
        <select
          value={selectedAccount || 'all'}
          onChange={(e) => onAccountSelect(e.target.value === 'all' ? null : e.target.value)}
        >
          <option value="all">All Accounts</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        <select
          value={filterAssetType}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="stock">Stocks</option>
          <option value="etf">ETFs</option>
          <option value="mutual_fund">Mutual Funds</option>
          <option value="bond">Bonds</option>
          <option value="crypto">Crypto</option>
          <option value="option">Options</option>
        </select>
      </div>
    </div>

    <div className="holdings-table-wrapper">
      <table className="holdings-table-full">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Type</th>
            <th>Account</th>
            <th>Shares</th>
            <th>Avg Cost</th>
            <th>Current Price</th>
            <th>Cost Basis</th>
            <th>Market Value</th>
            <th>Total Gain/Loss</th>
            <th>Return %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(holding => {
            const gain = (holding.market_value || 0) - (holding.cost_basis || 0);
            const gainPercent = holding.cost_basis > 0 ? (gain / holding.cost_basis) * 100 : 0;
            const isPositive = gain >= 0;
            
            return (
              <tr key={holding.id}>
                <td className="holding-symbol">
                  <strong>{holding.symbol}</strong>
                </td>
                <td className="holding-name">{holding.name || holding.symbol}</td>
                <td>
                  <span className="holding-type-badge">{holding.asset_type}</span>
                </td>
                <td className="holding-account">{holding.account_name}</td>
                <td>{holding.shares?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                <td>${holding.average_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${holding.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${holding.cost_basis?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="holding-market-value">
                  <strong>${holding.market_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  {isPositive ? '+' : ''}${Math.abs(gain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  <strong>{isPositive ? '+' : ''}{gainPercent.toFixed(2)}%</strong>
                </td>
                <td>
                  <div className="holdings-actions">
                    <button className="icon-btn" title="Edit">
                      <FaEdit />
                    </button>
                    <button className="icon-btn" title="Delete">
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

const TransactionsView = ({ transactions, accounts, selectedAccount, onAccountSelect }) => (
  <div className="transactions-view">
    <div className="transactions-toolbar">
      <h2>Transaction History</h2>
      <select
        value={selectedAccount || 'all'}
        onChange={(e) => onAccountSelect(e.target.value === 'all' ? null : e.target.value)}
      >
        <option value="all">All Accounts</option>
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>{acc.name}</option>
        ))}
      </select>
    </div>

    <div className="transactions-list">
      {transactions.map(txn => (
        <div key={txn.id} className="transaction-item">
          <div className="transaction-date">
            {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className={`transaction-type ${txn.transaction_type}`}>
            {txn.transaction_type}
          </div>
          <div className="transaction-details">
            <div className="transaction-symbol">{txn.symbol || 'N/A'}</div>
            <div className="transaction-account">{txn.account_name}</div>
          </div>
          {txn.shares && (
            <div className="transaction-shares">
              {txn.shares} shares @ ${txn.price}
            </div>
          )}
          <div className="transaction-amount">
            ${txn.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          {txn.notes && (
            <div className="transaction-notes">{txn.notes}</div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const AccountsView = ({ accounts, onAddAccount }) => (
  <div className="accounts-view">
    <div className="accounts-view-header">
      <h2>Investment Accounts</h2>
      <button className="add-account-btn-large" onClick={onAddAccount}>
        <FaPlus />
        Add Account
      </button>
    </div>

    <div className="accounts-list-full">
      {accounts.map(account => {
        const accountGain = account.total_gain || 0;
        const isPositive = accountGain >= 0;
        
        return (
          <div key={account.id} className="account-card-full">
            <div className="account-card-header">
              <div className="account-card-icon" style={{ background: account.color }}>
                {account.account_type?.charAt(0) || 'A'}
              </div>
              <div className="account-card-info">
                <h3>{account.name}</h3>
                <div className="account-card-meta">
                  {account.account_type} {account.institution && `• ${account.institution}`}
                </div>
              </div>
              <div className="account-card-actions">
                <button className="icon-btn"><FaEdit /></button>
                <button className="icon-btn"><FaTrash /></button>
              </div>
            </div>

            <div className="account-card-stats">
              <div className="account-stat">
                <div className="account-stat-label">Current Value</div>
                <div className="account-stat-value">
                  ${account.current_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-stat-label">Cost Basis</div>
                <div className="account-stat-value">
                  ${account.cost_basis?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="account-stat">
                <div className="account-stat-label">Total Gain/Loss</div>
                <div className={`account-stat-value ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}${Math.abs(accountGain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="stat-percent">({account.gain_percent?.toFixed(2)}%)</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ============================================
// MODAL COMPONENTS (Placeholders)
// ============================================

const AddAccountModal = ({ spaceId, widgetId, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Add Account</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <p>Account creation form coming soon...</p>
      </div>
    </div>
  </div>
);

const AddTransactionModal = ({ spaceId, widgetId, accounts, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Add Transaction</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <p>Transaction form coming soon...</p>
      </div>
    </div>
  </div>
);

export default PortfolioApp;