// src/features/space/components/apps/CryptoApp/CryptoApp.jsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './CryptoApp.css';
import {
  FaBitcoin, FaPlus, FaDownload, FaUpload, FaSync,
  FaSearch, FaEdit, FaTrash, FaWallet, FaHistory,
  FaChartLine, FaExchangeAlt, FaDollarSign, FaPercentage
} from 'react-icons/fa';

import {
  fetchCryptoHoldings,
  fetchCryptoStats,
  createCryptoTransaction,
  syncCryptoPrices
} from '../../../../../services/spaceApps/financeServices';

const CryptoApp = () => {
  const { spaceId, widgetId } = useParams();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState('portfolio'); // portfolio, markets, transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['crypto-stats', spaceId, widgetId],
    queryFn: () => fetchCryptoStats(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['crypto-holdings', spaceId, widgetId],
    queryFn: () => fetchCryptoHoldings(spaceId, widgetId),
    enabled: !!spaceId && !!widgetId
  });

  // Mutations
  const syncPricesMutation = useMutation({
    mutationFn: () => syncCryptoPrices(spaceId, widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['crypto-holdings']);
      queryClient.invalidateQueries(['crypto-stats']);
    }
  });

  // Filtered holdings
  const filteredHoldings = holdings.filter(holding =>
    holding.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    holding.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="crypto-app">
      {/* Header */}
      <div className="crypto-app-header">
        <div className="crypto-app-title">
          <FaBitcoin />
          <h1>Crypto Tracker</h1>
        </div>
        <div className="crypto-app-actions">
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
      <div className="crypto-stats-overview">
        <div className="stat-overview-card large">
          <div className="stat-overview-label">Total Portfolio Value</div>
          <div className="stat-overview-value">
            ${stats?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`stat-overview-change ${(stats?.total_gain || 0) >= 0 ? 'positive' : 'negative'}`}>
            ${Math.abs(stats?.total_gain || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} 
            ({stats?.total_gain_percent?.toFixed(2)}%)
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaPercentage />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">24h Change</div>
            <div className={`stat-overview-value ${(stats?.change_24h || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stats?.change_24h || 0) >= 0 ? '+' : ''}{stats?.change_24h?.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaDollarSign />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Total Cost</div>
            <div className="stat-overview-value">
              ${stats?.total_cost_basis?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon">
            <FaBitcoin />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Total Assets</div>
            <div className="stat-overview-value">{holdings.length}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="crypto-app-nav">
        <button
          className={`nav-btn ${activeView === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveView('portfolio')}
        >
          <FaWallet />
          Portfolio
          <span className="nav-count">{holdings.length}</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveView('markets')}
        >
          <FaChartLine />
          Markets
        </button>
        <button
          className={`nav-btn ${activeView === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveView('transactions')}
        >
          <FaHistory />
          Transactions
        </button>
      </div>

      {/* Main Content */}
      <div className="crypto-app-content">
        {activeView === 'portfolio' && (
          <PortfolioView
            holdings={filteredHoldings}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeView === 'markets' && <MarketsView />}

        {activeView === 'transactions' && <TransactionsView />}
      </div>

      {/* Modals */}
      {showAddTransactionModal && (
        <AddTransactionModal
          spaceId={spaceId}
          widgetId={widgetId}
          onClose={() => setShowAddTransactionModal(false)}
        />
      )}
    </div>
  );
};

// ============================================
// VIEW COMPONENTS
// ============================================

const PortfolioView = ({ holdings, searchQuery, onSearchChange }) => (
  <div className="portfolio-view">
    <div className="portfolio-toolbar">
      <div className="search-box">
        <FaSearch />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>

    {holdings.length === 0 ? (
      <div className="portfolio-empty">
        <div className="empty-state-icon">
          <FaBitcoin />
        </div>
        <h3>No crypto holdings</h3>
        <p>Add your first transaction to start tracking</p>
      </div>
    ) : (
      <div className="holdings-table-wrapper">
        <table className="holdings-table-full">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Amount</th>
              <th>Avg Cost</th>
              <th>Current Price</th>
              <th>Cost Basis</th>
              <th>Market Value</th>
              <th>Total Gain/Loss</th>
              <th>Return %</th>
              <th>Chain</th>
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
                  <td className="crypto-asset-cell">
                    <div className="asset-info-full">
                      <strong>{holding.symbol}</strong>
                      <span className="asset-name-full">{holding.name}</span>
                    </div>
                  </td>
                  <td className="crypto-amount">
                    {holding.amount?.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                  </td>
                  <td>${holding.average_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="crypto-price">
                    ${holding.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>${holding.cost_basis?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
                    <span className="chain-badge-full">{holding.chain || 'N/A'}</span>
                  </td>
                  <td>
                    <div className="table-actions">
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
    )}
  </div>
);

const MarketsView = () => (
  <div className="markets-view">
    <div className="markets-header">
      <h2>Crypto Markets</h2>
      <div className="market-filters">
        <select className="market-filter-select">
          <option value="all">All Markets</option>
          <option value="favorites">Favorites</option>
          <option value="gainers">Top Gainers</option>
          <option value="losers">Top Losers</option>
        </select>
      </div>
    </div>

    <div className="markets-placeholder">
      <FaChartLine />
      <h3>Real-time Market Data</h3>
      <p>Live prices, charts, and market analysis coming soon</p>
    </div>
  </div>
);

const TransactionsView = () => (
  <div className="transactions-view">
    <div className="transactions-header">
      <h2>Transaction History</h2>
    </div>

    <div className="transactions-placeholder">
      <FaExchangeAlt />
      <h3>Transaction History</h3>
      <p>View all your buy, sell, and transfer transactions</p>
    </div>
  </div>
);

// ============================================
// MODAL COMPONENTS
// ============================================

const AddTransactionModal = ({ spaceId, widgetId, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal large" onClick={(e) => e.stopPropagation()}>
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

export default CryptoApp;