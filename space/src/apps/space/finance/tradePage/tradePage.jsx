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
  faCheck
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
  Legend
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
} from "chartjs-chart-financial";
import "./tradePage.css";

// ─── crosshair plugin ─────────────────────────────────────────────────────────
const crosshairPlugin = {
  id: "crosshair",
  afterDraw: chart => {
    const x = chart.$hoverX;
    if (typeof x === "number") {
      const {
        ctx,
        chartArea: { top, bottom }
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

// ─── centralized timeframe & tick config ────────────────────────────────────
const TF_CONFIG = {
  "1D": { spanDays: 1, resolutionMinutes: 3 },
  "1W": {
    spanDays: 7,
    resolutionMinutes: 30,
    tickUnit: "day",
    tickStep: 1,
    displayFormats: { day: "MMM d" }
  },
  "1M": {
    spanDays: 30,
    resolutionMinutes: 720,
    tickUnit: "week",
    tickStep: 1,
    displayFormats: { week: "MMM d" }
  },
  "3M": { spanDays: 90, resolutionMinutes: 1440 },
  "6M": { spanDays: 180, resolutionMinutes: 1440 },
  YTD: { spanDays: null, resolutionMinutes: 1440 },
  "1Y": { spanDays: 365, resolutionMinutes: 1440 },
  "2Y": { spanDays: 730, resolutionMinutes: 7200 },
  "5Y": { spanDays: 1825, resolutionMinutes: 43200 },
  "10Y": { spanDays: 3650, resolutionMinutes: 129600 },
  MAX: { spanDays: 3650 * 2, resolutionMinutes: 525600 }
};

const MAX_TICKS = {
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
  MAX: 12
};

function getScaleConfig(cfg, tf) {
  let unit, step;
  if (cfg.tickUnit) {
    unit = cfg.tickUnit;
    step = cfg.tickStep;
  } else {
    const m = cfg.resolutionMinutes;
    if (m < 60) {
      unit = "minute";
      step = Math.round(m);
    } else if (m < 1440) {
      unit = "hour";
      step = Math.round(m / 60);
    } else if (m < 43200) {
      unit = "day";
      step = Math.round(m / 1440);
    } else if (m < 525600) {
      unit = "month";
      step = Math.round(m / 43200);
    } else {
      unit = "year";
      step = Math.round(m / 525600);
    }
  }

  const defaultFormats = {
    minute: "h:mm a",
    hour: "MMM d h a",
    day: "MMM d",
    week: "MMM d",
    month: "MMM yyyy",
    year: "yyyy"
  };
  const fmt =
    cfg.displayFormats && cfg.displayFormats[unit]
      ? cfg.displayFormats[unit]
      : defaultFormats[unit];

  return {
    time: {
      unit,
      stepSize: step,
      displayFormats: { [unit]: fmt }
    },
    ticks: {
      source: tf === "1D" ? "auto" : "data",
      autoSkip: true,
      maxTicksLimit: MAX_TICKS[tf],
      color: "#999999"
    }
  };
}

// ─── TradePage & all components ──────────────────────────────────────────────
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

  const removeSymbol = s => {
    const next = watchlist.filter(x => x !== s);
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
                onChange={e => setWlName(e.target.value)}
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
              onChange={e => setNewSym(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSymbol()}
            />
            <button className="tp-add-btn" onClick={addSymbol}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <ul className="tp-watchlist">
            {watchlist.map(sym => (
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
  const [msgs, setMsgs] = useState([{ role: "bot", text: "Hi! Ask for trade ideas." }]);
  const [inTxt, setInTxt] = useState("");
  const send = () => {
    if (!inTxt) return;
    setMsgs([
      ...msgs,
      { role: "user", text: inTxt },
      { role: "bot", text: `🤖 Idea for "${inTxt}"` }
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
          onChange={e => setInTxt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
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

function WatchlistItem({ sym, active, isEditing, onSelect, onRemove }) {
  const { data, up, changePct } = useMemo(() => generateSparkData(), [sym]);
  const sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: false } },
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  };
  const isActive = sym === active;
  const activeClass = isActive
    ? up
      ? "tp-active asset-up"
      : "tp-active asset-down"
    : "";
  return (
    <li className={`tp-watchlist-item ${activeClass}`} onClick={() => onSelect(sym)}>
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
          onClick={e => { e.stopPropagation(); onRemove(sym); }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </span>
      )}
    </li>
  );
}

function Sparkline({ data, options }) {
  return <Chart type="line" data={data} options={options} />;
}

export function ChartSection({ symbol }) {
  const chartRef = useRef(null);

  // 1️⃣ Core state
  const [tf, setTf] = useState("1D");
  const [type, setType] = useState("line");
  const [hoverInfo, setHoverInfo] = useState({ x: null, time: "", price: "" });

  // 2️⃣ Buckets + live price
  const [labels, setLabels] = useState([]);     // array of Date()
  const [series, setSeries] = useState([]);     // array of numbers|null
  const [currentPrice, setCurrentPrice] = useState(100);

  // Build 5-minute buckets when TF = 1D
  useEffect(() => {
    if (tf !== "1D") {
      setLabels([]);
      setSeries([]);
      return;
    }
    const today   = new Date();
    const openMs  = new Date(today.getFullYear(), today.getMonth(), today.getDate(),  9, 30).getTime();
    const closeMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16,   0).getTime();
    const bucketMs = 5 * 60 * 1000;
    const cnt      = Math.floor((closeMs - openMs) / bucketMs) + 1;

    // full array of Date from 9:30 → 16:00
    const newLabels = Array.from({ length: cnt }, (_, i) =>
      new Date(openMs + i * bucketMs)
    );
    setLabels(newLabels);

    // seed past buckets with simulated data, future stay null
    let v = 100 + Math.random() * 50;
    const init = newLabels.map(ts =>
      ts.getTime() <= Date.now()
        ? (v = parseFloat((v * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)))
        : null
    );
    setSeries(init);
    setCurrentPrice(init.filter(x => x != null).slice(-1)[0] ?? 100);
  }, [tf]);

  // Every 5s: generate a new live price, and if a bucket's time has passed, fill it
  useEffect(() => {
    if (tf !== "1D" || labels.length === 0) return;
    const iv = setInterval(() => {
      setCurrentPrice(prev =>
        parseFloat((prev * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
      );
      setSeries(prev => {
        const next = [...prev];
        const now = Date.now();
        const idx = labels.findIndex((dt, i) => next[i] == null && dt.getTime() <= now);
        if (idx >= 0) next[idx] = currentPrice;
        return next;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [tf, labels, currentPrice]);

  // 3️⃣ Build data + derive lastPrice, openTime, closeTime
  const { data, lastPrice, openTime, closeTime } = useMemo(() => {
    let openTime = null, closeTime = null;
    if (tf === "1D" && labels.length) {
      openTime  = labels[0].getTime();
      closeTime = labels[labels.length - 1].getTime();
    }

    const cfg = TF_CONFIG[tf];
    const { time: scaleTime, ticks: scaleTicks } = getScaleConfig(cfg, tf);

    let datasets = [];
    let firstVal, lastVal, color = "#00FF8C";

    if (tf === "1D" && labels.length) {
      const pts = labels
        .map((t, i) => ({ x: t, y: series[i] }))
        .filter(pt => pt.y != null);

      firstVal = pts[0]?.y;
      lastVal  = pts[pts.length - 1]?.y;
      color    = lastVal >= firstVal ? "#00FF8C" : "#FF6B6B";

      const liveX = Math.min(Date.now(), closeTime);
      pts.push({ x: new Date(liveX), y: currentPrice });
      // add null at close to force full span to 16:00
      pts.push({ x: new Date(closeTime), y: null });

      datasets = [{
        label: symbol,
        data: pts,
        spanGaps: true,
        borderColor: color,
        pointRadius: ctx => (ctx.dataIndex === pts.length - 2 ? 6 : 0),
        pointHoverRadius: 4,
        borderWidth: 2,
        tension: 0
      }];
    } else {
      // … your existing multi-day logic …
    }

    const lastPrice = tf === "1D" ? currentPrice : (lastVal ?? currentPrice);
    return {
      data: { datasets },
      lastPrice: lastPrice.toFixed(2),
      openTime,
      closeTime
    };
  }, [tf, symbol, labels, series, currentPrice]);

  // formatter for hover
  const fmt = date => format(date, "MMM d, h:mm a");

  // 4️⃣ Chart options
  const { time: scaleTime, ticks: scaleTicks } = getScaleConfig(TF_CONFIG[tf], tf);

  const options = {
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false }, crosshair: {} },
    interaction: { mode: "nearest", axis: "x", intersect: false },

    onHover: (evt, elements) => {
      const chart = chartRef.current;
      if (!chart) return;
      const rect = chart.canvas.getBoundingClientRect();
      let x = evt.native.clientX - rect.left;
      const { left, right } = chart.chartArea;
      x = Math.min(Math.max(x, left), right);
      const maxX = chart.scales.x.getPixelForValue(Date.now());
      x = Math.min(x, maxX);
      chart.$hoverX = x;

      if (elements.length) {
        const pt = data.datasets[0].data[elements[0].index];
        setHoverInfo({ x, time: fmt(pt.x), price: `$${pt.y.toFixed(2)}` });
      } else {
        setHoverInfo({ x: null, time: "", price: "" });
      }
    },
    onLeave: () => {
      const chart = chartRef.current;
      if (chart) chart.$hoverX = null;
      setHoverInfo({ x: null, time: "", price: "" });
    },

    scales: {
      x: {
        type: "time",
        time: scaleTime,
        // clamp to full market hours only for 1D
        ...(tf === "1D" && { min: openTime, max: closeTime, bounds: "ticks" }),
        ticks: scaleTicks,
        grid: { color: "#444444" }
      },
      y: { ticks: { color: "#999999" }, grid: { color: "#444444" } }
    }
  };

  return (
    <section className="tp-chart-section tp-panel">
      <div className="tp-chart-section-header">
        <div className="tp-chart-section-sub-header">
          <div>
            <div className="tp-symbol-header">{symbol}</div>
            <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
          </div>
          <span className="tp-price">{hoverInfo.price || `$${lastPrice}`}</span>
        </div>
        <div className="tp-chart-controls">
          <div className="tp-timeframe">
            {Object.keys(TF_CONFIG).map(key => (
              <button
                key={key}
                className={tf === key ? "tp-active" : ""}
                onClick={() => setTf(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="tp-chart-type-buttons">
            {["line", "candlestick"].map(t => (
              <button
                key={t}
                className={`tp-chart-type-btn${type === t ? " tp-active" : ""}`}
                onClick={() => setType(t)}
              >
                {t === "line" ? "Line" : "Candle"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="tp-chart-body"
        onMouseLeave={() => setHoverInfo({ x: null, time: "", price: "" })}
      >
        {hoverInfo.time && (
          <div className="tp-hover-info" style={{ left: hoverInfo.x }}>
            {hoverInfo.time}
          </div>
        )}
        <Chart ref={chartRef} type={type} data={data} options={options} />
      </div>
    </section>
  );
}

function MetricsPanel({ symbol }) {
  const price = (100 + Math.random() * 50).toFixed(2);
  const volume = Math.floor(1e5 + Math.random() * 9e5).toLocaleString();
  const change = (Math.random() * 2 - 1).toFixed(2) + "%";
  return (
    <div className="tp-panel">
      <h5><FontAwesomeIcon icon={faLayerGroup} /> Metrics — {symbol}</h5>
      <div className="tp-metrics">
        <div><span>Price</span><span className="tp-metric-value">${price}</span></div>
        <div><span>Volume</span><span className="tp-metric-value">{volume}</span></div>
        <div>
          <span>Change</span>
          <span className={`tp-metric-value ${change.startsWith("-") ? "tp-down" : "tp-up"}`}>{change}</span>
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
          <tr><td>PE Ratio</td><td>25.4</td></tr>
          <tr><td>Yield</td><td>1.2%</td></tr>
          <tr><td>Market Cap</td><td>$1.5T</td></tr>
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
        {score >= 0 ? "+" : ""}{score}%
      </div>
      <meter
        className="tp-sentiment-meter"
        min="-100" max="100" low="0" high="0" optimum="100"
        value={score}
      />
    </div>
  );
}