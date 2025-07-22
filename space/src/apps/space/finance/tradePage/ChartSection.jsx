// src/components/ChartSection.jsx
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import "./chartSection.css";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";
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
import annotationPlugin from "chartjs-plugin-annotation";
import { Chart } from "react-chartjs-2";
import crosshairPlugin from "./utils/crosshairPlugin";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { TIMEFRAMES, COMPANY_NAMES } from "./utils/chartConfig";
import { generateChartData } from "./utils/generateChartData";
import { fetchChartData } from "../../../../services/trade";

// live-dot plugin (unchanged)…
const liveDotPlugin = {
  id: "liveDot",
  beforeInit: (chart) => {
    chart.__pulseStart = performance.now();
  },
  afterDraw: (chart) => {
    if (!chart.ctx) return;
    const cfg = chart.config.options.plugins.liveDot;
    if (!cfg?.enabled || cfg.value == null) return;
    const meta = chart.getDatasetMeta(0);
    const pts = meta.data;
    if (!pts.length) return;
    const { x, y } = pts[pts.length - 1];
    const innerColor = cfg.colorHex;
    const rgb = cfg.colorRgb;
    const now = performance.now();
    const cycle = cfg.cycle ?? 3000;
    const glowLen = cfg.glowLen ?? 300;
    const elapsed = (now - chart.__pulseStart) % cycle;

    if (elapsed <= glowLen) {
      const t = elapsed / glowLen;
      const innerR = 6;
      const outerR = innerR + 4 * t;
      const ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, outerR, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${rgb},${1 - t})`;
      ctx.fill();
      ctx.restore();
    }

    const ctx2 = chart.ctx;
    ctx2.save();
    ctx2.beginPath();
    ctx2.arc(x, y, 6, 0, 2 * Math.PI);
    ctx2.fillStyle = innerColor;
    ctx2.fill();
    ctx2.restore();
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
  Tooltip,
  Legend,
  crosshairPlugin,
  annotationPlugin,
  liveDotPlugin
);

export default function ChartSection({ symbol }) {
  const chartRef = useRef(null);
  const prevCloseRef = useRef(null);

  // ─── CORE STATE ─────────────────────────────────────────────
  const [tf, setTf] = useState("1D");
  const [type, setType] = useState("line");
  const [hover, setHover] = useState({ x: null, time: "", price: null });
  const [livePrice, setLivePrice] = useState(null);
  const [tick, setTick] = useState(0);
  const dataRef = useRef({});
  const [priceAnchor, setPriceAnchor] = useState(null);

  // selection
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd] = useState(null);
  const [dragging, setDragging] = useState(false);

  // ─── 1D “LIVE” JITTER & TICK ────────────────────────────────
  useEffect(() => {
    if (tf !== "1D") return;
    const seed = parseFloat(dataRef.current.price ?? 100);
    setLivePrice((p) => (typeof p === "number" ? p : seed));
    const id1 = setInterval(() => {
      setLivePrice((p) => {
        const prev = typeof p === "number" ? p : seed;
        return parseFloat(
          ((prev) * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)
        );
      });
    }, 3000);
    const id2 = setInterval(() => setTick((t) => t + 1), 300000);
    return () => {
      clearInterval(id1);
      clearInterval(id2);
    };
  }, [tf, symbol]);

  // ─── FAKE-DATA FOR 1D ───────────────────────────────────────
  const {
    data: fakeData,
    price: fakePrice,
    openTime: fakeOpen,
    closeTime: fakeClose,
    timeScale: fakeTS,
    tickScale: fakeTick,
  } = useMemo(() => {
    const r = generateChartData(tf, type, symbol, tick);
    dataRef.current.price = r.price;
    return r;
  }, [tf, type, symbol, tick]);

  useEffect(() => {
    if (tf === "1D") setLivePrice(parseFloat(fakePrice));
  }, [tick, tf, fakePrice]);

  // ─── HISTORICAL DATA VIA REACT-QUERY ────────────────────────
  const { data: histData = [], isLoading, isError } = useQuery({
    queryKey: ["chartData", symbol, tf],
    queryFn: () => fetchChartData(symbol, tf),
    enabled: tf !== "1D",
  });

  // ─── BASE DATA SELECTION ────────────────────────────────────
  const baseData =
    tf === "1D"
      ? fakeData
      : {
          datasets: [
            {
              label: symbol,
              data: histData,
              spanGaps: true,
              borderWidth: 2,
              tension: 0.3,
              backgroundColor: "transparent",
            },
          ],
        };

  // derive staticPrice
  const lastReal = histData.slice(-1)[0]?.y;
  const staticPrice =
    tf === "1D" ? fakePrice : lastReal?.toFixed(2) ?? fakePrice;

  // open/close, scales for 1D
  const openTime = tf === "1D" ? fakeOpen : undefined;
  const closeTime = tf === "1D" ? fakeClose : undefined;
  const xTimeScale = tf === "1D" ? fakeTS : {};
  const xTickScale = tf === "1D" ? fakeTick : {};

  // ─── PRICE-ANCHOR PADDING FOR 1D ───────────────────────────
  const bufferPct = 0.05;
  useEffect(() => {
    if (tf !== "1D" || livePrice == null) return;
    if (priceAnchor == null) setPriceAnchor(livePrice);
    else if (Math.abs((livePrice - priceAnchor) / priceAnchor) >= bufferPct) {
      setPriceAnchor(livePrice);
    }
  }, [livePrice, tf, priceAnchor]);

  // patch live dot into fakeData for 1D
  useEffect(() => {
    if (tf !== "1D") return;
    const chart = chartRef.current;
    const ds = chart?.data.datasets[0]?.data;
    if (!ds?.length) return;
    ds[ds.length - 1] = { x: new Date(), y: livePrice };
    chart.draw();
  }, [livePrice, tf]);

  const fmtHover = (dt) => format(dt, "MMM d, h:mm a");

  // compute yMin/yMax for 1D
  const { yMin, yMax } = useMemo(() => {
    const pts = baseData.datasets[0].data;
    if (tf === "1D" && pts.length) {
      const yVals = pts.map((p) => p.y ?? p.c).filter((v) => v != null);
      if (prevCloseRef.current == null) prevCloseRef.current = yVals[0];
      const prevClose = prevCloseRef.current;
      const anchor = priceAnchor ?? prevClose;
      const sMin = anchor * (1 - bufferPct);
      const sMax = anchor * (1 + bufferPct);
      return { yMin: Math.min(sMin, ...yVals), yMax: Math.max(sMax, ...yVals) };
    }
    return { yMin: null, yMax: null };
  }, [baseData, tf, priceAnchor]);

  // color logic
  const firstPt = baseData.datasets[0].data[0] || {};
  const openPrice = firstPt.y ?? firstPt.o ?? parseFloat(staticPrice);
  const currentPrice = tf === "1D" ? livePrice : parseFloat(staticPrice);
  const isUp = currentPrice >= openPrice;
  const upHex = "#00ffa8";
  const dnHex = "#f44";
  const colorHex = isUp ? upHex : dnHex;
  const colorRgb = isUp ? "0,255,168" : "244,68,68";

  // display price
  const displayPrice =
    hover.price != null
      ? hover.price
      : tf === "1D" && typeof livePrice === "number"
      ? livePrice.toFixed(2)
      : staticPrice;

  // nearest-point helper
  function nearestPoint(xPix) {
    const chart = chartRef.current;
    if (!chart) return null;
    const xVal = chart.scales.x.getValueForPixel(xPix);
    return baseData.datasets[0].data.reduce((best, p) => {
      const d = Math.abs(new Date(p.x).getTime() - xVal);
      return d < Math.abs(new Date(best.x).getTime()) ? p : best;
    }, baseData.datasets[0].data[0] || {});
  }

  // ─── HOVER HANDLER (useCallback) ───────────────────────────
  const handleHover = useCallback(
    (_e, items) => {
      const chart = chartRef.current;
      if (!chart) return;
      if (items.length) {
        const { datasetIndex, index } = items[0];
        const pt = chart.data.datasets[datasetIndex].data[index];
        const xPix = chart.scales.x.getPixelForValue(pt.x);
        const newTime = fmtHover(pt.x);
        const newPrice = (pt.y ?? pt.c).toFixed(2);

        setHover((prev) =>
          prev.x === xPix && prev.time === newTime && prev.price === newPrice
            ? prev
            : { x: xPix, time: newTime, price: newPrice }
        );

        chart.options.plugins.crosshair.hoverX = xPix;
        chart.draw();
      } else {
        setHover((prev) =>
          prev.x === null ? prev : { x: null, time: "", price: null }
        );
        chart.options.plugins.crosshair.hoverX = null;
        chart.draw();
      }
    },
    [fmtHover]
  );

  // ─── MAIN DATASET BUILDER ───────────────────────────────────
  const mainDataset = useMemo(() => {
    const src = baseData.datasets[0];
    if (type === "candlestick") return src;
    const startTS = selectStart?.xValue;
    const endTS = selectEnd?.xValue;
    const delta = (selectEnd?.price ?? 0) - (selectStart?.price ?? 0);
    return {
      ...src,
      borderColor: colorHex,
      pointRadius: 0,
      pointHoverRadius: 0,
      segment: {
        borderColor: (ctx) => {
          if (!ctx.p0?.parsed || !ctx.p1?.parsed) return colorHex;
          const x0 = ctx.p0.parsed.x;
          const x1 = ctx.p1.parsed.x;
          if (
            startTS != null &&
            endTS != null &&
            x0 >= startTS &&
            x1 <= endTS
          ) {
            return delta >= 0 ? "#0f0" : "#f44";
          }
          return colorHex;
        },
      },
      pointBackgroundColor: (ctx) => {
        if (!ctx.parsed || ctx.parsed.x == null) return colorHex;
        const x = new Date(ctx.parsed.x).getTime();
        if (
          startTS != null &&
          endTS != null &&
          x >= startTS &&
          x <= endTS
        ) {
          return delta >= 0 ? "#0f0" : "#f44";
        }
        return colorHex;
      },
      pointBorderColor: (ctx) => ctx.dataset.pointBackgroundColor(ctx),
    };
  }, [baseData, selectStart, selectEnd, type, colorHex]);

  // ─── ANNOTATIONS ──────────────────────────────────────────
  const annotations = {};
  if (tf === "1D" && prevCloseRef.current != null) {
    annotations.prevCloseLine = {
      type: "line",
      yMin: prevCloseRef.current,
      yMax: prevCloseRef.current,
      borderColor: "#888",
      borderDash: [4, 4],
      borderWidth: 1,
    };
  }
  if (selectStart) {
    annotations.startLine = {
      type: "line",
      xMin: selectStart.xValue,
      xMax: selectStart.xValue,
      borderColor: "#555",
      borderWidth: 1,
    };
  }
  if (selectStart && selectEnd) {
    const δ = selectEnd.price - selectStart.price;
    const pct = (δ / selectStart.price) * 100;
    annotations.endLine = {
      type: "line",
      xMin: selectEnd.xValue,
      xMax: selectEnd.xValue,
      borderColor: δ >= 0 ? "#0f0" : "#f44",
      borderWidth: 1,
    };
    annotations.changeLabel = {
      type: "label",
      xValue: selectEnd.xValue,
      yValue: selectEnd.price,
      backgroundColor: δ >= 0 ? "#0f0" : "#f44",
      content: [`${δ >= 0 ? "+" : ""}${δ.toFixed(2)} (${pct.toFixed(2)}%)`],
      position: "start",
      yAdjust: -10,
      font: { size: 12 },
    };
  }

  // ─── MEMOIZED OPTIONS ──────────────────────────────────────
  const options = useMemo(
    () => ({
      maintainAspectRatio: false,
      animation: { duration: 300, easing: "linear" },
      plugins: {
        crosshair: { hoverX: null },
        legend: { display: false },
        tooltip: { enabled: false },
        annotation: { annotations },
        liveDot: {
          enabled: tf === "1D",
          value: livePrice,
          cycle: 2500,
          glowLen: 600,
          colorHex,
          colorRgb,
        },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: {
          type: "time",
          time: xTimeScale,
          ticks: xTickScale,
          grid: { display: false },
          ...(tf === "1D" && { min: openTime, max: closeTime, bounds: "ticks" }),
        },
        y: {
          ticks: { color: "#999" },
          grid: { display: false },
          ...(tf === "1D" && { min: yMin, max: yMax }),
        },
      },
      onHover: handleHover,
      onLeave: (_e) => {
        const chart = chartRef.current;
        setHover((prev) =>
          prev.x === null ? prev : { x: null, time: "", price: null }
        );
        if (chart) {
          chart.options.plugins.crosshair.hoverX = null;
          chart.draw();
        }
      },
    }),
    [
      tf,
      livePrice,
      colorHex,
      colorRgb,
      annotations,
      xTimeScale,
      xTickScale,
      openTime,
      closeTime,
      yMin,
      yMax,
      handleHover,
    ]
  );

  // ─── MOUSE HANDLERS (unchanged) ────────────────────────────
  const onMouseDown = (e) => {
    const chart = chartRef.current;
    if (!chart) return;
    const rect = chart.canvas.getBoundingClientRect();
    const xPix = e.clientX - rect.left;
    if (selectStart && !dragging) {
      setSelectStart(null);
      setSelectEnd(null);
      chart.options.plugins.crosshair.hoverX = null;
      chart.draw();
      return;
    }
    const p = nearestPoint(xPix);
    if (!p) return;
    setSelectStart({
      xValue: new Date(p.x).getTime(),
      price: p.y ?? p.c,
      pixelX: xPix,
    });
    setSelectEnd(null);
    setDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    const chart = chartRef.current;
    const rect = chart.canvas.getBoundingClientRect();
    const xPix = e.clientX - rect.left;
    const p = nearestPoint(xPix);
    if (!p) return;
    setSelectEnd({
      xValue: new Date(p.x).getTime(),
      price: p.y ?? p.c,
      pixelX: xPix,
    });
  };
  const onMouseUp = () => {
    setDragging(false);
    setSelectStart(null);
    setSelectEnd(null);
    const chart = chartRef.current;
    if (chart) {
      chart.options.plugins.crosshair.hoverX = null;
      chart.draw();
    }
  };
  const onMouseLeave = () => {
    setDragging(false);
    setHover({ x: null, time: "", price: null });
    setSelectStart(null);
    setSelectEnd(null);
    const chart = chartRef.current;
    if (chart) {
      chart.options.plugins.crosshair.hoverX = null;
      chart.draw();
    }
  };

  return (
    <section className="tp-chart-section tp-panel">
      {/* Header & controls (unchanged) */}
      <div className="tp-chart-section-header">
        <div className="tp-chart-section-sub-header">
          <div>
            <div className="tp-symbol-header">{symbol}</div>
            <div className="tp-company-name">
              {COMPANY_NAMES[symbol]}
            </div>
          </div>
          <span className="tp-price">${displayPrice}</span>
        </div>
        <div className="tp-chart-controls">
          <div className="tp-timeframe">
            {Object.keys(TIMEFRAMES)
              .filter((k) => k !== "1H")
              .map((k) => (
                <button
                  key={k}
                  className={tf === k ? "tp-active" : ""}
                  onClick={() => {
                    setTf(k);
                    setPriceAnchor(null);
                    setSelectStart(null);
                    setSelectEnd(null);
                  }}
                >
                  {k}
                </button>
              ))}
          </div>
          <div className="tp-chart-type-buttons">
            {["line", "candlestick"].map((t) => (
              <button
                key={t}
                className={`tp-chart-type-btn${
                  type === t ? " tp-active" : ""
                }`}
                onClick={() => setType(t)}
              >
                {t === "line" ? "Line" : "Candle"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart body */}
      <div
        className="tp-chart-body"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* only render hover info when x is finite */}
        {hover.time && Number.isFinite(hover.x) && (
          <div
            className="tp-hover-info"
            style={{ left: hover.x }}
          >
            {hover.time}
          </div>
        )}

        {tf === "1D" ? (
          <Chart
            ref={chartRef}
            type={type}
            data={
              type === "candlestick" ? baseData : { datasets: [mainDataset] }
            }
            options={options}
          />
        ) : isLoading ? (
          <div className="tp-chart-loading">
            Loading historical data…
          </div>
        ) : isError ? (
          <div className="tp-chart-error">Error loading data</div>
        ) : (
          <Chart
            ref={chartRef}
            type={type}
            data={
              type === "candlestick" ? baseData : { datasets: [mainDataset] }
            }
            options={options}
          />
        )}
      </div>
    </section>
  );
}
