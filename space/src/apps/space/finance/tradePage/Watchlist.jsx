// src/components/Watchlist.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import './watchlist.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes, faEdit, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

import {
  fetchWatchlists,
  createWatchlist,
  updateWatchlist,
} from "../../../../services/trade";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  annotationPlugin
);

// sparkline demo data generator (unchanged)
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
  const prevClose = series[0];
  const last = series[series.length - 1];
  const up = last >= prevClose;
  const changePct = (((last - prevClose) / prevClose) * 100).toFixed(2);

  const data = {
    labels,
    datasets: [
      {
        label: "price",
        data: series.map((v, i) => ({ x: labels[i], y: v })),
        borderColor: up ? "#00FF8C" : "#FF6B6B",
        backgroundColor: "transparent",
        pointRadius: 0,
        borderWidth: 1,
        tension: 0.3,
      },
    ],
  };

  return { data, up, changePct, prevClose };
}

function Sparkline({ data, options }) {
  return <Chart type="line" data={data} options={options} />;
}

function WatchlistItem({ sym, active, isEditing, onSelect, onRemove }) {
  const { data, up, changePct, prevClose } = useMemo(
    () => generateSparkData(),
    [sym]
  );

  const sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: false } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      annotation: {
        annotations: {
          prevCloseLine: {
            type: "line",
            scaleID: "y",
            value: prevClose,
            borderColor: "rgba(136,136,136,0.6)",
            borderDash: [2, 2],
            borderWidth: 0.5,
          },
        },
      },
    },
    elements: {
      line: { borderWidth: 1, tension: 0.3, capBezierPoints: true },
      point: { radius: 0 },
    },
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

export default function Watchlist({ active, setActive }) {
  const queryClient = useQueryClient();

  // 1) load all watchlists
  const { data: watchlists = [] } = useQuery({
    queryKey: ["watchlists"],
    queryFn: fetchWatchlists,
  });

  // 2) mutations
  const createMutation = useMutation({
    mutationFn: createWatchlist,
    onSuccess: (newWL) => {
      // invalidate so the list refetches
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      // set this newly created list as current
      setCurrent({
        id: newWL.id,
        name: newWL.name,
        symbols: newWL.items.map(i => i.symbol),
      });
      setActive(newWL.items[0]?.symbol || "");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateWatchlist,
    onSuccess: (upd) => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      setCurrent({
        id: upd.id,
        name: upd.name,
        symbols: upd.items.map(i => i.symbol),
      });
    },
  });

  // local “current” state
  const [current, setCurrent] = useState({
    id: null,
    name: "My Watchlist",
    symbols: [],
  });
  const [newSym, setNewSym] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 3) when watchlists load, pick first
  useEffect(() => {
    if (watchlists.length > 0) {
      const wl = watchlists[0];
      setCurrent({
        id: wl.id,
        name: wl.name,
        symbols: wl.items.map(i => i.symbol),
      });
      setActive(wl.items[0]?.symbol || "");
    }
  }, [watchlists, setActive]);

  // helper to persist create vs update
  const persist = (wl) => {
    const payload = { name: wl.name, symbols: wl.symbols };
    if (wl.id) {
      updateMutation.mutate({ id: wl.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // add symbol
  const addSymbol = () => {
    const s = newSym.trim().toUpperCase();
    if (s && !current.symbols.includes(s)) {
      const next = { ...current, symbols: [s, ...current.symbols] };
      setCurrent(next);
      persist(next);
      setActive(s);
    }
    setNewSym("");
  };

  // remove symbol
  const removeSymbol = (sym) => {
    const nextSymbols = current.symbols.filter(x => x !== sym);
    const next = { ...current, symbols: nextSymbols };
    setCurrent(next);
    persist(next);
    if (active === sym) setActive(nextSymbols[0] || "");
  };

  // save renamed list
  const saveName = () => {
    setIsEditing(false);
    persist(current);
  };

  return (
    <>
      <div className="tp-watchlist-header">
        {isEditing ? (
          <input
            className="tp-wl-name-input"
            value={current.name}
            onChange={e => setCurrent({ ...current, name: e.target.value })}
            onBlur={saveName}
            onKeyDown={e => e.key === "Enter" && saveName()}
          />
        ) : (
          <h4 className="tp-wl-name">{current.name}</h4>
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
        {current.symbols.map(sym => (
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
