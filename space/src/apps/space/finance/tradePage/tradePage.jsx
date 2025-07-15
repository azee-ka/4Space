// TradePage.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog, faUser, faPlus, faTimes,
  faChartLine, faComments,
  faExchangeAlt, faLayerGroup, faNewspaper,
  faSmile, faTable, faListAlt, faClock
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import './tradePage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const TIMEFRAMES = { '1H':25, '1D':50,'1W':100,'1M':150,'1Y':200,'2Y':250, '5Y':300  };
const MOCK_NEWS = [
  { title:'Tech Stocks Rally Amid Earnings Beat', url:'#' },
  { title:'Fed Holds Rates Steady',             url:'#' },
  { title:'New IPOs This Week',                  url:'#' },
  { title:'Energy Sector Sees Interest',         url:'#' }
];

const COMPANY_NAMES = {
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla, Inc.',
  MSFT: 'Microsoft Corporation',
  GOOG: 'Alphabet Inc.',
  AMZN: 'Amazon.com, Inc.'
};

export default function TradePage() {
  // LIFTED STATE
  const [watchlist, setWatchlist] = useState(['AAPL','TSLA','MSFT']);
  const [newSym,    setNewSym]    = useState('');
  const [active,    setActive]    = useState(watchlist[0]);

  // Sidebar handlers
  const addSymbol = () => {
    const s = newSym.trim().toUpperCase();
    if (s && !watchlist.includes(s)) {
      setWatchlist([s, ...watchlist]);
      setActive(s);
    }
    setNewSym('');
  };
  const removeSymbol = s => {
    const next = watchlist.filter(x => x !== s);
    setWatchlist(next);
    if (s === active) setActive(next[0] || '');
  };

  return (
    <div className="tp-container">
      <Header />
      <div className="tp-body">
        <Sidebar
          watchlist={watchlist}
          newSym={newSym}
          onNewSym={setNewSym}
          onAdd={addSymbol}
          onRemove={removeSymbol}
          active={active}
          onSelect={setActive}
        />
        <MainContent symbol={active} />
        <TradeSidebar symbol={active} />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="tp-header">
      <div className="tp-logo">4X Trading</div>
      <div className="tp-summary">
        <div>Total Value<span>$1,234,567</span></div>
        <div>Buying Power<span>$50,000</span></div>
      </div>
      <div className="tp-actions">
        <button><FontAwesomeIcon icon={faCog}/></button>
        <button><FontAwesomeIcon icon={faUser}/></button>
      </div>
    </header>
  );
}

