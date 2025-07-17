// TradePage.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faUser,
  faPlus,
  faTimes,
  faComments,
  faExchangeAlt,
  faLayerGroup,
  faNewspaper,
  faSmile,
  faTable,
  faListAlt,
  faClock,
  faEdit,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
} from "chartjs-chart-financial";
import "./tradePage.css";
import ChartSection from "./ChartSection";

// crosshair plugin
const crosshairPlugin = {
  id: "crosshair",
  afterDraw: (chart) => {
    const x = chart.options.plugins.crosshair?.hoverX;
    if (typeof x === "number") {
      const {
        ctx,
        chartArea: { top, bottom },
      } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#888";
      ctx.stroke();
      ctx.restore();
    }
  },
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

// timeframes & config
const TIMEFRAMES = {
  "1H": 60,
  "1D": 390,
  "1W": 390,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  YTD: null,
  "1Y": 365,
  "2Y": 730,
  "5Y": 1825,
  "10Y": 3650,
  MAX: 120,
};
const TF_CONFIG = {
  "1H": { spanDays: 1 / 24, resolutionDays: 1 / 4 / 1440 },
  "1D": { spanDays: 1, resolutionDays: 3 / 1440 },
  "1W": {
    spanDays: 7,
    resolutionDays: 30 / 1440,
    tickUnit: "day",
    tickStep: 1,
    displayFormats: { day: "MMM d" },
  },
  "1M": {
    spanDays: 30,
    resolutionDays: 0.5,
    tickUnit: "week",
    tickStep: 1,
    displayFormats: { week: "MMM d" },
  },
  "3M": { spanDays: 90, resolutionDays: 1 },
  "6M": { spanDays: 180, resolutionDays: 1 },
  YTD: { spanDays: null, resolutionDays: 1 },
  "1Y": { spanDays: 365, resolutionDays: 1 },
  "2Y": { spanDays: 730, resolutionDays: 5 },
  "5Y": { spanDays: 1825, resolutionDays: 30 },
  "10Y": { spanDays: 3650, resolutionDays: 90 },
  MAX: { spanDays: 3650 * 2, resolutionDays: 365 },
};
function getTickConfig(resDays) {
  const m = resDays * 24 * 60;
  if (m < 60) return { unit: "minute", stepSize: Math.max(1, Math.round(m)) };
  if (m < 1440)
    return { unit: "hour", stepSize: Math.max(1, Math.round(m / 60)) };
  if (m < 43200)
    return { unit: "day", stepSize: Math.max(1, Math.round(m / 1440)) };
  if (m < 525600)
    return { unit: "month", stepSize: Math.max(1, Math.round(m / 43200)) };
  return { unit: "year", stepSize: Math.max(1, Math.round(m / 525600)) };
}
const MAX_TICKS = {
  "1H": 8,
  "1D": 8,
  "1W": 7,
  "1M": 10,
  "3M": 10,
  "6M": 10,
  YTD: 10,
  "1Y": 12,
  "2Y": 12,
  "5Y": 12,
  "10Y": 12,
  MAX: 12,
};
const COMPANY_NAMES = {
  AAPL: "Apple Inc.",
  TSLA: "Tesla, Inc.",
  MSFT: "Microsoft Corporation",
  GOOG: "Alphabet Inc.",
  AMZN: "Amazon.com, Inc.",
};

// default date-fns format tokens
const DEFAULT_TOKENS = {
  minute: "h:mm a",
  hour: "MMM d h a",
  day: "MMM d",
  week: "MMM d",
  month: "MMM yyyy",
  year: "yyyy",
};

// sparkline demo data
function generateSparkData() {
  const pts = 50;
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;
  const labels = Array.from(
    { length: pts },
    (_, i) => new Date(start + ((now - start) * i) / (pts - 1))
  );
  const series = [];
  for (let i = 0; i < pts; i++) {
    if (i === 0) series.push(100 + Math.random() * 50);
    else {
      const p = series[i - 1];
      series.push(
        parseFloat((p * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
      );
    }
  }
  const first = series[0];
  const last = series[pts - 1];
  const up = last >= first;
  const changePct = (((last - first) / first) * 100).toFixed(2);
  const data = {
    datasets: [
      {
        data: series.map((v, i) => ({ x: labels[i], y: v })),
        borderColor: up ? "#00FF8C" : "#FF6B6B",
        backgroundColor: "transparent",
        pointRadius: 0,
        borderWidth: 1,
        tension: 0.3,
      },
    ],
  };
  return { data, up, changePct };
}

function Sparkline({ data, options }) {
  return <Chart type="line" data={data} options={options} />;
}

function WatchlistItem({ sym, active, isEditing, onSelect, onRemove }) {
  const { data, up, changePct } = useMemo(() => generateSparkData(), [sym]);
  const sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: false } },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };
  const isActive = sym === active;
  const activeClass = isActive
    ? up
      ? "tp-active asset-up"
      : "tp-active asset-down"
    : "";
  return (
    <li
      className={`tp-watchlist-item ${activeClass}`}
      onClick={() => onSelect(sym)}
    >
      <span className="tp-watchlist-symbol">{sym}</span>
      <div className="tp-sparkline-container">
        <div className="tp-sparkline">
          <Sparkline data={data} options={sparkOptions} />
        </div>
        <span className={`tp-chip ${up ? "tp-chip-up" : "tp-chip-down"}`}>
          {up ? "+" : ""}
          {changePct}%
        </span>
      </div>
      {isEditing && (
        <span
          className="tp-remove-icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(sym);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </span>
      )}
    </li>
  );
}

