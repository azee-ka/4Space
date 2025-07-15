import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import './researchPage.css';

const TAB_LIST = [
  { key: 'notebooks',   label: 'Notebooks' },
  { key: 'strategies',  label: 'Strategy Library' },
  { key: 'backtesting', label: 'Backtesting' },
  { key: 'model-lab',   label: 'Model Lab' },
  { key: 'data-lab',    label: 'Data Lab' },
];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState('notebooks');

  return (
    <div className="research-page">
      <header className="rp-header">
        <h2 className="rp-title">Research Workspace</h2>
      </header>

      <nav className="rp-tabs">
        {TAB_LIST.map(tab => (
          <button
            key={tab.key}
            className={`rp-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="rp-content">
        {activeTab === 'notebooks'   && <NotebooksView />}
        {activeTab === 'strategies'  && <StrategiesView />}
        {activeTab === 'backtesting' && <BacktestingView />}
        {activeTab === 'model-lab'   && <ModelLabView />}
        {activeTab === 'data-lab'    && <DataLabView />}
      </section>
    </div>
  );
}

// --- Notebooks View ---
const initialNotebooks = [
  {
    id: 1,
    title: 'Market Analysis',
    desc:  'Deep dive into FX market structure.',
    lastEdited: '2025-07-10',
    tags: ['FX', 'Volatility'],
  },
  {
    id: 2,
    title: 'Mean Reversion Demo',
    desc:  'Testing mean reversion on equities.',
    lastEdited: '2025-07-08',
    tags: ['Equities', 'Backtest'],
  },
  // …add more
];

function NotebooksView() {
  const [notebooks, setNotebooks] = useState(initialNotebooks);
  const [search, setSearch]       = useState('');
  const filtered = notebooks.filter(nb =>
    nb.title.toLowerCase().includes(search.toLowerCase()) ||
    nb.desc.toLowerCase().includes(search.toLowerCase())
  );

  const smallCols = { default: 3, 1024: 2, 600: 1 };
  return (
    <>
      <div className="rp-controls">
        <input
          className="rp-input"
          placeholder="Search notebooks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="rp-btn" onClick={() => {
          const id = notebooks.length + 1;
          setNotebooks([
            ...notebooks,
            {
              id,
              title: `Untitled Notebook ${id}`,
              desc: '',
              lastEdited: new Date().toISOString().slice(0,10),
              tags: []
            }
          ]);
        }}>
          New Notebook
        </button>
      </div>

      <Masonry
        className="rp-masonry-grid"
        columnClassName="rp-masonry-column"
        breakpointCols={smallCols}
      >
        {filtered.map(nb => (
          <div key={nb.id} className="rp-card">
            <div className="rp-card-content">
              <h3 className="rp-card-title">{nb.title}</h3>
              <p className="rp-card-desc">{nb.desc || <em>No description</em>}</p>
              <p className="rp-card-meta">Last edited: {nb.lastEdited}</p>
              <div className="rp-tags">
                {nb.tags.map(t => <span key={t} className="rp-tag">{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </Masonry>
    </>
  );
}

// --- Strategies View ---
const initialStrategies = [
  {
    id: 1,
    name: 'Mean Reversion',
    desc: 'Buy dips, sell spikes around moving average.',
    parameters: ['Window: 20', 'Threshold: 1.5σ']
  },
  {
    id: 2,
    name: 'Momentum Breakout',
    desc: 'Enter when price breaks X-day high.',
    parameters: ['Lookback: 14d', 'ATR Multiplier: 2']
  },
  // …add more
];

function StrategiesView() {
  const mediumCols = { default: 2, 768: 1 };
  return (
    <Masonry
      className="rp-masonry-grid"
      columnClassName="rp-masonry-column"
      breakpointCols={mediumCols}
    >
      {initialStrategies.map(s => (
        <div key={s.id} className="rp-card">
          <div className="rp-card-content">
            <h3 className="rp-card-title">{s.name}</h3>
            <p className="rp-card-desc">{s.desc}</p>
            <ul className="rp-list">
              {s.parameters.map((p,i) => <li key={i}>{p}</li>)}
            </ul>
            <button className="rp-btn">Run / Edit</button>
          </div>
        </div>
      ))}
    </Masonry>
  );
}

// --- Backtesting View ---
function BacktestingView() {
  const [form, setForm]     = useState({ strategy: '', from: '2025-01-01', to: '2025-07-10' });
  const [results, setResults] = useState([]);
  const handleRun = e => {
    e.preventDefault();
    if (!form.strategy) return;
    setResults([{
      id: 1,
      name: form.strategy,
      pnl: '+8.42%',
      period: `${form.from} → ${form.to}`
    }]);
  };

  return (
    <form className="rp-form" onSubmit={handleRun}>
      <div className="rp-form-group">
        <label>Strategy</label>
        <select
          value={form.strategy}
          onChange={e => setForm({ ...form, strategy: e.target.value })}
        >
          <option value="">Select…</option>
          {initialStrategies.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="rp-form-group">
        <label>From</label>
        <input
          type="date"
          value={form.from}
          onChange={e => setForm({ ...form, from: e.target.value })}
        />
      </div>
      <div className="rp-form-group">
        <label>To</label>
        <input
          type="date"
          value={form.to}
          onChange={e => setForm({ ...form, to: e.target.value })}
        />
      </div>
      <button type="submit" className="rp-btn">Run Backtest</button>

      {results.length > 0 && (
        <table className="rp-table">
          <thead>
            <tr><th>Strategy</th><th>PnL</th><th>Period</th></tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.pnl}</td>
                <td>{r.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}

// --- Model Lab View ---
function ModelLabView() {
  const [file, setFile]   = useState(null);
  const [status, setStatus] = useState('idle');

  const handleUpload = e => {
    setFile(e.target.files[0]);
    setStatus('ready');
  };
  const handleTrain = e => {
    e.preventDefault();
    if (!file) return;
    setStatus('training');
    setTimeout(() => setStatus('completed'), 2000);
  };

  return (
    <form className="rp-form" onSubmit={handleTrain}>
      <div className="rp-form-group">
        <label>Upload Model (.py)</label>
        <input type="file" accept=".py" onChange={handleUpload} />
      </div>
      <button
        type="submit"
        className="rp-btn"
        disabled={!file || status === 'training'}
      >
        Train Model
      </button>
      {status === 'training' && <p className="rp-status">Training in progress…</p>}
      {status === 'completed' && <p className="rp-status">Training complete!</p>}
    </form>
  );
}

// --- Data Lab View ---
function DataLabView() {
  const [file, setFile]     = useState(null);
  const [preview, setPreview] = useState([]);

  const handleUpload = e => {
    const f = e.target.files[0];
    setFile(f);
    // stub a small preview
    setPreview([{ ColumnA: 'Row1', ColumnB: 'Value1' }]);
  };

  return (
    <div>
      <div className="rp-form-group">
        <label>Upload Dataset (CSV)</label>
        <input type="file" accept=".csv" onChange={handleUpload} />
      </div>
      {preview.length > 0 && (
        <table className="rp-table">
          <thead>
            <tr>
              {Object.keys(preview[0]).map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.map((row,i) => (
              <tr key={i}>
                {Object.values(row).map((v,j) => <td key={j}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
