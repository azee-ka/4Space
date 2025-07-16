// TradePage.jsx
import React, { useState, useMemo, useEffect } from "react";
import "chartjs-adapter-date-fns";      // date adapter for time scale
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog, faUser, faPlus, faTimes,
  faComments, faExchangeAlt, faLayerGroup,
  faNewspaper, faSmile, faTable, faListAlt, faClock
} from "@fortawesome/free-solid-svg-icons";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, TimeScale,
  PointElement, LineElement, BarElement,
  Tooltip, Legend
} from "chart.js";
import {
  CandlestickController, CandlestickElement,
  OhlcController, OhlcElement
} from "chartjs-chart-financial";
import "./tradePage.css";

// crosshair plugin for vertical hover line
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw: chart => {
    const { ctx, tooltip, chartArea: { top, bottom } } = chart;
    if (tooltip.getActiveElements().length) {
      const [{ element }] = tooltip.getActiveElements();
      const x = element.x;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#888";
      ctx.stroke();
      ctx.restore();
    }
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
  Tooltip,
  Legend,
  crosshairPlugin
);

// number of sample points for each timeframe
const TIMEFRAMES = {
  "1H":  60,
  "1D":  390,
  "1W":  390,
  "1M":  30,
  "3M":  90,
  "6M":  180,
  "YTD": null,
  "1Y":  365,
  "2Y":  730,
  "5Y":  1825,
  "10Y": 3650,
  "MAX": 120
};
// user-configurable, in DAYS (supports fractional for sub-day):
const TF_CONFIG = {
  "1H":  { spanDays: 1/24,   resolutionDays: 1/1440 },  // 1 min
  "1D":  { spanDays: 1,      resolutionDays: 1/480 },   // ~3 min
  "1W":  { spanDays: 7,      resolutionDays: 30/1440 },  // 30 min
  "1M":  { spanDays: 30,     resolutionDays: 0.5 },       // daily
  "3M":  { spanDays: 90,     resolutionDays: 1 },
  "6M":  { spanDays: 180,    resolutionDays: 1 },
  "YTD": { spanDays: null,   resolutionDays: 1 },       // computed
  "1Y":  { spanDays: 365,    resolutionDays: 1 },
  "2Y":  { spanDays: 730,    resolutionDays: 5 },
  "5Y":  { spanDays: 1825,   resolutionDays: 30 },
  "10Y": { spanDays: 3650,   resolutionDays: 90 },
  "MAX": { spanDays: 3650*2, resolutionDays: 365 }
};

// convert days → { unit, stepSize } for Chart.js time scale
function getTickConfig(resDays) {
  const totalMinutes = resDays * 24 * 60;
  if (totalMinutes < 60) {
    return { unit: "minute", stepSize: Math.max(1, Math.round(totalMinutes)) };
  } else if (totalMinutes < 24 * 60) {
    return { unit: "hour", stepSize: Math.max(1, Math.round(totalMinutes / 60)) };
  } else if (totalMinutes < 30 * 24 * 60) {
    return { unit: "day", stepSize: Math.max(1, Math.round(totalMinutes / (24 * 60))) };
  } else if (totalMinutes < 365 * 24 * 60) {
    return { unit: "month", stepSize: Math.max(1, Math.round(totalMinutes / (30 * 24 * 60))) };
  } else {
    return { unit: "year", stepSize: Math.max(1, Math.round(totalMinutes / (365 * 24 * 60))) };
  }
}

// limit tick labels so they never overcrowd
const MAX_TICKS = {
  "1H":  8,  "1D":  8,  "1W":  7,
  "1M": 10,  "3M": 10,  "6M": 10,
  "YTD":10,  "1Y": 12,  "2Y": 12,
  "5Y": 12,  "10Y":12,  "MAX":12
};

const MOCK_NEWS = [
  { title: "Tech Stocks Rally Amid Earnings Beat", url: "#" },
  { title: "Fed Holds Rates Steady",             url: "#" },
  { title: "New IPOs This Week",                 url: "#" },
  { title: "Energy Sector Sees Interest",        url: "#" }
];