export default function TradePage() {
  const [watchlist, setWatchlist] = useState(["AAPL", "TSLA", "MSFT"]);
  const [newSym, setNewSym] = useState("");
  const [active, setActive] = useState(watchlist[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [wlName, setWlName] = useState("My Watchlist");

  const addSymbol = () => {
    const s = newSym.trim().toUpperCase();
    if (s && !watchlist.includes(s)) {
      setWatchlist([s, ...watchlist]);
      setActive(s);
    }
    setNewSym("");
  };
  const removeSymbol = (s) => {
    const next = watchlist.filter((x) => x !== s);
    setWatchlist(next);
    if (s === active) setActive(next[0] || "");
  };

  return (
    <div className="tp-container">
      <Header />
      <div className="tp-body">
        <aside className="tp-sidebar">
          <div className="tp-watchlist-header">
            {isEditing ? (
              <input
                className="tp-wl-name-input"
                value={wlName}
                onChange={(e) => setWlName(e.target.value)}
              />
            ) : (
              <h4 className="tp-wl-name">{wlName}</h4>
            )}
            <button
              className={`tp-edit-btn ${isEditing ? "tp-up" : "tp-accent"}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              <FontAwesomeIcon icon={isEditing ? faCheck : faEdit} />
            </button>
          </div>
          <div className="tp-search">
            <input
              placeholder="Add symbol"
              value={newSym}
              onChange={(e) => setNewSym(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSymbol()}
            />
            <button className="tp-add-btn" onClick={addSymbol}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <ul className="tp-watchlist">
            {watchlist.map((sym) => (
              <WatchlistItem
                key={sym}
                sym={sym}
                active={active}
                isEditing={isEditing}
                onSelect={setActive}
                onRemove={removeSymbol}
              />
            ))}
          </ul>
          <ChatBot />
        </aside>
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
        <div>
          Total Value<span>$1,234,567</span>
        </div>
        <div>
          Buying Power<span>$50,000</span>
        </div>
      </div>
      <div className="tp-actions">
        <button>
          <FontAwesomeIcon icon={faCog} />
        </button>
        <button>
          <FontAwesomeIcon icon={faUser} />
        </button>
      </div>
    </header>
  );
}

function ChatBot() {
  const [msgs, setMsgs] = useState([
    { role: "bot", text: "Hi! Ask for trade ideas." },
  ]);
  const [inTxt, setInTxt] = useState("");
  const send = () => {
    if (!inTxt) return;
    setMsgs([
      ...msgs,
      { role: "user", text: inTxt },
      { role: "bot", text: `🤖 Idea for "${inTxt}"` },
    ]);
    setInTxt("");
  };
  return (
    <div className="tp-chat">
      <h4>
        <FontAwesomeIcon icon={faComments} /> TradeBot
      </h4>
      <div className="tp-chat-window">
        {msgs.map((m, i) => (
          <div key={i} className={m.role}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="tp-chat-input">
        <input
          placeholder="Ask..."
          value={inTxt}
          onChange={(e) => setInTxt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
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

// function ChartSection({ symbol }) {
//   const chartRef = useRef(null);
//   const [tf, setTf] = useState("1D");
//   const [type, setType] = useState("line");
//   const [hover, setHover] = useState({ x: null, time: "", price: null });

//   // live price every 3s (only 1D)
//   const [livePrice, setLivePrice] = useState(null);
//   useEffect(() => {
//     if (tf === "1D") {
//       setLivePrice((p) => p ?? parseFloat(dataRef.current.price ?? 100));
//       const id = setInterval(() => {
//         setLivePrice((p) => {
//           const base = p ?? 100;
//           return parseFloat(
//             (base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)
//           );
//         });
//       }, 3000);
//       return () => clearInterval(id);
//     }
//   }, [tf, symbol]);

//   // full chart rebuild every 5m (only 1D)
//   const [tick, setTick] = useState(0);
//   useEffect(() => {
//     if (tf === "1D") {
//       const id = setInterval(() => setTick((t) => t + 1), 5 * 60 * 1000);
//       return () => clearInterval(id);
//     }
//   }, [tf, symbol]);

//   // generate data
//   const dataRef = useRef({});
//   const { data, price, openTime, closeTime, timeScale, tickScale } =
//     useMemo(() => {
//       const cfg = TF_CONFIG[tf];
//       const now = Date.now();
//       let labels = [],
//         series = [],
//         openTime = null,
//         closeTime = null;

//       if (tf === "1D") {
//         const d = new Date();
//         openTime = new Date(
//           d.getFullYear(),
//           d.getMonth(),
//           d.getDate(),
//           9,
//           30
//         ).getTime();
//         closeTime = new Date(
//           d.getFullYear(),
//           d.getMonth(),
//           d.getDate(),
//           16,
//           0
//         ).getTime();
//         const step = 5 * 60 * 1000,
//           count = Math.floor((closeTime - openTime) / step) + 1;
//         labels = Array.from(
//           { length: count },
//           (_, i) => new Date(openTime + i * step)
//         );
//         let v = 100 + Math.random() * 50;
//         series = labels.map((ts) =>
//           ts.getTime() <= now
//             ? (v = parseFloat(
//                 (v * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)
//               ))
//             : null
//         );
//       } else {
//         const span =
//           tf === "YTD"
//             ? (now - new Date(new Date().getFullYear(), 0, 1).getTime()) /
//               86400000
//             : cfg.spanDays;
//         const start = now - span * 86400000,
//           pts = Math.max(2, Math.round(span / cfg.resolutionDays));
//         labels = Array.from(
//           { length: pts },
//           (_, i) => new Date(start + ((now - start) * i) / (pts - 1))
//         );
//         for (let i = 0; i < labels.length; i++) {
//           if (i === 0) series.push(100 + Math.random() * 50);
//           else {
//             const p = series[i - 1];
//             series.push(
//               parseFloat((p * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
//             );
//           }
//         }
//       }

//       const clean = series.filter((v) => v != null),
//         first = clean[0] || 0,
//         last = clean[clean.length - 1] || first;
//       const up = last >= first,
//         color = up ? "#00FF8C" : "#FF6B6B";

//       let datasets;
//       if (type === "line") {
//         const pts = labels
//           .map((t, i) => ({ x: t, y: series[i] }))
//           .filter((p) => p.y != null);
//         if (tf === "1D") {
//           pts.push({ x: new Date(Math.min(now, closeTime)), y: last });
//         }
//         datasets = [
//           {
//             label: symbol,
//             data: pts,
//             spanGaps: true,
//             borderColor: color,
//             backgroundColor: "transparent",
//             pointRadius: (ctx) =>
//               ctx.dataIndex === pts.length - 1 && tf === "1D" ? 6 : 0,
//             borderWidth: 2,
//             tension: 0,
//           },
//         ];
//       } else {
//         const ohlc = labels.map((t, i) => {
//           const o = series[i] || last;
//           const c = o * (1 + (Math.random() - 0.5) * 0.02);
//           return {
//             x: t,
//             o,
//             h: Math.max(o, c) * (1 + Math.random() * 0.01),
//             l: Math.min(o, c) * (1 - Math.random() * 0.01),
//             c,
//           };
//         });
//         datasets = [
//           {
//             label: symbol,
//             data: ohlc,
//             color: { up: "#00FF8C", down: "#FF6B6B", unchanged: "#00FF8C" },
//             barThickness: "flex",
//             maxBarThickness: 12,
//           },
//         ];
//       }

//       const base = getTickConfig(cfg.resolutionDays);
//       const unit = cfg.tickUnit || base.unit,
//         stepSize = cfg.tickStep || base.stepSize;
//       const fmt =
//         (cfg.displayFormats && cfg.displayFormats[unit]) ||
//         DEFAULT_TOKENS[unit];
//       const timeScale = { unit, stepSize, displayFormats: { [unit]: fmt } };
//       const tickScale = {
//         source: tf === "1D" ? "auto" : "data",
//         autoSkip: true,
//         maxTicksLimit: MAX_TICKS[tf],
//         color: "#999999",
//       };

//       dataRef.current.price = last.toFixed(2);
//       return {
//         data: { datasets },
//         price: last.toFixed(2),
//         openTime,
//         closeTime,
//         timeScale,
//         tickScale,
//       };
//     }, [tf, type, symbol, tick]);

//   // patch last point every 3s
//   useEffect(() => {
//     const chart = chartRef.current;
//     if (chart && tf === "1D" && chart.data.datasets[0].data.length) {
//       const ds = chart.data.datasets[0].data,
//         i = ds.length - 1;
//       ds[i] = { x: new Date(), y: livePrice };
//       chart.update("none");
//     }
//   }, [livePrice, tf, type, symbol]);

//   const fmtHover = (dt) => format(dt, "MMM d, h:mm a");

//   const options = {
//     maintainAspectRatio: false,
//     animation: false,
//     plugins: {
//       crosshair: {
//         hoverX: null,
//       },
//       legend: { display: false },
//       tooltip: { enabled: false },
//     },
//     interaction: { mode: "nearest", axis: "x", intersect: false },
//     scales: {
//       x: {
//         type: "time",
//         time: timeScale,
//         ticks: tickScale,
//         grid: { color: "#444444" },
//         ...(tf === "1D"
//           ? { min: openTime, max: closeTime, bounds: "ticks" }
//           : {}),
//       },
//       y: { ticks: { color: "#999999" }, grid: { color: "#444444" } },
//     },
//     onHover: (e, items) => {
//       const chart = chartRef.current;
//       if (!chart) return;

//       if (items.length) {
//         const idx = items[0].index;
//         const pt = data.datasets[0].data[idx];
//         const xPix = chart.scales.x.getPixelForValue(pt.x);

//         chart.options.plugins.crosshair.hoverX = xPix;
//         setHover({ x: xPix, time: fmtHover(pt.x), price: pt.y.toFixed(2) });
//         chart.update(); // force redraw to show crosshair
//       } else {
//         chart.options.plugins.crosshair.hoverX = null;
//         setHover({ x: null, time: "", price: null });
//         chart.update();
//       }
//     },
//     onLeave: () => {
//       const chart = chartRef.current;
//       if (chart) {
//         chart.options.plugins.crosshair.hoverX = null;
//         chart.update(); // important to fully redraw and remove the crosshair
//       }
//       setHover({ x: null, time: "", price: null });
//     },
//   };

//   return (
//     <section className="tp-chart-section tp-panel">
//       <div className="tp-chart-section-header">
//         <div className="tp-chart-section-sub-header">
//           <div>
//             <div className="tp-symbol-header">{symbol}</div>
//             <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
//           </div>
//           <span className="tp-price">
//             $
//             {hover.price != null
//               ? hover.price
//               : tf === "1D" && livePrice != null
//               ? livePrice.toFixed(2)
//               : price}
//           </span>
//         </div>
//         <div className="tp-chart-controls">
//           <div className="tp-timeframe">
//             {Object.keys(TIMEFRAMES)
//               .filter((k) => "1H" !== k)
//               .map((k) => (
//                 <button
//                   key={k}
//                   className={tf === k ? "tp-active" : ""}
//                   onClick={() => setTf(k)}
//                 >
//                   {k}
//                 </button>
//               ))}
//           </div>
//           <div className="tp-chart-type-buttons">
//             {["line", "candlestick"].map((t) => (
//               <button
//                 key={t}
//                 className={`tp-chart-type-btn${type === t ? " tp-active" : ""}`}
//                 onClick={() => setType(t)}
//               >
//                 {t === "line" ? "Line" : "Candle"}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//       <div
//         className="tp-chart-body"
//         onMouseLeave={() => {
//           const chart = chartRef.current;
//           if (chart) {
//             chart.options.plugins.crosshair.hoverX = null;
//             chart.update();
//           }
//           setHover({ x: null, time: "", price: null });
//         }}
//       >
//         {hover.x != null && hover.time && (
//           <div className="tp-hover-info" style={{ left: hover.x }}>
//             {hover.time}
//           </div>
//         )}
//         <Chart ref={chartRef} type={type} data={data} options={options} />
//       </div>
//     </section>
//   );
// }

function MetricsPanel({ symbol }) {
  const price = (100 + Math.random() * 50).toFixed(2);
  const volume = Math.floor(1e5 + Math.random() * 9e5).toLocaleString();
  const change = (Math.random() * 2 - 1).toFixed(2) + "%";
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faLayerGroup} /> Metrics — {symbol}
      </h5>
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
          <span
            className={`tp-metric-value ${
              change.startsWith("-") ? "tp-down" : "tp-up"
            }`}
          >
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
      <h5>
        <FontAwesomeIcon icon={faTable} /> Fundamentals — {symbol}
      </h5>
      <table className="tp-fundamentals">
        <tbody>
          <tr>
            <td>PE Ratio</td>
            <td>25.4</td>
          </tr>
          <tr>
            <td>Yield</td>
            <td>1.2%</td>
          </tr>
          <tr>
            <td>Market Cap</td>
            <td>$1.5T</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SentimentPanel({ symbol }) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    setScore(Math.floor(Math.random() * 100 - 50));
  }, [symbol]);
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faSmile} /> Sentiment — {symbol}
      </h5>
      <div className={`tp-sentiment-label ${score >= 0 ? "tp-up" : "tp-down"}`}>
        {score >= 0 ? "+" : ""}
        {score}%
      </div>
      <meter
        className="tp-sentiment-meter"
        min="-100"
        max="100"
        low="0"
        high="0"
        optimum="100"
        value={score}
      />
    </div>
  );
}

function HeatmapPanel() {
  const sectors = ["Tech", "Finance", "Energy", "Health", "Retail", "Auto"];
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faLayerGroup} /> Sector Heatmap
      </h5>
      <div className="tp-heatmap">
        {sectors.map((s, i) => (
          <div
            key={s}
            className="tp-heat-cell"
            style={{
              background: `hsl(${i * 60},70%,${50 + Math.random() * 20}%)`,
            }}
          >
            {s}
          </div>
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
  const [type, setType] = useState("Market");
  const [qty, setQty] = useState("");
  const [limit, setLimit] = useState("");
  const setPct = (p) => setQty(Math.floor((50000 * p) / 100));
  const submit = (e) => {
    e.preventDefault();
    alert(`${type} ${qty} ${symbol}@${type === "Limit" ? limit : "MKT"}`);
  };
  return (
    <div className="tp-panel tp-order-panel">
      <h5>
        <FontAwesomeIcon icon={faExchangeAlt} /> Order Entry — {symbol}
      </h5>
      <form onSubmit={submit}>
        <div className="tp-order-types">
          {["Market", "Limit", "Stop"].map((o) => (
            <button
              key={o}
              type="button"
              className={type === o ? "tp-active" : ""}
              onClick={() => setType(o)}
            >
              {o}
            </button>
          ))}
        </div>
        <input
          className="tp-order-input"
          type="number"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        {type === "Limit" && (
          <input
            className="tp-order-input"
            type="number"
            placeholder="Limit Price"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        )}
        <div className="tp-quick-presets">
          {[10, 25, 50].map((p) => (
            <button key={p} type="button" onClick={() => setPct(p)}>
              {p}%
            </button>
          ))}
        </div>
        <button className="tp-submit-btn" type="submit" disabled={!qty}>
          {type} Order
        </button>
      </form>
    </div>
  );
}

function NewsPanel() {
  const MOCK_NEWS = [
    { title: "Tech Stocks Rally Amid Earnings Beat", url: "#" },
    { title: "Fed Holds Rates Steady", url: "#" },
    { title: "New IPOs This Week", url: "#" },
    { title: "Energy Sector Sees Interest", url: "#" },
  ];
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faNewspaper} /> News
      </h5>
      <ul className="tp-news-list">
        {MOCK_NEWS.map((a, i) => (
          <li key={i}>
            <a href={a.url}>{a.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PositionsPanel() {
  const [pos] = useState([
    { symbol: "AAPL", qty: 10, avg: 150.23 },
    { symbol: "TSLA", qty: 5, avg: 650.5 },
  ]);
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faListAlt} /> Positions
      </h5>
      <ul className="tp-list">
        {pos.map((p) => (
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
  const [trades] = useState(["AAPL 5 @155.00", "TSLA 2 @670.00"]);
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faClock} /> Recent Trades
      </h5>
      <ul className="tp-list">
        {trades.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Level2Panel() {
  const book = Array.from({ length: 5 }, (_, i) => ({
    bid: (100 - (i + 1) * 0.2).toFixed(2),
    ask: (100 + (i + 1) * 0.2).toFixed(2),
    size: Math.floor(100 + Math.random() * 900),
  }));
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faLayerGroup} /> Level-2
      </h5>
      <table className="tp-book">
        <thead>
          <tr>
            <th>Bid</th>
            <th>Size</th>
            <th>Size</th>
            <th>Ask</th>
          </tr>
        </thead>
        <tbody>
          {book.map((o, i) => (
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
  const lines = Array.from(
    { length: 5 },
    (_, i) =>
      `${new Date(Date.now() - i * 60000).toLocaleTimeString()} • ${(
        100 +
        Math.random() * 50
      ).toFixed(2)}`
  );
  return (
    <div className="tp-panel">
      <h5>
        <FontAwesomeIcon icon={faClock} /> Time & Sales
      </h5>
      <ul className="tp-list">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
