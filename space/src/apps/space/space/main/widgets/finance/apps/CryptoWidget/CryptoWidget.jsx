// src/features/space/components/apps/CryptoApp/CryptoWidget.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './CryptoWidget.css';
import { 
  FaBitcoin, FaPlus, FaExternalLinkAlt, FaSync,
  FaChartLine, FaWallet, FaArrowUp, FaArrowDown,
  FaDollarSign, FaPercentage, FaCoins
} from 'react-icons/fa';

import {
  fetchCryptoHoldings,
  fetchCryptoStats,
  syncCryptoPrices
} from '../../../../../../../../services/spaceApps/financeServices';

// ============================================
// COMPACT MODE
// ============================================

const CryptoCompact = ({ widget, spaceId }) => {
  const { data: stats } = useQuery({
    queryKey: ['crypto-stats', spaceId, widget.id],
    queryFn: () => fetchCryptoStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['crypto-holdings', spaceId, widget.id],
    queryFn: () => fetchCryptoHoldings(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  if (!stats || holdings.length === 0) {
    return (
      <div className="crypto-compact-empty">
        <div className="compact-empty-state">
          <div className="empty-icon-wrapper">
            <FaBitcoin />
          </div>
          <p>No crypto holdings</p>
          <span>Click to add holdings</span>
        </div>
      </div>
    );
  }

  const totalValue = stats.total_value || 0;
  const totalGain = stats.total_gain || 0;
  const totalGainPercent = stats.total_gain_percent || 0;
  const isPositive = totalGain >= 0;

  return (
    <div className="crypto-compact">
      <div className="crypto-value-card">
        <div className="value-header">
          <span className="value-label">Total Portfolio</span>
          <FaBitcoin className="value-icon" />
        </div>
        <div className="value-amount">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className={`value-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FaArrowUp /> : <FaArrowDown />}
          ${Math.abs(totalGain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <span className="change-percent">({totalGainPercent.toFixed(2)}%)</span>
        </div>
      </div>

      <div className="crypto-stats-grid">
        <div className="crypto-stat-card">
          <FaCoins className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{holdings.length}</div>
            <div className="stat-label">Assets</div>
          </div>
        </div>
        <div className="crypto-stat-card">
          <FaChartLine className="stat-icon" />
          <div className="stat-content">
            <div className={`stat-value ${(stats.change_24h || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats.change_24h || 0) >= 0 ? '+' : ''}{stats.change_24h?.toFixed(2)}%
            </div>
            <div className="stat-label">24h Change</div>
          </div>
        </div>
      </div>

      <div className="compact-holdings-list">
        {holdings.slice(0, 3).map(holding => {
          const gain = (holding.market_value || 0) - (holding.cost_basis || 0);
          const gainPercent = holding.cost_basis > 0 ? (gain / holding.cost_basis) * 100 : 0;
          const isHoldingPositive = gain >= 0;
          
          return (
            <div key={holding.id} className="compact-holding-item">
              <div className="holding-info">
                <div className="holding-symbol">{holding.symbol}</div>
                <div className="holding-amount">{holding.amount} {holding.symbol}</div>
              </div>
              <div className="holding-details">
                <div className="holding-value">
                  ${holding.market_value?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className={`holding-gain ${isHoldingPositive ? 'positive' : 'negative'}`}>
                  {isHoldingPositive ? '+' : ''}{gainPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="compact-view-all">
        <span>Click to view full portfolio</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE
// ============================================

const CryptoModal = ({ widget, spaceId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('holdings');

  const { data: stats } = useQuery({
    queryKey: ['crypto-stats', spaceId, widget.id],
    queryFn: () => fetchCryptoStats(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['crypto-holdings', spaceId, widget.id],
    queryFn: () => fetchCryptoHoldings(spaceId, widget.id),
    enabled: !!spaceId && !!widget.id
  });

  const syncPricesMutation = useMutation({
    mutationFn: () => syncCryptoPrices(spaceId, widget.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['crypto-holdings']);
      queryClient.invalidateQueries(['crypto-stats']);
    }
  });

  const handleOpenApp = () => {
    window.open(`/space/${spaceId}/crypto/${widget.id}`, '_blank');
  };

  return (
    <div className="crypto-modal-content">
      <div className="crypto-sidebar">
        <div className="sidebar-header">
          <h3>Crypto</h3>
          <button className="add-crypto-btn" title="Add Holding">
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
                ${stats?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <div className="sidebar-stat-label">Total Value</div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon">
              <FaPercentage />
            </div>
            <div className="sidebar-stat-content">
              <div className={`sidebar-stat-value ${(stats?.change_24h || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(stats?.change_24h || 0) >= 0 ? '+' : ''}{stats?.change_24h?.toFixed(2)}%
              </div>
              <div className="sidebar-stat-label">24h Change</div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon">
              <FaCoins />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{holdings.length}</div>
              <div className="sidebar-stat-label">Assets</div>
            </div>
          </div>
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
          Open Full Crypto Tracker
        </button>
      </div>

      <div className="crypto-main-content">
        <div className="crypto-tabs-nav">
          <button
            className={`crypto-tab-btn ${activeTab === 'holdings' ? 'active' : ''}`}
            onClick={() => setActiveTab('holdings')}
          >
            <FaWallet />
            Holdings
            <span className="tab-count">{holdings.length}</span>
          </button>
          <button
            className={`crypto-tab-btn ${activeTab === 'markets' ? 'active' : ''}`}
            onClick={() => setActiveTab('markets')}
          >
            <FaChartLine />
            Markets
          </button>
        </div>

        <div className="crypto-tab-content">
          {activeTab === 'holdings' && <HoldingsTab holdings={holdings} />}
          {activeTab === 'markets' && <MarketsTab />}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const HoldingsTab = ({ holdings }) => {
  if (holdings.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaBitcoin />
        </div>
        <h3>No holdings yet</h3>
        <p>Add your first crypto holding to start tracking</p>
      </div>
    );
  }

  return (
    <div className="holdings-table-container">
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Amount</th>
            <th>Avg Cost</th>
            <th>Current Price</th>
            <th>Market Value</th>
            <th>Total Gain/Loss</th>
            <th>Return %</th>
            <th>Chain</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(holding => {
            const gain = (holding.market_value || 0) - (holding.cost_basis || 0);
            const gainPercent = holding.cost_basis > 0 ? (gain / holding.cost_basis) * 100 : 0;
            const isPositive = gain >= 0;
            
            return (
              <tr key={holding.id}>
                <td className="crypto-asset">
                  <div className="asset-info">
                    <strong>{holding.symbol}</strong>
                    <span className="asset-name">{holding.name}</span>
                  </div>
                </td>
                <td>{holding.amount?.toLocaleString('en-US', { maximumFractionDigits: 8 })}</td>
                <td>${holding.average_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td>${holding.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="crypto-market-value">
                  <strong>${holding.market_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  {isPositive ? '+' : ''}${Math.abs(gain).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className={isPositive ? 'positive' : 'negative'}>
                  <strong>{isPositive ? '+' : ''}{gainPercent.toFixed(2)}%</strong>
                </td>
                <td>
                  <span className="chain-badge">{holding.chain || 'N/A'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const MarketsTab = () => (
  <div className="markets-content">
    <div className="markets-placeholder">
      <FaChartLine />
      <h3>Market Data</h3>
      <p>Real-time crypto market prices and charts</p>
      <span className="coming-soon-badge">Available in full Crypto Tracker app</span>
    </div>
  </div>
);

// ============================================
// MAIN EXPORT
// ============================================

const CryptoWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <CryptoCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <CryptoModal widget={widget} spaceId={spaceId} />;
};

export default CryptoWidget;