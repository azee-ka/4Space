import React from 'react';
import Masonry from 'react-masonry-css';
import './financeDashboard.css';

const indices = [
  { label: 'S&P 500',    value: '4,500.23', change: '+0.82%' },
  { label: 'NASDAQ',     value: '14,200.11', change: '+1.24%' },
  { label: 'DOW J',      value: '35,800.45', change: '-0.15%' },
];

const summaryCards = [
  { title: "Today's P/L",      value: '+1.25%',  meta: '+0.75% since open' },
  { title: 'Open Positions',   placeholder: '[Positions Table]' },
  { title: 'Cash Available',   value: '$10,000.00' },
  { title: 'News & Alerts',    placeholder: '[News Feed]' },
];

const watchlist = [
  { symbol: 'AAPL', price: '172.50', change: '+1.12%' },
  { symbol: 'TSLA', price: '705.30', change: '-0.48%' },
  { symbol: 'GOOG', price: '2,850.20', change: '+0.25%' },
  { symbol: 'AMZN', price: '3,350.75', change: '+0.78%' },
];

const backtests = [
  { name: 'Mean Reversion', pnl: '+12.5%', duration: 'Jan–Jun' },
  { name: 'Momentum EU',    pnl: '+8.2%',  duration: 'Feb–Jul' },
  { name: 'FX Carry',       pnl: '+5.7%',  duration: 'Mar–Aug' },
];

const smallCols  = { default: 6, 1024: 6, 600: 4, 400: 2 };
const mediumCols = { default: 3, 1024: 2, 600: 1 };
const largeCols  = { default: 3, 768: 2, 400: 1 };

export default function FinanceDashboard() {
  return (
    <div className="finance-dashboard-page">
      {/* header */}
      <header className="fd-header">
        <h2 className="fd-title">Finance Dashboard</h2>
        <div className="fd-portfolio">
          Total Portfolio Value:
          <span>$</span><span>250,000.00</span>
        </div>
      </header>

      {/* small cards (indices) */}
      <Masonry
        className="fd-masonry-grid fd-masonry-small"
        columnClassName="fd-masonry-column"
        breakpointCols={smallCols}
      >
        {indices.map((idx,i) => (
          <div key={i} className="fd-card">
            <div className="fd-card-content">
              <h3 className="fd-card-title">{idx.label}</h3>
              <p className="fd-card-value">{idx.value}</p>
              <p className={`fd-card-meta ${idx.change[0]==='+'?'positive':'negative'}`}>
                {idx.change}
              </p>
            </div>
          </div>
        ))}
      </Masonry>

      {/* medium cards (summary) */}
      <Masonry
        className="fd-masonry-grid fd-masonry-medium"
        columnClassName="fd-masonry-column"
        breakpointCols={mediumCols}
      >
        {summaryCards.map((card,i) => (
          <div key={i} className="fd-card">
            <div className="fd-card-content">
              <h3 className="fd-card-title">{card.title}</h3>
              {card.value && <p className="fd-card-value">{card.value}</p>}
              {card.meta  && <p className="fd-card-meta">{card.meta}</p>}
              {card.placeholder && (
                <div className="fd-placeholder">{card.placeholder}</div>
              )}
            </div>
          </div>
        ))}
      </Masonry>

      {/* watchlist & quick‑order split */}
      <div className="fd-split-grid">
        <div>
          <div className="fd-card">
            <div className="fd-card-content">
              <h3 className="fd-card-title">Watchlist</h3>
              <table className="fd-table">
                <thead>
                  <tr><th>Symbol</th><th>Price</th><th>Change</th></tr>
                </thead>
                <tbody>
                  {watchlist.map((it,i) => (
                    <tr key={i}>
                      <td>{it.symbol}</td>
                      <td>{it.price}</td>
                      <td className={it.change[0]==='+'?'positive':'negative'}>
                        {it.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="fd-card">
            <div className="fd-card-content">
              <h3 className="fd-card-title">Recent Trades</h3>
              <div className="fd-placeholder">[Recent Trades List]</div>
            </div>
          </div>
        </div>

        <div className="fd-quick-grid">
          <div className="fd-card">
            <div className="fd-card-content">
              <h3 className="fd-card-title">Quick Order</h3>
              <form className="fd-order-form">
                <div className="fd-form-group">
                  <label>Symbol</label>
                  <input placeholder="EUR/USD" />
                </div>
                <div className="fd-form-group">
                  <label>Side</label>
                  <select><option>Buy</option><option>Sell</option></select>
                </div>
                <div className="fd-form-group">
                  <label>Amount</label>
                  <input type="number" placeholder="0.00" />
                </div>
                <button type="submit" className="fd-btn-submit">Execute</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* large cards (backtests) */}
      <Masonry
        className="fd-masonry-grid fd-masonry-large"
        columnClassName="fd-masonry-column"
        breakpointCols={largeCols}
      >
        {backtests.map((t,i) => (
          <div key={i} className="fd-card">
            <div className="fd-card-content">
              <h3 className="fd-card-title">{t.name}</h3>
              <p className="fd-card-value">{t.pnl}</p>
              <p className="fd-card-meta">{t.duration}</p>
              <div className="fd-placeholder-small">[Equity Curve]</div>
            </div>
          </div>
        ))}
      </Masonry>
    </div>
  );
}
