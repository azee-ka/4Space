// src/components/TradePage.jsx
import React, { useState, useMemo } from "react";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faUser,
  faLayerGroup,
  faSmile,
  faChartBar,
  faExchangeAlt,
  faNewspaper,
  faListAlt,
  faClock,
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
import "chartjs-plugin-annotation";

import Watchlist from "./Watchlist";
import ChatBot from "./ChatBot";
import ChartSection from "./ChartSection";
import "./tradePage.css";

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

export default function TradePage() {
  const [watchlist, setWatchlist] = useState(["AAPL", "TSLA", "MSFT"]);
  const [active, setActive] = useState(watchlist[0]);

  return (
    <div className="tp-container">
      <Header />
      <div className="tp-body">
        <aside className="tp-sidebar">
          <Watchlist
            watchlist={watchlist}
            setWatchlist={setWatchlist}
            active={active}
            setActive={setActive}
          />
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
          Total Value
          <span>$1,234,567</span>
        </div>
        <div>
          Buying Power
          <span>$50,000</span>
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

function MainContent({ symbol }) {
  return (
    <main className="tp-main">
      <ChartSection symbol={symbol} />

      <div className="tp-info-top">
        <CoreMetricsCard symbol={symbol} />
        <HeatmapPanel />
      </div>

      <div className="tp-info-bottom">
        <AnalystRatingCard symbol={symbol} />
        <SentimentAnalysisCard symbol={symbol} />
      </div>
    </main>
  );
}

function CoreMetricsCard({ symbol }) {
  const price = useMemo(() => (100 + Math.random() * 50).toFixed(2), [symbol]);
  const change = useMemo(() => (Math.random() * 2 - 1).toFixed(2), [symbol]);
  const [low, high] = useMemo(() => {
    const p = parseFloat(price);
    return [(p * 0.985).toFixed(2), (p * 1.015).toFixed(2)];
  }, [price]);
  const volume = useMemo(
    () => Math.floor(1e5 + Math.random() * 9e5).toLocaleString(),
    [symbol]
  );
  const peRatio = useMemo(() => (10 + Math.random() * 30).toFixed(1), [
    symbol,
  ]);
  const yieldPct = useMemo(() => (Math.random() * 5).toFixed(2) + "%", [
    symbol,
  ]);
  const marketCap = useMemo(
    () => `$${(50 + Math.random() * 150).toFixed(1)}B`,
    [symbol]
  );
  const week52Low = useMemo(() => (price * 0.7).toFixed(2), [price]);
  const week52High = useMemo(() => (price * 1.3).toFixed(2), [price]);

  const cells = [
    { label: "Price", value: `$${price}` },
    {
      label: "Change",
      value: `${change}%`,
      className: change < 0 ? "tp-down" : "tp-up",
    },
    { label: "Day Range", value: `$${low}–${high}` },
    { label: "Volume", value: volume },
    { label: "P/E Ratio", value: peRatio },
    { label: "Yield", value: yieldPct },
    { label: "Market Cap", value: marketCap },
    { label: "52W Range", value: `$${week52Low}–$${week52High}` },
  ];

  return (
    <div className="tp-panel tp-snapshot-card">
      <h5>
        <FontAwesomeIcon icon={faLayerGroup} /> {symbol} Snapshot
      </h5>
      <div className="tp-core-metrics">
        {cells.map((c) => (
          <div key={c.label}>
            <span>{c.label}</span>
            <span className={`tp-metric-value ${c.className || ""}`}>
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatmapPanel() {
  const sectors = ["Tech", "Finance", "Energy", "Health", "Retail", "Auto"];
  const data = sectors.map((s) => ({
    label: s,
    value: Number((Math.random() * 10 - 5).toFixed(1)),
  }));

  return (
    <div className="tp-panel tp-heatmap-card">
      <h5>
        <FontAwesomeIcon icon={faLayerGroup} /> Sector Performance
      </h5>
      <div className="tp-heatmap-list">
        {data.map((d) => (
          <div key={d.label} className="tp-rating-row">
            <span>{d.label}</span>
            <div className="tp-bar-bg">
              <div
                className={`tp-bar-fill ${d.value < 0 ? "tp-down" : "tp-up"}`}
                style={{ width: `${Math.abs(d.value)}%` }}
              />
            </div>
            <span>
              {d.value < 0 ? "" : "+"}
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalystRatingCard({ symbol }) {
  const buy = useMemo(() => 40 + Math.random() * 20, [symbol]);
  const hold = useMemo(() => 30 + Math.random() * 15, [symbol]);
  const sell = useMemo(() => 100 - buy - hold, [buy, hold]);

  return (
    <div className="tp-panel tp-rating-card">
      <h5>
        <FontAwesomeIcon icon={faChartBar} /> Analyst Ratings
      </h5>
      <div className="tp-rating-breakdown">
        {[
          { label: "Buy", pct: buy, color: "tp-up" },
          { label: "Hold", pct: hold, color: "tp-sub" },
          { label: "Sell", pct: sell, color: "tp-down" },
        ].map((r) => (
          <div key={r.label} className="tp-rating-row">
            <span>{r.label}</span>
            <div className="tp-bar-bg">
              <div
                className={`tp-bar-fill ${r.color}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span>{r.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentAnalysisCard({ symbol }) {
  const social = useMemo(() => Math.floor(Math.random() * 200 - 100), [
    symbol,
  ]);
  const insider = useMemo(() => (Math.random() * 10 - 5).toFixed(1), [
    symbol,
  ]);
  const newsSent = useMemo(() => Math.floor(Math.random() * 100), [symbol]);

  return (
    <div className="tp-panel tp-sentiment-card">
      <h5>
        <FontAwesomeIcon icon={faSmile} /> Sentiment Analysis
      </h5>
      <div className="tp-sentiment-detail">
        <div className="tp-sentiment-meter-row">
          <span>Overall</span>
          <meter
            min="-100"
            max="100"
            value={social}
            className={social < 0 ? "tp-down" : "tp-up"}
          />
          <span>{social}%</span>
        </div>
        <div>
          <span>News Mood</span>
          <span className="tp-metric-value">{newsSent}%</span>
        </div>
        <div>
          <span>Insider Net</span>
          <span
            className={`tp-metric-value ${insider < 0 ? "tp-down" : "tp-up"}`}
          >
            {insider}%
          </span>
        </div>
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

function OrderPanel({ symbol }) {
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
