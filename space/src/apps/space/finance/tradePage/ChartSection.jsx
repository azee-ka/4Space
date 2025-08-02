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

// live-dot plugin (unchanged)
const liveDotPlugin = {
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
      const ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, outerR, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${colorRgb},${1 - t})`;
      ctx.fill();
      ctx.restore();
    }
    const ctx2 = chart.ctx;
    ctx2.save();
    ctx2.beginPath();
    ctx2.arc(x, y, 6, 0, 2 * Math.PI);
    ctx2.fillStyle = colorHex;
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

  // selection state
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd] = useState(null);
  const [dragging, setDragging] = useState(false);

  // ─── helper to grab the true nearest data-point price ─────
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
    // initialize livePrice to the seed or existing
    setLivePrice((p) => (typeof p === "number" ? p : seed));
    // jitter the live dot every 3s
    const idJitter = setInterval(() => {
      setLivePrice((prev) => {
        const base = typeof prev === "number" ? prev : seed;
        const newPrice = parseFloat((base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2));
        // update dataset's last point
        const chart = chartRef.current;
        if (chart) {
          const ds = chart.data.datasets[0].data;
          if (ds && ds.length) {
            const lastIdx = ds.length - 1;
            const pt = ds[lastIdx];
            if ("y" in pt) pt.y = newPrice;
            else if ("c" in pt) pt.c = newPrice;
            chart.update("none");
          }
        }
        return newPrice;
      });
    }, 3000);
    // regenerate full data (tick) every 5 minutes
    const idTick = setInterval(() => setTick((t) => t + 1), 300000);
    return () => {
      clearInterval(idJitter);
      clearInterval(idTick);
    };
  }, [tf, symbol]);

  // ─── GENERATE FAKE 1D ─────────────────────────────────────
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
  }, [fakePrice, tf, tick]);

  // ─── HISTORICAL VIA REACT-QUERY ───────────────────────────
  const { data: histData = [], isLoading, isError } = useQuery({
    queryKey: ["chartData", symbol, tf],
    queryFn: () => fetchChartData(symbol, tf),
    enabled: tf !== "1D",
  });

  // ─── PRICE ANCHOR ─────────────────────────────────────────
  const bufferPct = 0.05;
  useEffect(() => {
    if (tf !== "1D" || livePrice == null) return;
    if (priceAnchor == null) setPriceAnchor(livePrice);
    else if (
      Math.abs((livePrice - priceAnchor) / priceAnchor) >= bufferPct
    ) {
      setPriceAnchor(livePrice);
    }
  }, [livePrice, tf, priceAnchor]);

  // ─── BASE DATA & SCALES ──────────────────────────────────
  const baseData = useMemo(() => {
    if (tf === "1D") return fakeData;
    // for week and month, plot only active timestamps as categories
    if (tf === "1W" || tf === "1M") {
      const filtered = histData.filter((pt) => pt.y != null || pt.c != null);
      const labels = filtered.map((pt) => pt.x);
      const values = filtered.map((pt) => pt.y ?? pt.c);
      return {
        labels,
        datasets: [
          {
            label: symbol,
            data: values,
            spanGaps: false,
            borderWidth: 1.5,
            tension: 0,
            backgroundColor: "transparent",
          },
        ],
      };
    }
    // filter out points where both y and c are null
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

  const lastReal = histData.slice(-1)[0]?.y;
  const staticPrice =
    tf === "1D" ? fakePrice : lastReal?.toFixed(2) ?? fakePrice;
  const openTime = tf === "1D" ? fakeOpen : undefined;
  const closeTime = tf === "1D" ? fakeClose : undefined;
  const xTimeScale = tf === "1D" ? fakeTS : {};
  const xTickScale = tf === "1D" ? fakeTick : {};

  const { yMin, yMax } = useMemo(() => {
    if (tf !== "1D") return { yMin: null, yMax: null };
    const pts = baseData.datasets[0].data;
    if (!pts.length) return { yMin: null, yMax: null };
    const yVals = pts.map((p) => p.y ?? p.c).filter((v) => v != null);
    if (prevCloseRef.current == null) prevCloseRef.current = yVals[0];
    const prev = prevCloseRef.current;
    const anchor = priceAnchor ?? prev;
    return {
      yMin: Math.min(anchor * (1 - bufferPct), ...yVals),
      yMax: Math.max(anchor * (1 + bufferPct), ...yVals),
    };
  }, [baseData, tf, priceAnchor]);

  // ─── COLOR LOGIC FOR WHOLE LINE ──────────────────────────
  const firstPt = baseData.datasets[0].data[0] || {};
  const openPrice = firstPt.y ?? firstPt.o ?? parseFloat(staticPrice);
  const currentPrice = tf === "1D" ? livePrice : parseFloat(staticPrice);
  const isUp = currentPrice >= openPrice;
  const colorHex = isUp ? "#00ffa8" : "#f44";
  const colorRgb = isUp ? "0,255,168" : "244,68,68";

  // ─── MAIN DATASET ────────────────────────────────────────
  const mainDataset = useMemo(() => {
    if (type === "candlestick") return baseData.datasets[0];

    const sVal = selectStart ? getNearestPrice(selectStart.xValue) : null;
    const eVal = selectEnd ? getNearestPrice(selectEnd.xValue) : null;
    const trueDelta = sVal != null && eVal != null ? eVal - sVal : null;

    const minX =
      selectStart && selectEnd
        ? Math.min(selectStart.xValue, selectEnd.xValue)
        : null;
    const maxX =
      selectStart && selectEnd
        ? Math.max(selectStart.xValue, selectEnd.xValue)
        : null;

    return {
      ...baseData.datasets[0],
      borderColor: colorHex,
      pointRadius: 0,
      pointHoverRadius: 0,
      segment: {
        borderColor: (ctx) => {
          const x0 = ctx.p0?.parsed?.x;
          const x1 = ctx.p1?.parsed?.x;
          if (
            trueDelta != null &&
            x0 != null &&
            x1 != null &&
            minX != null &&
            maxX != null &&
            x0 >= minX &&
            x1 <= maxX
          ) {
            return trueDelta >= 0 ? "#0f0" : "#f44";
          }
          return colorHex;
        },
      },
      pointBackgroundColor: (ctx) => {
        const px = ctx.parsed?.x;
        if (
          trueDelta != null &&
          px != null &&
          minX != null &&
          maxX != null &&
          px >= minX &&
          px <= maxX
        ) {
          return trueDelta >= 0 ? "#0f0" : "#f44";
        }
        return colorHex;
      },
      pointBorderColor: (ctx) => ctx.dataset.pointBackgroundColor(ctx),
    };
  }, [baseData, type, selectStart, selectEnd, colorHex, getNearestPrice]);

  const chartData = useMemo(() => {
    if (type === "candlestick") return baseData;
    // for 1W/1M we already have labels in baseData
    if (tf === "1W" || tf === "1M") {
      return {
        labels: baseData.labels,
        datasets: [mainDataset],
      };
    }
    return { datasets: [mainDataset] };
  }, [baseData, mainDataset, type, tf]);

  // ─── ANNOTATIONS ──────────────────────────────────────────
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
      const δ =
        getNearestPrice(selectEnd.xValue) -
        getNearestPrice(selectStart.xValue);
      const pct = (δ / getNearestPrice(selectStart.xValue)) * 100;

      ann.endLine = {
        type: "line",
        xMin: selectEnd.xValue,
        xMax: selectEnd.xValue,
        borderColor: δ >= 0 ? "#0f0" : "#f44",
        borderWidth: 1,
        animation: false,
      };
      ann.changeLabel = {
        type: "label",
        xValue: selectEnd.xValue + 10,
        yValue: getNearestPrice(selectEnd.xValue),
        backgroundColor: "black",
        color: δ >= 0 ? "#0f0" : "#f44",
        borderColor: δ >= 0 ? "#0f0" : "#f44",
        borderWidth: 1,
        borderRadius: 10,
        padding: 4,
        content: [`${δ >= 0 ? "+" : ""}${δ.toFixed(2)} (${pct.toFixed(2)}%)`],
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
          // if positioned on the left of the point, shift left by width + margin; else shift right by margin
          return opts.position === 'start' ? -textWidth - margin : margin;
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
    const selection = selectStart
      ? {
          startX: selectStart.pixelX,
          endX: selectEnd?.pixelX ?? selectStart.pixelX,
          color:
            selectStart && selectEnd
              ? getNearestPrice(selectEnd.xValue) >=
                getNearestPrice(selectStart.xValue)
                ? "#0f0"
                : "#f44"
              : "#888",
        }
      : undefined;

    return {
      maintainAspectRatio: false,
      animation: { duration: 300, easing: "linear" },
      plugins: {
        crosshair: {
          hoverX: hover.x,
          selection,
        },
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
        x: tf === "1D"
          ? {
              type: "time",
              distribution: "linear",
              time: xTimeScale,
              ticks: xTickScale,
              grid: { display: false },
              bounds: "ticks",
              min: openTime,
              max: closeTime,
            }
          : tf === "1W" || tf === "1M"
          ? {
              type: "category",
              labels: baseData.labels,
              grid: { display: false },
            }
          : {
              type: "time",
              distribution: "series",
              time: xTimeScale,
              ticks: xTickScale,
              grid: { display: false },
            },
        y: {
          ticks: { color: "#999" },
          grid: { display: false },
          ...(tf === "1D" && { min: yMin, max: yMax }),
        },
      },
    };
  }, [
    hover.x,
    annotations,
    tf,
    livePrice,
    colorHex,
    colorRgb,
    xTimeScale,
    xTickScale,
    openTime,
    closeTime,
    yMin,
    yMax,
    selectStart,
    selectEnd,
    getNearestPrice,
    baseData.labels,
  ]);

  // ─── HANDLERS ─────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e) => {
      const chart = chartRef.current;
      if (!chart) return;
      const rect = chart.canvas.getBoundingClientRect();
      const xPix = e.clientX - rect.left;
      const yPix = e.clientY - rect.top;
      const { left, right, top, bottom } = chart.chartArea;

      // determine right boundary at last data point
      const dataArr = chart.data.datasets[0]?.data || [];
      const minDataPix = left;
      let maxDataPix = right;
      if (dataArr.length) {
        const lastPt = dataArr[dataArr.length - 1];
        const lastX = lastPt.x instanceof Date ? lastPt.x : new Date(lastPt.x);
        maxDataPix = chart.scales.x.getPixelForValue(lastX);
      }

      const xValue = chart.scales.x.getValueForPixel(xPix);

      // hover crosshair
      if (xPix < minDataPix) {
        setHover({ x: null, time: "", price: null });
      } else if (xPix > maxDataPix) {
        // pin to last data point
        const lastPt = dataArr[dataArr.length - 1];
        const ptTime = new Date(lastPt.x);
        const ptPrice = lastPt.y ?? lastPt.c;
        const newTime = format(ptTime, "MMM d, h:mm a");
        const newPrice = ptPrice.toFixed(2);
        setHover((prev) =>
          prev.x === maxDataPix && prev.time === newTime && prev.price === newPrice
            ? prev
            : { x: maxDataPix, time: newTime, price: newPrice }
        );
      } else {
        // existing hover logic
        const time = new Date(xValue);
        const price = chart.scales.y.getValueForPixel(yPix);
        const newTime = format(time, "MMM d, h:mm a");
        const newPrice = price.toFixed(2);
        setHover((prev) =>
          prev.x === xPix && prev.time === newTime && prev.price === newPrice
            ? prev
            : { x: xPix, time: newTime, price: newPrice }
        );
      }

      // always update the interval “end” crosshair so it never lags, clamped within data bounds
      if (selectStart) {
        const clampedXPix = Math.max(minDataPix, Math.min(xPix, maxDataPix));
        const clampedYPix = Math.max(top, Math.min(yPix, bottom));
        const xVal2 = chart.scales.x.getValueForPixel(clampedXPix);
        const p2 = chart.scales.y.getValueForPixel(clampedYPix);
        setSelectEnd({ xValue: xVal2, price: p2, pixelX: clampedXPix });
        // force immediate redraw without animation so endLine follows cursor exactly
        chart.update('none');
      }
    },
    [selectStart]
  );

  const handleMouseLeave = useCallback(() => {
    setHover({ x: null, time: "", price: null });
    setDragging(false);
    setSelectStart(null);
    setSelectEnd(null);
  }, []);

  const handleMouseDown = useCallback(
    (e) => {
      const chart = chartRef.current;
      if (!chart) return;
      const rect = chart.canvas.getBoundingClientRect();
      const xPix = e.clientX - rect.left;
      const yPix = e.clientY - rect.top;
      const { left, right, top, bottom } = chart.chartArea;
      // determine selection boundary at last data point
      const dataArr = chart.data.datasets[0]?.data || [];
      const minDataPix = left;
      let maxDataPix = right;
      if (dataArr.length) {
        const lastPt = dataArr[dataArr.length - 1];
        const lastX = lastPt.x instanceof Date ? lastPt.x : new Date(lastPt.x);
        maxDataPix = chart.scales.x.getPixelForValue(lastX);
      }
      // ignore clicks outside the data area
      if (xPix < minDataPix || xPix > maxDataPix || yPix < top || yPix > bottom) {
        return;
      }
      const clampedXPix = Math.max(minDataPix, Math.min(xPix, maxDataPix));
      const clampedYPix = Math.max(top, Math.min(yPix, bottom));

      // clear on second click
      if (selectStart && !dragging) {
        setSelectStart(null);
        setSelectEnd(null);
        setHover({ x: null, time: "", price: null });
        return;
      }

      // set initial anchor
      const xValue = chart.scales.x.getValueForPixel(clampedXPix);
      const price = chart.scales.y.getValueForPixel(clampedYPix);
      setSelectStart({ xValue, price, pixelX: clampedXPix });
      setSelectEnd(null);
      setDragging(true);
    },
    [selectStart, dragging]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(false);
      // <-- clear interval selection immediately on mouse-up:
      setSelectStart(null);
      setSelectEnd(null);
    }
  }, [dragging]);

  // ─── RENDER ───────────────────────────────────────────────
  // ─── PRICE CHANGE INFO ────────────────────────────────────
  const changeInfo = useMemo(() => {
    const dataArr = baseData.datasets[0].data;
    if (!dataArr.length) return null;
    const firstVal = dataArr[0].y ?? dataArr[0].c;
    const lastVal = dataArr[dataArr.length - 1].y ?? dataArr[dataArr.length - 1].c;
    const change = lastVal - firstVal;
    const pct = (change / firstVal) * 100;
    return { change, pct };
  }, [baseData]);
  const displayPrice =
    hover.price != null
      ? hover.price
      : tf === "1D" && typeof livePrice === "number"
      ? livePrice.toFixed(2)
      : staticPrice;

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
            <span
              className="tp-change"
              style={{ color: changeInfo.change >= 0 ? "#0f0" : "#f44" }}
            >
              {changeInfo.change >= 0 ? "+" : ""}
              {changeInfo.change.toFixed(2)} (
              {changeInfo.pct >= 0 ? "+" : ""}
              {changeInfo.pct.toFixed(2)}%)
            </span>
          )}
            <span className="tp-price">${displayPrice}</span>
            </div>
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {hover.time && Number.isFinite(hover.x) && (
          <div className="tp-hover-info" style={{ left: hover.x }}>
            {hover.time}
          </div>
        )}
        {tf === "1D" ? (
          <MemoChart
            ref={chartRef}
            type={type}
            data={chartData}
            options={options}
          />
        ) : isLoading ? (
          <div className="tp-chart-loading">Loading historical data…</div>
        ) : isError ? (
          <div className="tp-chart-error">Error loading data</div>
        ) : (
          <MemoChart
            ref={chartRef}
            type={type}
            data={chartData}
            options={options}
          />
        )}
      </div>
    </section>
  );
}