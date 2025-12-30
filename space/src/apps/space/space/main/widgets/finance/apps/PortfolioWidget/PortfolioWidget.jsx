// src/features/space/components/apps/PortfolioApp/PortfolioWidget.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './PortfolioWidget.css';
import { 
  FaChartPie, FaChartLine, FaCoins, FaPercentage,
  FaArrowUp, FaArrowDown, FaExternalLinkAlt, FaPlus,
  FaDollarSign, FaWallet, FaSync
} from 'react-icons/fa';

import {
  fetchPortfolioAccounts,
  fetchPortfolioStats,
  fetchPortfolioHoldings,
  syncPortfolioPrices
} from '../../../../../../../../services/spaceApps/financeServices';

// ============================================
// COMPACT MODE (In Widget Card)
// ============================================

const PortfolioCompact = ({ widget, spaceId }) => {
  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats', spaceId, widget.id],
    queryFn: () => fetchPortfolioStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['portfolio-accounts', spaceId, widget.id],
    queryFn: () => fetchPortfolioAccounts(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  if (!stats || accounts.length === 0) {
    return (
      <div className="portfolio-compact-empty">
        <div className="compact-empty-state">
          <div className="empty-icon-wrapper">
            <FaChartPie />
          </div>
          <p>No portfolio data</p>
          <span>Click to add accounts</span>
        </div>
      </div>
    );
  }

  const totalValue = stats.total_value || 0;
  const totalGain = stats.total_gain || 0;
  const totalGainPercent = stats.total_gain_percent || 0;
  const isPositive = totalGain >= 0;

  return (
    <div className="portfolio-compact">
      <div className="portfolio-value-card">
        <div className="value-header">
          <span className="value-label">Total Portfolio</span>
          <FaWallet className="value-icon" />
        </div>
        <div className="value-amount">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`value-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FaArrowUp /> : <FaArrowDown />}
          ${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <span className="change-percent">({totalGainPercent.toFixed(2)}%)</span>
        </div>
      </div>

      <div className="portfolio-stats-grid">
        <div className="portfolio-stat-card">
          <FaCoins className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{accounts.length}</div>
            <div className="stat-label">Accounts</div>
          </div>
        </div>
        <div className="portfolio-stat-card">
          <FaChartPie className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.total_holdings || 0}</div>
            <div className="stat-label">Holdings</div>
          </div>
        </div>
      </div>

      <div className="compact-accounts-list">
        {accounts.slice(0, 3).map(account => (
          <div key={account.id} className="compact-account-item">
            <div className="account-info">
              <div className="account-name">{account.name}</div>
              <div className="account-type">{account.account_type}</div>
            </div>
            <div className="account-value">
              ${account.current_value?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      <div className="compact-view-all">
        <span>Click to view full portfolio</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE (Dashboard)
// ============================================

const PortfolioModal = ({ widget, spaceId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats', spaceId, widget.id],
    queryFn: () => fetchPortfolioStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['portfolio-accounts', spaceId, widget.id],
    queryFn: () => fetchPortfolioAccounts(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['portfolio-holdings', spaceId, widget.id, selectedAccount],
    queryFn: () => fetchPortfolioHoldings(spaceId, widget.id, { account: selectedAccount }),
    enabled: !!spaceId && !!widget.id
  });

  const syncPricesMutation = useMutation({
    mutationFn: () => syncPortfolioPrices(spaceId, widget.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['portfolio-holdings']);
      queryClient.invalidateQueries(['portfolio-stats']);
    }
  });

  const handleOpenApp = () => {
    window.open(`/space/${spaceId}/portfolio/${widget.id}`, '_blank');
  };

  return (
    <div className="portfolio-modal-content">
      <div className="portfolio-sidebar">
        <div className="sidebar-header">
          <h3>Accounts</h3>
          <button className="add-account-btn" title="Add Account">
            <FaPlus />
          </button>
        </div>

        <div className="accounts-list">
          <button
            className={`account-filter-btn ${!selectedAccount ? 'active' : ''}`}
            onClick={() => setSelectedAccount(null)}
          >
            <FaWallet />
            <span>All Accounts</span>
            <span className="account-count">{accounts.length}</span>
          </button>

          {accounts.map(account => {
            const accountGain = account.total_gain || 0;
            const isAccountPositive = accountGain >= 0;
            
            return (
              <button
                key={account.id}
                className={`account-item ${selectedAccount === account.id ? 'active' : ''}`}
                onClick={() => setSelectedAccount(account.id)}
              >
                <div className="account-icon" style={{ background: account.color || '#3b82f6' }}>
                  {account.account_type?.charAt(0) || 'A'}
                </div>
                <div className="account-info">
                  <div className="account-name">{account.name}</div>
                  <div className="account-type">{account.account_type}</div>
                </div>
                <div className="account-details">
                  <div className="account-value">
                    ${account.current_value?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <div className={`account-gain ${isAccountPositive ? 'positive' : 'negative'}`}>
                    {isAccountPositive ? '+' : ''}{account.gain_percent?.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="sidebar-actions">
          <button 
            className="sidebar-action-btn"
            onClick={() => syncPricesMutation.mutate()}
            disabled={syncPricesMutation.isLoading}
          >
            <FaSync className={syncPricesMutation.isLoading ? 'spinning' : ''} />
            Sync Prices
          </button>
        </div>

        <button className="sidebar-open-app-btn" onClick={handleOpenApp}>
          <FaExternalLinkAlt />
          Open Full Portfolio
        </button>
      </div>

      <div className="portfolio-main-content">
        <div className="portfolio-tabs-nav">
          <button
            className={`portfolio-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`portfolio-tab-btn ${activeTab === 'holdings' ? 'active' : ''}`}
            onClick={() => setActiveTab('holdings')}
          >
            Holdings
            <span className="tab-count">{holdings.length}</span>
          </button>
          <button
            className={`portfolio-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <FaChartLine />
            Performance
          </button>
          <button
            className={`portfolio-tab-btn ${activeTab === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocation')}
          >
            <FaChartPie />
            Allocation
          </button>
        </div>

        <div className="portfolio-tab-content">
          {activeTab === 'overview' && <OverviewTab stats={stats} accounts={accounts} />}
          {activeTab === 'holdings' && <HoldingsTab holdings={holdings} />}
          {activeTab === 'performance' && <PerformanceTab stats={stats} />}
          {activeTab === 'allocation' && <AllocationTab holdings={holdings} stats={stats} />}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const OverviewTab = ({ stats, accounts }) => {
  const totalValue = stats?.total_value || 0;
  const totalGain = stats?.total_gain || 0;
  const totalGainPercent = stats?.total_gain_percent || 0;
  const isPositive = totalGain >= 0;

  return (
    <div className="overview-content">
      <div className="overview-stats-grid">
        <div className="overview-stat-large">
          <div className="stat-large-label">Total Value</div>
          <div className="stat-large-value">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`stat-large-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
            ${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2 })} 
            ({totalGainPercent.toFixed(2)}%)
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-card-header">
            <FaDollarSign className="stat-card-icon" />
            <span>Today's Change</span>
          </div>
          <div className={`stat-card-value ${(stats?.today_change || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(stats?.today_change || 0) >= 0 ? '+' : ''}
            ${Math.abs(stats?.today_change || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-card-header">
            <FaChartLine className="stat-card-icon" />
            <span>YTD Return</span>
          </div>
          <div className={`stat-card-value ${(stats?.ytd_return || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(stats?.ytd_return || 0) >= 0 ? '+' : ''}{stats?.ytd_return?.toFixed(2)}%
          </div>
        </div>

        <div className="overview-stat-card">
          <div className="stat-card-header">
            <FaPercentage className="stat-card-icon" />
            <span>Total Cost Basis</span>
          </div>
          <div className="stat-card-value">
            ${stats?.total_cost_basis?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="accounts-summary">
        <h4>Account Summary</h4>
        <div className="accounts-grid">
          {accounts.map(account => {
            const accountGain = account.total_gain || 0;
            const isAccountPositive = accountGain >= 0;
            
            return (
              <div key={account.id} className="account-summary-card">
                <div className="account-summary-header">
                  <div className="account-icon-small" style={{ background: account.color || '#3b82f6' }}>
                    {account.account_type?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="account-summary-name">{account.name}</div>
                    <div className="account-summary-type">{account.account_type}</div>
                  </div>
                </div>
                <div className="account-summary-value">
                  ${account.current_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className={`account-summary-change ${isAccountPositive ? 'positive' : 'negative'}`}>
                  {isAccountPositive ? '+' : ''}{account.gain_percent?.toFixed(2)}%
                </div>
                <div className="account-summary-cost">
                  Cost: ${account.cost_basis?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const HoldingsTab = ({ holdings }) => {
  if (holdings.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaCoins />
        </div>
        <h3>No holdings yet</h3>
        <p>Add your first position to start tracking</p>
      </div>
    );
  }

  return (
    <div className="holdings-table-container">
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Shares</th>
            <th>Avg Cost</th>
            <th>Current Price</th>
            <th>Market Value</th>
            <th>Total Gain/Loss</th>
            <th>Return %</th>
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
                <td>{holding.shares?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                <td>${holding.average_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${holding.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="holding-market-value">
                  ${holding.market_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  {isPositive ? '+' : ''}${Math.abs(gain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  <strong>{isPositive ? '+' : ''}{gainPercent.toFixed(2)}%</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PerformanceTab = ({ stats }) => (
  <div className="performance-content">
    <div className="performance-chart-placeholder">
      <FaChartLine />
      <h3>Performance Chart</h3>
      <p>Historical performance and return analysis</p>
      <span className="coming-soon-badge">Available in full Portfolio app</span>
    </div>
    
    <div className="performance-metrics">
      <div className="metric-card">
        <div className="metric-label">1 Month</div>
        <div className="metric-value">+5.2%</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">3 Month</div>
        <div className="metric-value">+12.8%</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">YTD</div>
        <div className="metric-value">{stats?.ytd_return?.toFixed(2)}%</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">1 Year</div>
        <div className="metric-value">+24.3%</div>
      </div>
    </div>
  </div>
);

const AllocationTab = ({ holdings, stats }) => (
  <div className="allocation-content">
    <div className="allocation-chart-placeholder">
      <FaChartPie />
      <h3>Asset Allocation</h3>
      <p>Portfolio diversification and allocation breakdown</p>
      <span className="coming-soon-badge">Available in full Portfolio app</span>
    </div>
    
    <div className="allocation-breakdown">
      <h4>Top Holdings</h4>
      {holdings.slice(0, 5).map(holding => {
        const percentage = stats?.total_value > 0 
          ? ((holding.market_value / stats.total_value) * 100).toFixed(2) 
          : 0;
        
        return (
          <div key={holding.id} className="allocation-item">
            <div className="allocation-info">
              <span className="allocation-symbol">{holding.symbol}</span>
              <span className="allocation-name">{holding.name}</span>
            </div>
            <div className="allocation-percentage">{percentage}%</div>
          </div>
        );
      })}
    </div>
  </div>
);

// ============================================
// MAIN EXPORT
// ============================================

const PortfolioWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <PortfolioCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <PortfolioModal widget={widget} spaceId={spaceId} />;
};

export default PortfolioWidget;