function Sidebar({ watchlist, newSym, onNewSym, onAdd, onRemove, active, onSelect }) {
  const [msgs, setMsgs] = useState([{ role:'bot', text:'Hi! Ask for trade ideas.' }]);
  const [inTxt, setInTxt] = useState('');

  const send = () => {
    if (!inTxt) return;
    setMsgs([...msgs, { role:'user', text:inTxt }, { role:'bot', text:`🤖 Idea for "${inTxt}"`}]);
    setInTxt('');
  };

  return (
    <aside className="tp-sidebar">
      <div className="tp-search">
        <input
          placeholder="Add symbol"
          value={newSym}
          onChange={e=>onNewSym(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&onAdd()}
        />
        <button onClick={onAdd}><FontAwesomeIcon icon={faPlus}/></button>
      </div>
      <ul className="tp-watchlist">
        {watchlist.map(s => (
          <li
            key={s}
            className={s===active?'tp-active':''}
            onClick={()=>onSelect(s)}
          >
            {s}
            <span onClick={e=>{e.stopPropagation(); onRemove(s);}}>
              <FontAwesomeIcon icon={faTimes}/>
            </span>
          </li>
        ))}
      </ul>
      <div className="tp-chat">
        <h4><FontAwesomeIcon icon={faComments}/> TradeBot</h4>
        <div className="tp-chat-window">
          {msgs.map((m,i)=>
            <div key={i} className={m.role}>{m.text}</div>
          )}
        </div>
        <div className="tp-chat-input">
          <input
            placeholder="Ask..."
            value={inTxt}
            onChange={e=>setInTxt(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&send()}
          />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </aside>
  );
}

function MainContent({ symbol }) {
  return (
    <main className="tp-main">
      <ChartSection symbol={symbol} />
      <div className="tp-info-grid">
        <MetricsPanel symbol={symbol} />
        <FundamentalsPanel symbol={symbol} />
        <SentimentPanel symbol={symbol} />
        <HeatmapPanel />
      </div>
    </main>
  );
}

function ChartSection({ symbol }) {
  const [tf, setTf]         = useState('1D');
  const [chartData,setData] = useState({labels:[],datasets:[]});
  const [price,setPrice]    = useState(0);

  useEffect(() => {
    const pts = TIMEFRAMES[tf];
    const series = Array.from({ length: pts }, () => 100 + Math.random()*50);
    setData({
      labels: series.map((_,i)=>i),
      datasets:[{
        data: series,
        borderColor: series[pts-1]>=series[0]?'var(--tp-up)':'var(--tp-down)',
        tension:0.3,
        pointRadius:0
      }]
    });
    setPrice((100 + Math.random()*50).toFixed(2));
  }, [tf, symbol]);

  return (
    <section className="tp-chart-section tp-panel">
      <div className="tp-symbol-header">{symbol}</div>
      <div className="tp-company-name">
        {COMPANY_NAMES[symbol] || 'Unknown Company'}
      </div>
      <div className="tp-drag-handle">
        <FontAwesomeIcon icon={faChartLine}/> Live Chart
        <span className="tp-price">${price}</span>
      </div>
      <div className="tp-timeframe">
        {Object.keys(TIMEFRAMES).map(k=>(
          <button
            key={k}
            className={tf===k?'tp-active':''}
            onClick={()=>setTf(k)}
          >{k}</button>
        ))}
      </div>
      <Line
        data={chartData}
        options={{
          plugins:{legend:{display:false}},
          scales:{x:{display:false},y:{display:false}}
        }}
      />
    </section>
  );
}

function MetricsPanel({ symbol }) {
  const price      = (100 + Math.random()*50).toFixed(2);
  const volume     = Math.floor(1e5 + Math.random()*9e5).toLocaleString();
  const change     = ((Math.random()*2-1).toFixed(2)) + '%';

  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faLayerGroup}/> Metrics — {symbol}</h5>
      <div className="tp-metrics">
        <div>
          <span>Price</span>
          <span className="tp-metric-value">${price}</span>
        </div>
        <div>
          <span>Volume</span>
          <span className="tp-metric-value">{volume}</span>
        </div>
        <div>
          <span>Change</span>
          <span className={`tp-metric-value ${change.startsWith('-')?'tp-down':'tp-up'}`}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

function FundamentalsPanel({ symbol }) {
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faTable}/> Fundamentals — {symbol}</h5>
      <table className="tp-fundamentals">
        <tbody>
          <tr><td>PE Ratio</td><td>25.4</td></tr>
          <tr><td>Yield</td><td>1.2%</td></tr>
          <tr><td>Market Cap</td><td>$1.5T</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function SentimentPanel({ symbol }) {
  const [score,setScore] = useState(0);
  useEffect(()=>{ setScore(Math.floor(Math.random()*100-50)); },[symbol]);
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faSmile}/> Sentiment — {symbol}</h5>
      <div className={`tp-sentiment-label ${score>=0?'tp-up':'tp-down'}`}>
        {score>=0?'+':''}{score}%
      </div>
      <meter
        className="tp-sentiment-meter"
        min="-100" max="100" low="0" high="0" optimum="100"
        value={score}
      />
    </div>
  );
}

function HeatmapPanel() {
  const sectors=['Tech','Finance','Energy','Health','Retail','Auto'];
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faLayerGroup}/> Sector Heatmap</h5>
      <div className="tp-heatmap">
        {sectors.map((s,i)=>(
          <div
            key={s}
            className="tp-heat-cell"
            style={{ background:`hsl(${i*60},70%,${50+Math.random()*20}%)` }}
          >{s}</div>
        ))}
      </div>
    </div>
  );
}

