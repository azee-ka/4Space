import React, { useState } from 'react';
import './tradePage.css';

const TABS = [
  { key: 'terminal', label: 'Trade Terminal' },
  { key: 'holdings', label: 'Holdings' },
  { key: 'orders', label: 'Orders' },
  { key: 'transactions', label: 'Transactions' },
];

export default function TradePage() {
  const [activeTab, setActiveTab] = useState('terminal');

  return (
    <div className="trade-page">
      <header className="trade-header">
        <h2 className="trade-title">4X Trading</h2>
        <div className="account-balance">Balance: $<span>100,000.00</span></div>
      </header>

      <nav className="trade-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`trade-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="trade-content">
        {activeTab === 'terminal' && <TerminalView />}
        {activeTab === 'holdings' && <HoldingsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'transactions' && <TransactionsView />}
      </section>
    </div>
  );
}

function TerminalView() {
  return (
    <div className="trade-grid">
      <div className="trade-card">
        <div className="trade-card-blur" />
        <div className="trade-card-content">
          <h3 className="trade-card-title">Live Price Chart</h3>
          <div className="trade-card-body placeholder">[Chart Component]</div>
        </div>
      </div>

      <div className="trade-card">
        <div className="trade-card-blur" />
        <div className="trade-card-content">
          <h3 className="trade-card-title">Place Order</h3>
          <form className="order-form">
            <div className="form-group">
              <label htmlFor="symbol">Symbol</label>
              <input id="symbol" placeholder="e.g. AAPL" />
            </div>
            <div className="form-group">
              <label htmlFor="side">Side</label>
              <select id="side">
                <option>Buy</option>
                <option>Sell</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="qty">Quantity</label>
              <input id="qty" type="number" min="1" placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="price">Limit Price</label>
              <input id="price" type="number" step="0.01" placeholder="0.00" />
            </div>
            <button type="submit" className="btn-submit">Place Order</button>
          </form>
        </div>
      </div>

      <div className="trade-card">
        <div className="trade-card-blur" />
        <div className="trade-card-content">
          <h3 className="trade-card-title">Order Book Depth</h3>
          <div className="trade-card-body placeholder">[Order Book]</div>
        </div>
      </div>
    </div>
  );
}

function HoldingsView() {
  return (
    <div className="trade-grid">
      <div className="trade-card">
        <div className="trade-card-blur" />
        <div className="trade-card-content">
          <h3 className="trade-card-title">Your Holdings</h3>
          <div className="trade-card-body placeholder">[Holdings Table]</div>
        </div>
      </div>
    </div>
  );
}

function OrdersView() {
  return (
    <div className="trade-grid">
      <div className="trade-card">
        <div className="trade-card-blur" />
        <div className="trade-card-content">
          <h3 className="trade-card-title">Open & Closed Orders</h3>
          <div className="trade-card-body placeholder">[Orders List]</div>
        </div>
      </div>
    </div>
  );
}

function TransactionsView() {
  return (
    <div className="trade-grid">
      <div className="trade-card">
        <div className="trade-card-blur" />
        <div className="trade-card-content">
          <h3 className="trade-card-title">Transaction History</h3>
          <div className="trade-card-body placeholder">[Transactions Log]</div>
        </div>
      </div>
    </div>
  );
}
