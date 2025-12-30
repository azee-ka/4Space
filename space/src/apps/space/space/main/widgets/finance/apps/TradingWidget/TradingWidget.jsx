// src/features/space/components/apps/TradingApp/TradingWidget.jsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import './TradingWidget.css';
import { 
  FaChartLine, FaExchangeAlt, FaBookOpen, FaClock,
  FaDollarSign, FaPercentage, FaArrowUp, FaArrowDown,
  FaExternalLinkAlt
} from 'react-icons/fa';

// Mock trading data
const mockOrderBook = {
  bids: [
    { price: 42150.50, amount: 1.234, total: 52025.52 },
    { price: 42150.00, amount: 0.567, total: 23899.05 },
    { price: 42149.50, amount: 2.890, total: 121812.06 },
    { price: 42149.00, amount: 0.123, total: 5184.33 },
    { price: 42148.50, amount: 1.567, total: 66046.80 },
  ],
  asks: [
    { price: 42151.00, amount: 0.890, total: 37514.39 },
    { price: 42151.50, amount: 1.234, total: 52014.95 },
    { price: 42152.00, amount: 0.456, total: 19221.31 },
    { price: 42152.50, amount: 2.123, total: 89487.76 },
    { price: 42153.00, amount: 0.789, total: 33258.72 },
  ]
};

const mockRecentTrades = [
  { price: 42150.75, amount: 0.125, time: '14:32:45', type: 'buy' },
  { price: 42150.50, amount: 0.234, time: '14:32:40', type: 'sell' },
  { price: 42151.00, amount: 0.567, time: '14:32:35', type: 'buy' },
  { price: 42150.25, amount: 1.234, time: '14:32:30', type: 'sell' },
  { price: 42151.50, amount: 0.089, time: '14:32:25', type: 'buy' },
];

const mockPositions = [
  { symbol: 'BTC/USD', side: 'LONG', size: 0.5, entryPrice: 41200, currentPrice: 42150, pnl: 475, pnlPercent: 2.31 },
  { symbol: 'ETH/USD', side: 'SHORT', size: 2.0, entryPrice: 2250, currentPrice: 2245, pnl: 10, pnlPercent: 0.22 },
];

// ============================================
// COMPACT MODE
// ============================================

