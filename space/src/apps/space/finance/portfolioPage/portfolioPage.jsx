import React, { useState, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import './portfolioPage.css';

const TABS = [
  { key: 'allocation',  label: 'Allocation' },
  { key: 'performance', label: 'Performance' },
  { key: 'exposure',    label: 'Exposure' },
  { key: 'rebalance',   label: 'Rebalance' },
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('allocation');

  return (
    <div className="portfolio-page">
      {/* NEW HEADER */}
      <header className="pp-header">
        <h1 className="pp-header-title">Portfolio</h1>
      </header>

      {/* Tabs */}
      <nav className="pp-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`pp-tab${activeTab===tab.key?' active':''}`}
            onClick={()=>setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="pp-content">
        {activeTab==='allocation'  && <AllocationView />}
        {activeTab==='performance' && <PerformanceView />}
        {activeTab==='exposure'    && <ExposureView />}
        {activeTab==='rebalance'   && <RebalanceView />}
      </div>
    </div>
  );
}


// --- Allocation ---
const allocationData = [
  { asset: 'Equities',    pct: 45 },
  { asset: 'Bonds',       pct: 30 },
  { asset: 'Cash',        pct: 15 },
  { asset: 'Alternatives',pct: 10 },
];

function AllocationView() {
  const smallCols = { default: 4, 1024: 3, 600: 2, 400: 1 };
  return (
    <Masonry
      className="pp-masonry pp-masonry-small"
      columnClassName="pp-masonry-col"
      breakpointCols={smallCols}
    >
      {allocationData.map((a,i)=>(
        <div key={i} className="pp-card">
          <div className="pp-card-content">
            <h3 className="pp-card-title">{a.asset}</h3>
            <p className="pp-card-value">{a.pct}%</p>
            <div className="pp-placeholder">[Pie slice]</div>
          </div>
        </div>
      ))}
    </Masonry>
  );
}

// --- Performance ---
const performanceSummary = [
  { title: 'YTD Return',  value: '+12.4%', meta: '+2.3% vs benchmark' },
  { title: '1‑Year',      value: '+18.7%', meta: '+3.1%' },
  { title: '3‑Year',      value: '+42.9%', meta: '+5.4% annualized' },
];

function PerformanceView() {
  const mediumCols = { default: 3, 768: 2, 400: 1 };
  return (
    <>
      <Masonry
        className="pp-masonry pp-masonry-medium"
        columnClassName="pp-masonry-col"
        breakpointCols={mediumCols}
      >
        {performanceSummary.map((s,i)=>(
          <div key={i} className="pp-card">
            <div className="pp-card-content">
              <h3 className="pp-card-title">{s.title}</h3>
              <p className="pp-card-value">{s.value}</p>
              {s.meta && <p className="pp-card-meta">{s.meta}</p>}
            </div>
          </div>
        ))}
      </Masonry>
      <div className="pp-chart">
        <div className="pp-placeholder">[Performance Chart]</div>
      </div>
    </>
  );
}

// --- Exposure ---
const exposureData = [
  { category: 'Region: US',        exposure: '50%' },
  { category: 'Region: Europe',    exposure: '25%' },
  { category: 'Sector: Tech',      exposure: '30%' },
  { category: 'Sector: Healthcare',exposure: '20%' },
];

function ExposureView() {
  return (
    <div className="pp-table-card">
      <table className="pp-table">
        <thead>
          <tr><th>Category</th><th>Exposure</th></tr>
        </thead>
        <tbody>
          {exposureData.map((r,i)=>(
            <tr key={i}>
              <td>{r.category}</td>
              <td>{r.exposure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Rebalance ---
function RebalanceView() {
  const [targets, setTargets] = useState({
    Equities: 50, Bonds: 30, Cash: 10, Alternatives: 10
  });
  const handleChange = (k,e) => {
    setTargets({ ...targets, [k]: parseInt(e.target.value) });
  };
  const handleSubmit = e => {
    e.preventDefault();
    alert('Rebalance order submitted:\n' +
      Object.entries(targets).map(([k,v])=>`${k}: ${v}%`).join('\n')
    );
  };

  return (
    <form className="pp-form" onSubmit={handleSubmit}>
      {Object.entries(targets).map(([k,v])=>(
        <div key={k} className="pp-form-group">
          <label>{k} target (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={v}
            onChange={e=>handleChange(k,e)}
          />
        </div>
      ))}
      <button type="submit" className="pp-btn">Execute Rebalance</button>
    </form>
  );
}