const COMPANY_NAMES = {
  AAPL: "Apple Inc.",
  TSLA: "Tesla, Inc.",
  MSFT: "Microsoft Corporation",
  GOOG: "Alphabet Inc.",
  AMZN: "Amazon.com, Inc."
};

export default function TradePage() {
  const [watchlist, setWatchlist] = useState(["AAPL","TSLA","MSFT"]);
  const [newSym, setNewSym]       = useState("");
  const [active, setActive]       = useState(watchlist[0]);

  const addSymbol = () => {
    const s = newSym.trim().toUpperCase();
    if (s && !watchlist.includes(s)) {
      setWatchlist([s, ...watchlist]);
      setActive(s);
    }
    setNewSym("");
  };
  const removeSymbol = s => {
    const next = watchlist.filter(x => x!==s);
    setWatchlist(next);
    if (s===active) setActive(next[0]||"");
  };

  return (
    <div className="tp-container">
      <Header/>
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
        <MainContent symbol={active}/>
        <TradeSidebar symbol={active}/>
      </div>
    </div>
  );
}

function Header(){
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

function Sidebar({ watchlist, newSym, onNewSym, onAdd, onRemove, active, onSelect }){
  const [msgs, setMsgs] = useState([{ role:'bot', text:'Hi! Ask for trade ideas.' }]);
  const [inTxt, setInTxt] = useState("");

  const send = () => {
    if (!inTxt) return;
    setMsgs([
      ...msgs,
      { role:'user', text: inTxt },
      { role:'bot',  text: `🤖 Idea for "${inTxt}"` }
    ]);
    setInTxt("");
  };

  return (
    <aside className="tp-sidebar">
      <div className="tp-search">
        <input
          placeholder="Add symbol"
          value={newSym}
          onChange={e => onNewSym(e.target.value)}
          onKeyDown={e => e.key==='Enter' && onAdd()}
        />
        <button onClick={onAdd}><FontAwesomeIcon icon={faPlus}/></button>
      </div>
      <ul className="tp-watchlist">
        {watchlist.map(s => (
          <li
            key={s}
            className={s===active ? 'tp-active' : ''}
            onClick={() => onSelect(s)}
          >
            {s}
            <span onClick={e => { e.stopPropagation(); onRemove(s); }}>
              <FontAwesomeIcon icon={faTimes}/>
            </span>
          </li>
        ))}
      </ul>
      <div className="tp-chat">
        <h4><FontAwesomeIcon icon={faComments}/> TradeBot</h4>
        <div className="tp-chat-window">
          {msgs.map((m,i) => <div key={i} className={m.role}>{m.text}</div>)}
        </div>
        <div className="tp-chat-input">
          <input
            placeholder="Ask..."
            value={inTxt}
            onChange={e => setInTxt(e.target.value)}
            onKeyDown={e => e.key==='Enter' && send()}
          />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </aside>
  );
}

function MainContent({ symbol }){
  return (
    <main className="tp-main">
      <ChartSection symbol={symbol}/>
      <div className="tp-info-grid">
        <MetricsPanel symbol={symbol}/>
        <FundamentalsPanel symbol={symbol}/>
        <SentimentPanel symbol={symbol}/>
        <HeatmapPanel/>
      </div>
    </main>
  );
}

export function ChartSection({ symbol }) {
  const [tf, setTf]     = useState("1D");
  const [type, setType] = useState("line");

  const { data, price, tickConfig } = useMemo(() => {
    const cfg = TF_CONFIG[tf];
    const now = Date.now();

    // compute start timestamp
    let spanDays = cfg.spanDays;
    if (tf === "YTD") {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
      spanDays = (now - yearStart)/(1000*60*60*24);
    }
    const start = now - spanDays * 24*60*60*1000;
    const pts   = Math.max(2, Math.round(spanDays / cfg.resolutionDays));

    // build labels evenly spaced
    const labels = Array.from({length: pts}, (_,i) =>
      new Date(start + (now - start)*i/(pts-1))
    );

    // synthetic price series
    const series = [];
    labels.forEach((_,i) => {
      if (i===0) series.push(100 + Math.random()*50);
      else {
        const p = series[i-1];
        series.push(parseFloat((p*(1+(Math.random()-0.5)*0.01)).toFixed(2)));
      }
    });
    const lastPrice = series.at(-1).toFixed(2);

    // assemble dataset
    let datasets;
    if (type==="line") {
      datasets = [{ 
        label: symbol,
        data: labels.map((t,i)=>({x:t,y:series[i]})),
        borderColor:"#00FFA8",
        backgroundColor:"transparent",
        pointRadius:0, pointHoverRadius:4,
        borderWidth:2, tension:0
      }];
    } else {
      const ohlc = series.map((v,i)=>{
        const o=v, c=v+(Math.random()*4-2),
              h=Math.max(o,c)+Math.random()*2,
              l=Math.min(o,c)-Math.random()*2;
        return {x:labels[i],o,h,l,c};
      });
      datasets=[{
        label:symbol,data:ohlc,
        color:{up:"#00FF8C",down:"#FF6B6B",unchanged:"#00FFA8"},
        barThickness:"flex",maxBarThickness:12
      }];
    }

    return {
      data: { datasets },
      price: lastPrice,
      tickConfig: getTickConfig(cfg.resolutionDays)
    };
  }, [tf, type, symbol]);

  const maxTicks = MAX_TICKS[tf] || 10;

  const options = {
    maintainAspectRatio: false,
    animation: { duration:800, easing:"easeOutQuart" },
    animations: { x:{duration:0}, y:{duration:800} },
    plugins: {
      crosshair:{},
      legend:{ display:false },
      tooltip:{
        enabled:true, mode:"nearest", intersect:false,
        callbacks:{
          label:ctx=>{
            if(type==="candlestick"){
              const {o,h,l,c}=ctx.parsed;
              return [`Open: $${o}`, `High: $${h}`, `Low: $${l}`, `Close: $${c}`];
            }
            return `${symbol}: $${ctx.parsed.y}`;
          }
        }
      }
    },
    scales:{
      x:{
        type:"time",
        time: tickConfig,
        ticks:{
          autoSkip:true,
          maxTicksLimit: maxTicks,
          color:"#999999"
        },
        grid:{ color:"#444444" }
      },
      y:{
        ticks:{ color:"#999999" },
        grid:{ color:"#444444" }
      }
    },
    interaction:{ mode:"nearest", axis:"x", intersect:false }
  };

  return (
    <section className="tp-chart-section tp-panel">
      <div className="tp-chart-section-header">
        <div className="tp-chart-section-sub-header">
          <div>
            <div className="tp-symbol-header">{symbol}</div>
            <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
          </div>
          <span className="tp-price">${price}</span>
        </div>
        <div className="tp-chart-controls">
          <div className="tp-timeframe">
            {Object.keys(TIMEFRAMES).map(k => (
              <button
                key={k}
                className={tf===k ? "tp-active" : ""}
                onClick={() => setTf(k)}
              >{k}</button>
            ))}
          </div>
          <div className="tp-chart-type-buttons">
            {["line","candlestick"].map(t => (
              <button
                key={t}
                className={`tp-chart-type-btn${type===t ? " tp-active" : ""}`}
                onClick={() => setType(t)}
              >{t==="line"?"Line":"Candle"}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="tp-chart-body">
        <Chart
          key={`${symbol}-${tf}-${type}`}
          type={type}
          data={data}
          options={options}
        />
      </div>
    </section>
  );
}


function MetricsPanel({ symbol }){
  const price  = (100+Math.random()*50).toFixed(2);
  const volume = Math.floor(1e5+Math.random()*9e5).toLocaleString();
  const change = ((Math.random()*2-1).toFixed(2))+"%";
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faLayerGroup}/> Metrics — {symbol}</h5>
      <div className="tp-metrics">
        <div><span>Price</span><span className="tp-metric-value">${price}</span></div>
        <div><span>Volume</span><span className="tp-metric-value">{volume}</span></div>
        <div><span>Change</span><span className={`tp-metric-value ${change.startsWith('-')?'tp-down':'tp-up'}`}>{change}</span></div>
      </div>
    </div>
  );
}

function FundamentalsPanel({ symbol }){
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faTable}/> Fundamentals — {symbol}</h5>
      <table className="tp-fundamentals"><tbody>
        <tr><td>PE Ratio</td><td>25.4</td></tr>
        <tr><td>Yield</td><td>1.2%</td></tr>
        <tr><td>Market Cap</td><td>$1.5T</td></tr>
      </tbody></table>
    </div>
  );
}

