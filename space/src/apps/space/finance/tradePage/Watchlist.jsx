import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes, faEdit, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Chart } from "react-chartjs-2";

// sparkline demo data generator
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

export default function Watchlist({ watchlist, setWatchlist, active, setActive }) {
  const [newSym, setNewSym] = useState("");
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
    <>
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
    </>
  );
}