const TradingCompact = ({ widget, spaceId }) => {
  const currentPrice = 42150.75;
  const priceChange = 325.50;
  const priceChangePercent = 0.78;
  const isPositive = priceChange >= 0;

  return (
    <div className="trading-compact">
      <div className="trading-price-card">
        <div className="price-header">
          <span className="price-symbol">BTC/USD</span>
          <FaChartLine className="price-icon" />
        </div>
        <div className="price-current">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FaArrowUp /> : <FaArrowDown />}
          ${Math.abs(priceChange).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <span className="change-percent">({priceChangePercent}%)</span>
        </div>
      </div>

      <div className="trading-quick-stats">
        <div className="quick-stat">
          <span className="stat-label">24h High</span>
          <span className="stat-value">$42,890</span>
        </div>
        <div className="quick-stat">
          <span className="stat-label">24h Low</span>
          <span className="stat-value">$41,650</span>
        </div>
      </div>

      <div className="compact-positions">
        <div className="positions-header">
          <span>Open Positions</span>
          <span className="positions-count">{mockPositions.length}</span>
        </div>
        {mockPositions.map((position, idx) => (
          <div key={idx} className="compact-position-item">
            <div className="position-info">
              <span className="position-symbol">{position.symbol}</span>
              <span className={`position-side ${position.side.toLowerCase()}`}>
                {position.side}
              </span>
            </div>
            <div className={`position-pnl ${position.pnl >= 0 ? 'positive' : 'negative'}`}>
              {position.pnl >= 0 ? '+' : ''}${Math.abs(position.pnl).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE
// ============================================

const TradingModal = ({ widget, spaceId }) => {
  const [activeTab, setActiveTab] = useState('orderbook');
  const [orderType, setOrderType] = useState('limit');
  const [orderSide, setOrderSide] = useState('buy');

  const handleOpenApp = () => {
    window.open(`/space/${spaceId}/trading/${widget.id}`, '_blank');
  };

  return (
    <div className="trading-modal-content">
      <div className="trading-sidebar">
        <div className="sidebar-header">
          <h3>Trading</h3>
        </div>

        <div className="trading-pair-selector">
          <select className="pair-select">
            <option value="BTC/USD">BTC/USD</option>
            <option value="ETH/USD">ETH/USD</option>
            <option value="SOL/USD">SOL/USD</option>
            <option value="BNB/USD">BNB/USD</option>
          </select>
        </div>

        <div className="sidebar-price-info">
          <div className="sidebar-price-large">$42,150.75</div>
          <div className="sidebar-price-change positive">
            +$325.50 (0.78%)
          </div>
        </div>

        <div className="sidebar-market-stats">
          <div className="market-stat-row">
            <span>24h High</span>
            <span>$42,890</span>
          </div>
          <div className="market-stat-row">
            <span>24h Low</span>
            <span>$41,650</span>
          </div>
          <div className="market-stat-row">
            <span>24h Volume</span>
            <span>12,345 BTC</span>
          </div>
        </div>

        <div className="order-form">
          <div className="order-type-tabs">
            <button
              className={`order-type-btn ${orderType === 'limit' ? 'active' : ''}`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
            <button
              className={`order-type-btn ${orderType === 'market' ? 'active' : ''}`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
          </div>

          <div className="order-side-tabs">
            <button
              className={`order-side-btn buy ${orderSide === 'buy' ? 'active' : ''}`}
              onClick={() => setOrderSide('buy')}
            >
              Buy
            </button>
            <button
              className={`order-side-btn sell ${orderSide === 'sell' ? 'active' : ''}`}
              onClick={() => setOrderSide('sell')}
            >
              Sell
            </button>
          </div>

          {orderType === 'limit' && (
            <div className="form-field">
              <label>Price (USD)</label>
              <input type="number" placeholder="42150.00" />
            </div>
          )}

          <div className="form-field">
            <label>Amount (BTC)</label>
            <input type="number" placeholder="0.001" />
          </div>

          <div className="form-field">
            <label>Total (USD)</label>
            <input type="number" placeholder="42.15" disabled />
          </div>

          <button className={`place-order-btn ${orderSide}`}>
            Place {orderSide === 'buy' ? 'Buy' : 'Sell'} Order
          </button>
        </div>

        <button className="sidebar-open-app-btn" onClick={handleOpenApp}>
          <FaExternalLinkAlt />
          Open Full Trading Terminal
        </button>
      </div>

      <div className="trading-main-content">
        <div className="trading-tabs-nav">
          <button
            className={`trading-tab-btn ${activeTab === 'orderbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('orderbook')}
          >
            <FaBookOpen />
            Order Book
          </button>
          <button
            className={`trading-tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            <FaClock />
            Recent Trades
          </button>
          <button
            className={`trading-tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            <FaExchangeAlt />
            Positions ({mockPositions.length})
          </button>
        </div>

        <div className="trading-tab-content">
          {activeTab === 'orderbook' && <OrderBookTab orderBook={mockOrderBook} />}
          {activeTab === 'trades' && <RecentTradesTab trades={mockRecentTrades} />}
          {activeTab === 'positions' && <PositionsTab positions={mockPositions} />}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TAB COMPONENTS
// ============================================

const OrderBookTab = ({ orderBook }) => (
  <div className="orderbook-container">
    <div className="orderbook-section asks">
      <div className="orderbook-header">
        <span>Price (USD)</span>
        <span>Amount (BTC)</span>
        <span>Total (USD)</span>
      </div>
      {orderBook.asks.reverse().map((ask, idx) => (
        <div key={idx} className="orderbook-row ask">
          <span className="order-price">{ask.price.toFixed(2)}</span>
          <span className="order-amount">{ask.amount.toFixed(3)}</span>
          <span className="order-total">{ask.total.toFixed(2)}</span>
        </div>
      ))}
    </div>
    
    <div className="orderbook-spread">
      <span>Spread: $0.50 (0.001%)</span>
    </div>

    <div className="orderbook-section bids">
      {orderBook.bids.map((bid, idx) => (
        <div key={idx} className="orderbook-row bid">
          <span className="order-price">{bid.price.toFixed(2)}</span>
          <span className="order-amount">{bid.amount.toFixed(3)}</span>
          <span className="order-total">{bid.total.toFixed(2)}</span>
        </div>
      ))}
    </div>
  </div>
);

const RecentTradesTab = ({ trades }) => (
  <div className="recent-trades-container">
    <div className="trades-header">
      <span>Price (USD)</span>
      <span>Amount (BTC)</span>
      <span>Time</span>
    </div>
    {trades.map((trade, idx) => (
      <div key={idx} className={`trade-row ${trade.type}`}>
        <span className="trade-price">{trade.price.toFixed(2)}</span>
        <span className="trade-amount">{trade.amount.toFixed(3)}</span>
        <span className="trade-time">{trade.time}</span>
      </div>
    ))}
  </div>
);

const PositionsTab = ({ positions }) => {
  if (positions.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaExchangeAlt />
        </div>
        <h3>No open positions</h3>
        <p>Place your first trade to see positions here</p>
      </div>
    );
  }

  return (
    <div className="positions-table-container">
      <table className="positions-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Size</th>
            <th>Entry Price</th>
            <th>Current Price</th>
            <th>PnL</th>
            <th>Return %</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, idx) => (
            <tr key={idx}>
              <td className="position-symbol-cell">{position.symbol}</td>
              <td>
                <span className={`position-side-badge ${position.side.toLowerCase()}`}>
                  {position.side}
                </span>
              </td>
              <td>{position.size}</td>
              <td>${position.entryPrice.toLocaleString()}</td>
              <td>${position.currentPrice.toLocaleString()}</td>
              <td className={position.pnl >= 0 ? 'positive' : 'negative'}>
                {position.pnl >= 0 ? '+' : ''}${Math.abs(position.pnl).toFixed(2)}
              </td>
              <td className={position.pnlPercent >= 0 ? 'positive' : 'negative'}>
                <strong>{position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================

const TradingWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <TradingCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <TradingModal widget={widget} spaceId={spaceId} />;
};

export default TradingWidget;