function SentimentPanel({ symbol }){
  const [score, setScore] = useState(0);
  useEffect(() => {
    setScore(Math.floor(Math.random()*100 - 50));
  }, [symbol]);
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

function HeatmapPanel(){
  const sectors = ['Tech','Finance','Energy','Health','Retail','Auto'];
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faLayerGroup}/> Sector Heatmap</h5>
      <div className="tp-heatmap">
        {sectors.map((s,i) => (
          <div
            key={s}
            className="tp-heat-cell"
            style={{ background: `hsl(${i*60},70%,${50+Math.random()*20}%)` }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeSidebar({ symbol }){
  return (
    <aside className="tp-trade-aside">
      <OrderPanel symbol={symbol}/>
      <NewsPanel/>
      <PositionsPanel/>
      <OrdersHistoryPanel/>
      <Level2Panel/>
      <TimeAndSalesPanel/>
    </aside>
  );
}

export function OrderPanel({ symbol }){
  const [type, setType]   = useState("Market");
  const [qty, setQty]     = useState("");
  const [limit, setLimit] = useState("");
  const setPct = p => setQty(Math.floor((50000 * p) / 100));
  const submit = e => {
    e.preventDefault();
    alert(`${type} ${qty} ${symbol}@${type==="Limit"?limit:"MKT"}`);
  };
  return (
    <div className="tp-panel tp-order-panel">
      <h5><FontAwesomeIcon icon={faExchangeAlt}/> Order Entry — {symbol}</h5>
      <form onSubmit={submit}>
        <div className="tp-order-types">
          {["Market","Limit","Stop"].map(o => (
            <button
              key={o}
              type="button"
              className={type===o ? "tp-active" : ""}
              onClick={() => setType(o)}
            >{o}</button>
          ))}
        </div>
        <input
          className="tp-order-input"
          type="number"
          placeholder="Qty"
          value={qty}
          onChange={e => setQty(e.target.value)}
        />
        {type==="Limit" && (
          <input
            className="tp-order-input"
            type="number"
            placeholder="Limit Price"
            value={limit}
            onChange={e => setLimit(e.target.value)}
          />
        )}
        <div className="tp-quick-presets">
          {[10,25,50].map(p => (
            <button key={p} type="button" onClick={() => setPct(p)}>{p}%</button>
          ))}
        </div>
        <button className="tp-submit-btn" type="submit" disabled={!qty}>
          {type} Order
        </button>
      </form>
    </div>
  );
}

function NewsPanel(){
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faNewspaper}/> News</h5>
      <ul className="tp-news-list">
        {MOCK_NEWS.map((a,i) => (
          <li key={i}><a href={a.url}>{a.title}</a></li>
        ))}
      </ul>
    </div>
  );
}

function PositionsPanel(){
  const [pos] = useState([
    { symbol:'AAPL', qty:10, avg:150.23 },
    { symbol:'TSLA', qty:5,  avg:650.50 }
  ]);
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faListAlt}/> Positions</h5>
      <ul className="tp-list">
        {pos.map(p => (
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

function OrdersHistoryPanel(){
  const [trades] = useState(['AAPL 5 @155.00','TSLA 2 @670.00']);
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faClock}/> Recent Trades</h5>
      <ul className="tp-list">
        {trades.map((t,i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function Level2Panel(){
  const book = Array.from({length:5},(_,i) => ({
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
          {book.map((o,i) => (
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

function TimeAndSalesPanel(){
  const lines = Array.from({length:5},(_,i) =>
    `${new Date(Date.now() - i*60000).toLocaleTimeString()} • ${(100 + Math.random()*50).toFixed(2)}`
  );
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faClock}/> Time & Sales</h5>
      <ul className="tp-list">
        {lines.map((l,i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}
