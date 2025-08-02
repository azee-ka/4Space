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

// ─── Timeframe Axis Configuration ─────────────────────────
const TIMEFRAME_AXIS_CONFIG = {
  "1D": {
    bounds: "ticks",
    unit: "hour",
    displayFormats: { hour: "h a" },
    maxTicksLimit: 24,
  },
  "1W": {
    bounds: "data",
    unit: "day",
    displayFormats: { day: "MMM d" },
    maxTicksLimit: 7,
  },
  "1M": {
    bounds: "data",
    unit: "week",
    displayFormats: { week: "MMM d" },
    maxTicksLimit: 5,
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
  {
    id: "liveDot",
    beforeInit: (chart) => {
      chart.__pulseStart = performance.now();
    },
    afterDraw: (chart) => {
      const cfg = chart.config.options.plugins.liveDot;
      if (!chart.ctx || !cfg?.enabled || cfg.value == null) return;
      const pts = chart.getDatasetMeta(0).data;
      if (!pts.length) return;
      const { x, y } = pts[pts.length - 1];
      const { colorHex, colorRgb, cycle = 3000, glowLen = 300 } = cfg;
      const now = performance.now();
      const elapsed = (now - chart.__pulseStart) % cycle;
      if (elapsed <= glowLen) {
        const t = elapsed / glowLen;
        const outerR = 6 + 4 * t;
        chart.ctx.save();
        chart.ctx.beginPath();
        chart.ctx.arc(x, y, outerR, 0, 2 * Math.PI);
        chart.ctx.fillStyle = `rgba(${colorRgb},${1 - t})`;
        chart.ctx.fill();
        chart.ctx.restore();
      }
      chart.ctx.save();
      chart.ctx.beginPath();
      chart.ctx.arc(x, y, 6, 0, 2 * Math.PI);
      chart.ctx.fillStyle = colorHex;
      chart.ctx.fill();
      chart.ctx.restore();
    },
  }
);

const MemoChart = React.memo(Chart);

export default function ChartSection({ symbol }) {
  const chartRef = useRef(null);
  const prevCloseRef = useRef(null);

  // ─── STATE ────────────────────────────────────────────────
  const [tf, setTf] = useState("1D");
  const [type, setType] = useState("line");
  const [hover, setHover] = useState({ x: null, time: "", price: null });
  const [livePrice, setLivePrice] = useState(null);
  const [tick, setTick] = useState(0);
  const dataRef = useRef({});
  const [priceAnchor, setPriceAnchor] = useState(null);

  // Interval selection
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd] = useState(null);
  const [dragging, setDragging] = useState(false);

  // helper to grab the true nearest data-point price
  const getNearestPrice = useCallback((xValue) => {
    const chart = chartRef.current;
    if (!chart) return null;
    const dataArr = chart.data.datasets[0]?.data;
    if (!dataArr?.length) return null;
    let nearest = dataArr[0];
    let minD = Math.abs(new Date(nearest.x).getTime() - xValue);
    for (let i = 1; i < dataArr.length; i++) {
      const p = dataArr[i];
      const d = Math.abs(new Date(p.x).getTime() - xValue);
      if (d < minD) {
        minD = d;
        nearest = p;
      }
    }
    return nearest.y != null ? nearest.y : nearest.c;
  }, []);

  // ─── LIVE 1D DATA & JITTER ───────────────────────────────
  useEffect(() => {
    if (tf !== "1D") return;
    const seed = parseFloat(dataRef.current.price ?? 100);
    setLivePrice((p) => (typeof p === "number" ? p : seed));
    const idJitter = setInterval(() => {
      setLivePrice((prev) => {
        const base = typeof prev === "number" ? prev : seed;
        const newPrice = parseFloat((base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2));
        const chart = chartRef.current;
        if (chart) {
          const ds = chart.data.datasets[0].data;
          if (ds.length) {
            const pt = ds[ds.length - 1];
            if ("y" in pt) pt.y = newPrice;
            else if ("c" in pt) pt.c = newPrice;
            chart.update("none");
          }
        }
        return newPrice;
      });
    }, 3000);
    const idTick = setInterval(() => setTick((t) => t + 1), 300000);
    return () => {
      clearInterval(idJitter);
      clearInterval(idTick);
    };
  }, [tf, symbol]);

  // ─── FAKE GENERATOR for 1D ────────────────────────────────
  const {
    data: fakeData,
    price: fakePrice,
    openTime,
    closeTime,
    timeScale,
    tickScale,
  } = useMemo(() => {
    const r = generateChartData(tf, type, symbol, tick);
    dataRef.current.price = r.price;
    return r;
  }, [tf, type, symbol, tick]);

  useEffect(() => {
    if (tf === "1D") setLivePrice(parseFloat(fakePrice));
  }, [fakePrice, tf]);

  // ─── HISTORICAL DATA ─────────────────────────────────────
  const { data: histData = [], isLoading, isError } = useQuery({
    queryKey: ["chartData", symbol, tf],
    queryFn: () => fetchChartData(symbol, tf),
    enabled: tf !== "1D",
  });

  // ─── PRICE CHANGE and ANCHOR ──────────────────────────────
  useEffect(() => {
    if (tf !== "1D" || livePrice == null) return;
    if (priceAnchor == null) setPriceAnchor(livePrice);
    else if (Math.abs((livePrice - priceAnchor) / priceAnchor) >= 0.05)
      setPriceAnchor(livePrice);
  }, [livePrice, tf, priceAnchor]);

  const changeInfo = useMemo(() => {
    const arr = (tf === "1D" ? fakeData.datasets[0].data : histData)
      .filter((pt) => pt.y != null || pt.c != null);
    if (!arr.length) return null;
    const first = arr[0].y ?? arr[0].c;
    const last = arr[arr.length - 1].y ?? arr[arr.length - 1].c;
    const change = last - first;
    return { change, pct: (change / first) * 100 };
  }, [tf, fakeData, histData]);

  // ─── BASE DATA ────────────────────────────────────────────
  const baseData = useMemo(() => {
    if (tf === "1D") return fakeData;
    const filtered = histData.filter((pt) => pt.y != null || pt.c != null);
    return {
      datasets: [
        {
          label: symbol,
          data: filtered,
          spanGaps: false,
          borderWidth: 1.5,
          tension: 0,
          backgroundColor: "transparent",
        },
      ],
    };
  }, [tf, fakeData, histData, symbol]);

  // ─── MAIN DATASET with selection styling ──────────────────
  const mainDataset = useMemo(() => {
    if (type === "candlestick") return baseData.datasets[0];
    const s = selectStart, e = selectEnd;
    const startVal = s ? getNearestPrice(s.xValue) : null;
    const endVal = e ? getNearestPrice(e.xValue) : null;
    const diff = s && e ? endVal - startVal : null;
    const colorHex = "#00ffa8";
    // determine selection bounds for highlighting (support dragging backwards)
    const minX = s && e ? Math.min(s.xValue, e.xValue) : null;
    const maxX = s && e ? Math.max(s.xValue, e.xValue) : null;
    // determine default border color based on selection or overall direction
    const defaultBorderColor = diff != null
      ? (diff >= 0 ? "#0f0" : "#f44")
      : (baseData.datasets[0].borderColor || colorHex);
    return {
      ...baseData.datasets[0],
      borderColor: defaultBorderColor,
      segment: {
        borderColor: (ctx) => {
          const x0 = ctx.p0.parsed.x, x1 = ctx.p1.parsed.x;
          if (minX != null && maxX != null && x0 >= minX && x1 <= maxX) {
            return diff >= 0 ? "#0f0" : "#f44";
          }
          return colorHex;
        },
      },
      pointBackgroundColor: ctx => {
        // New implementation per instructions
        if (!ctx.parsed) return defaultBorderColor;
        const px = ctx.parsed.x;
        if (minX != null && maxX != null && px >= minX && px <= maxX) {
          return diff >= 0 ? "#0f0" : "#f44";
        }
        return defaultBorderColor;
      },
      pointRadius: 0,
      pointHoverRadius: 0,
    };
  }, [baseData, type, selectStart, selectEnd]);

  // ─── CHART DATA ───────────────────────────────────────────
  const chartData = useMemo(() => {
    return type === "candlestick"
      ? baseData
      : { datasets: [mainDataset] };
  }, [baseData, mainDataset, type]);

  // calculate y-axis bounds for live 1D
  const { yMin, yMax } = useMemo(() => {
    if (tf !== "1D") return { yMin: null, yMax: null };
    const pts = baseData.datasets[0].data;
    if (!pts.length) return { yMin: null, yMax: null };
    const yVals = pts.map((p) => p.y ?? p.c).filter((v) => v != null);
    if (prevCloseRef.current == null) prevCloseRef.current = yVals[0];
    const prev = prevCloseRef.current;
    const anchor = priceAnchor ?? prev;
    const bufferPct = 0.05;
    return {
      yMin: Math.min(anchor * (1 - bufferPct), ...yVals),
      yMax: Math.max(anchor * (1 + bufferPct), ...yVals),
    };
  }, [baseData, tf, priceAnchor]);

  // annotations for prev close and selection
  const annotations = useMemo(() => {
    const ann = {};
    if (tf === "1D" && prevCloseRef.current != null) {
      ann.prevCloseLine = {
        type: "line",
        yMin: prevCloseRef.current,
        yMax: prevCloseRef.current,
        borderColor: "#888",
        borderDash: [4, 4],
        borderWidth: 1,
      };
    }
    if (selectStart) {
      ann.startLine = {
        type: "line",
        xMin: selectStart.xValue,
        xMax: selectStart.xValue,
        borderColor: "#555",
        borderWidth: 1,
      };
    }
    if (selectStart && selectEnd) {
      const delta = getNearestPrice(selectEnd.xValue) - getNearestPrice(selectStart.xValue);
      const pct = (delta / getNearestPrice(selectStart.xValue)) * 100;
      ann.endLine = {
        type: "line",
        xMin: selectEnd.xValue,
        xMax: selectEnd.xValue,
        borderColor: delta >= 0 ? "#0f0" : "#f44",
        borderWidth: 1,
        animation: false,
      };
      ann.changeLabel = {
        type: "label",
        xValue: selectEnd.xValue + 10,
        yValue: getNearestPrice(selectEnd.xValue),
        backgroundColor: "black",
        color: delta >= 0 ? "#0f0" : "#f44",
        borderColor: delta >= 0 ? "#0f0" : "#f44",
        borderWidth: 1,
        borderRadius: 10,
        padding: 4,
        content: [`${delta >= 0 ? "+" : ""}${delta.toFixed(2)} (${pct.toFixed(2)}%)`],
        position: (ctx, opts) => {
          const chart = ctx.chart;
          const xPixel = chart.scales.x.getPixelForValue(opts.xValue);
          const mid = (chart.chartArea.left + chart.chartArea.right) / 2;
          return xPixel < mid ? "start" : "end";
        },
        xAdjust: (ctx, opts) => {
          const chart = ctx.chart;
          const content = Array.isArray(opts.content) ? opts.content[0] : opts.content;
          const textWidth = chart.ctx.measureText(content).width;
          const margin = 6;
          return opts.position === "start" ? -textWidth - margin : margin;
        },
        yAdjust: (ctx, opts) => {
          const chart = ctx.chart;
          const yPx = chart.scales.y.getPixelForValue(opts.yValue);
          const { top, bottom } = chart.chartArea;
          const fontSize = (opts.font && opts.font.size) || 12;
          const height = fontSize;
          const padding = 6;
          if (yPx - height - padding < top) {
            return top - (yPx - height - padding);
          }
          if (yPx + padding > bottom) {
            return bottom - (yPx + padding) - height;
          }
          return -height - 2;
        },
        font: { size: 12 },
        animation: false,
      };
    }
    return ann;
  }, [tf, selectStart, selectEnd, getNearestPrice]);

  // ─── OPTIONS ─────────────────────────────────────────────
  const options = useMemo(() => {
    const axisConfig = TIMEFRAME_AXIS_CONFIG[tf];
    const selection = (selectStart && selectEnd)
      ? {
          startX: selectStart.pixelX,
          endX: selectEnd.pixelX,
          color: getNearestPrice(selectEnd.xValue) >= getNearestPrice(selectStart.xValue) ? "#0f0" : "#f44",
        }
      : undefined;
    const cfg = {
      maintainAspectRatio: false,
      animation: { duration: 300, easing: "linear" },
      plugins: {
        crosshair: { hoverX: hover.x, selection },
        legend: { display: false },
        tooltip: { enabled: false },
        annotation: { annotations },
        liveDot: { enabled: tf === "1D", value: livePrice, colorHex: "#00ffa8", colorRgb: "0,255,168", cycle: 3000, glowLen: 300 },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x:
          tf === "1D"
            ? {
                type: "time",
                distribution: "linear",
                time: timeScale,
                ticks: tickScale,
                grid: { display: false },
                bounds: axisConfig?.bounds,
                min: openTime,
                max: closeTime,
              }
            : axisConfig
            ? {
                type: "time",
                distribution: "series",
                time: {
                  unit: axisConfig.unit,
                  displayFormats: axisConfig.displayFormats,
                },
                ticks: {
                  source: "auto",
                  autoSkip: true,
                  maxTicksLimit: axisConfig.maxTicksLimit,
                },
                grid: { display: false },
              }
            : {
                type: "time",
                distribution: "series",
                time: timeScale,
                ticks: tickScale,
                grid: { display: false },
              },
        y: { ticks: { color: "#999" }, grid: { display: false }, ...(tf === "1D" && { min: yMin, max: yMax }) },
      },
    };
    return cfg;
  }, [tf, hover, selectStart, selectEnd, livePrice, openTime, closeTime, timeScale, tickScale, yMin, yMax]);

  // ─── HANDLERS ─────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const chart = chartRef.current;
    if (!chart) return;
    const { left, right, top, bottom } = chart.chartArea;
    const rect = chart.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left, y = e.clientY - rect.top;
    // clamp hover within data bounds
    const data = chart.data.datasets[0].data;
    const minX = left, maxX = chart.scales.x.getPixelForValue(new Date(data[data.length-1].x));
    if (x < minX) return setHover({ x: null, time: "", price: null });
    if (x > maxX) x = maxX;
    const xVal = chart.scales.x.getValueForPixel(x);
    const time = format(new Date(xVal), "MMM d, h:mm a");
    const price = chart.scales.y.getValueForPixel(y).toFixed(2);
    setHover(prev => prev.x === x && prev.time === time && prev.price === price ? prev : { x, time, price });
    if (selectStart) {
      const clampedX = Math.min(Math.max(x, minX), maxX);
      const clampedY = Math.min(Math.max(y, top), bottom);
      setSelectEnd({ xValue: chart.scales.x.getValueForPixel(clampedX), price: chart.scales.y.getValueForPixel(clampedY), pixelX: clampedX });
      chart.update("none");
    }
  }, [selectStart]);

  const handleMouseLeave = useCallback(() => {
    setHover({ x: null, time: "", price: null });
    setDragging(false);
    setSelectStart(null);
    setSelectEnd(null);
  }, []);

  const handleMouseDown = useCallback((e) => {
    const chart = chartRef.current; if (!chart) return;
    const rect = chart.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { left, top } = chart.chartArea;
    const maxX = chart.scales.x.getPixelForValue(new Date(chart.data.datasets[0].data.slice(-1)[0].x));
    if (x < left || x > maxX || y < top || y > chart.chartArea.bottom) return;
    x = Math.min(Math.max(x, left), maxX);
    if (selectStart && !dragging) {
      setSelectStart(null); setSelectEnd(null); setHover({ x: null, time: "", price: null });
      return;
    }
    const xVal = chart.scales.x.getValueForPixel(x);
    const priceVal = chart.scales.y.getValueForPixel(y);
    setSelectStart({ xValue: xVal, price: priceVal, pixelX: x });
    setSelectEnd(null);
    setDragging(true);
  }, [selectStart, dragging]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(false);
      setSelectStart(null);
      setSelectEnd(null);
    }
  }, [dragging]);

  // ─── RENDER ───────────────────────────────────────────────
  const displayPrice = hover.price ?? (tf === "1D" ? livePrice?.toFixed(2) : (histData.slice(-1)[0]?.y ?? livePrice).toFixed(2));
  return (
    <section className="tp-chart-section tp-panel">
      <div className="tp-chart-section-header">
        <div className="tp-chart-section-sub-header">
          <div>
            <div className="tp-symbol-header">{symbol}</div>
            <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
          </div>
          <div className="tp-symbol-price-group">
            {changeInfo && (
              <span className="tp-change" style={{ color: changeInfo.change >= 0 ? "#0f0" : "#f44" }}>
                {changeInfo.change >= 0 ? "+" : ""}{changeInfo.change.toFixed(2)} ({changeInfo.pct >= 0 ? "+" : ""}{changeInfo.pct.toFixed(2)}%)
              </span>
            )}
            <span className="tp-price">${displayPrice}</span>
          </div>
        </div>
        <div className="tp-chart-controls">
          <div className="tp-timeframe">
            {Object.keys(TIMEFRAMES).filter(k => k !== "1H").map(k => (
              <button key={k} className={tf===k ? "tp-active" : ""} onClick={() => { setTf(k); setTick(0); setPriceAnchor(null); setSelectStart(null); setSelectEnd(null); }}>
                {k}
              </button>
            ))}
          </div>
          <div className="tp-chart-type-buttons">
            {["line","candlestick"].map(t => (
              <button key={t} className={`tp-chart-type-btn${type===t?" tp-active":""}`} onClick={()=>setType(t)}>
                {t==="line"?"Line":"Candle"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="tp-chart-body"
           onMouseMove={handleMouseMove}
           onMouseLeave={handleMouseLeave}
           onMouseDown={handleMouseDown}
           onMouseUp={handleMouseUp}>
        {hover.time && Number.isFinite(hover.x) && (
          <div className="tp-hover-info" style={{ left: hover.x }}>{hover.time}</div>
        )}
        {tf==="1D" ? (
          <MemoChart ref={chartRef} type={type} data={chartData} options={options}/>
        ) : isLoading ? (
          <div className="tp-chart-loading">Loading historical data…</div>
        ) : isError ? (
          <div className="tp-chart-error">Error loading data</div>
        ) : (
          <MemoChart ref={chartRef} type={type} data={chartData} options={options}/>
        )}
      </div>
    </section>
);
}