function TradeSidebar({ symbol }) {
  return (
    <aside className="tp-trade-aside">
      <OrderPanel symbol={symbol} />
      <NewsPanel />
      <PositionsPanel />
      <OrdersHistoryPanel />
      <Level2Panel />
      <TimeAndSalesPanel />
    </aside>
  );
}

export function OrderPanel({ symbol }) {
  const [type, setType]     = useState('Market');
  const [qty, setQty]       = useState('');
  const [limit, setLimit]   = useState('');

  const setPct = p => setQty(Math.floor(50000 * p/100));
  const submit = e => {
    e.preventDefault();
    alert(`${type} ${qty} ${symbol}@${type==='Limit'?limit:'MKT'}`);
  };

  return (
    <div className="tp-panel tp-order-panel">
      <h5><FontAwesomeIcon icon={faExchangeAlt}/> Order Entry — {symbol}</h5>
      <form onSubmit={submit}>
        <div className="tp-order-types">
          {['Market','Limit','Stop'].map(o=>(
            <button
              key={o}
              type="button"
              className={type===o?'tp-active':''}
              onClick={()=>setType(o)}
            >{o}</button>
          ))}
        </div>
        <input
          className="tp-order-input"
          type="number"
          placeholder="Qty"
          value={qty}
          onChange={e=>setQty(e.target.value)}
        />
        {type==='Limit' && (
          <input
            className="tp-order-input"
            type="number"
            placeholder="Limit Price"
            value={limit}
            onChange={e=>setLimit(e.target.value)}
          />
        )}
        <div className="tp-quick-presets">
          {[10,25,50].map(p=>(
            <button key={p} type="button" onClick={()=>setPct(p)}>{p}%</button>
          ))}
        </div>
        <button
          className="tp-submit-btn"
          type="submit"
          disabled={!qty}
        >
          {type} Order
        </button>
      </form>
    </div>
  );
}

function NewsPanel() {
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faNewspaper}/> News</h5>
      <ul className="tp-news-list">
        {MOCK_NEWS.map((a,i)=>(
          <li key={i}><a href={a.url}>{a.title}</a></li>
        ))}
      </ul>
    </div>
  );
}

function PositionsPanel() {
  const [pos] = useState([
    { symbol:'AAPL', qty:10, avg:150.23 },
    { symbol:'TSLA', qty:5,  avg:650.50 }
  ]);
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faListAlt}/> Positions</h5>
      <ul className="tp-list">
        {pos.map(p=>(
          <li key={p.symbol}>
            <span>{p.symbol}</span>
            <span>{p.qty}</span>
            <span>${p.avg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrdersHistoryPanel() {
  const [trades] = useState(['AAPL 5 @155.00','TSLA 2 @670.00']);
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faClock}/> Recent Trades</h5>
      <ul className="tp-list">
        {trades.map((t,i)=><li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function Level2Panel() {
  const book = Array.from({length:5},(_,i)=>({
    bid:(100-(i+1)*0.2).toFixed(2),
    ask:(100+(i+1)*0.2).toFixed(2),
    size:Math.floor(100+Math.random()*900)
  }));
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faLayerGroup}/> Level-2</h5>
      <table className="tp-book">
        <thead><tr><th>Bid</th><th>Size</th><th>Size</th><th>Ask</th></tr></thead>
        <tbody>
          {book.map((o,i)=>(
            <tr key={i}>
              <td className="tp-down">{o.bid}</td>
              <td>{o.size}</td>
              <td>{o.size}</td>
              <td className="tp-up">{o.ask}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimeAndSalesPanel() {
  const lines = Array.from({length:5},(_,i)=>
    `${new Date(Date.now()-i*60000).toLocaleTimeString()} • ${(100+Math.random()*50).toFixed(2)}`
  );
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faClock}/> Time & Sales</h5>
      <ul className="tp-list">
        {lines.map((l,i)=><li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}
