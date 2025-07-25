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
    const cfg = chart.config.options.plugins.liveDot;
    if (!chart.ctx || !cfg?.enabled || cfg.value == null) return;
    const meta = chart.getDatasetMeta(0);
    const pts = meta.data;
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
    if (!dataArr || !dataArr.length) return null;
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
    const id1 = setInterval(() => {
      setLivePrice((p) => {
        const prev = typeof p === "number" ? p : seed;
        return parseFloat(
          (prev * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)
        );
      });
    }, 3000);
    const id2 = setInterval(() => setTick((t) => t + 1), 300000);
    return () => {
      clearInterval(id1);
      clearInterval(id2);
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
    return {
      datasets: [
        {
          label: symbol,
          data: histData,
          spanGaps: true,
          borderWidth: 1.5,
          tension: 0.3,
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

    // compute trueDelta only if both endpoints exist
    const sVal = selectStart ? getNearestPrice(selectStart.xValue) : null;
    const eVal = selectEnd ? getNearestPrice(selectEnd.xValue) : null;
    const trueDelta = sVal != null && eVal != null ? eVal - sVal : null;

    // define min/max X so we handle both forward & backward drags
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

  const chartData = useMemo(
    () => (type === "candlestick" ? baseData : { datasets: [mainDataset] }),
    [baseData, mainDataset, type]
  );

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
      const pct =
        (δ / getNearestPrice(selectStart.xValue)) * 100;
      ann.endLine = {
        type: "line",
        xMin: selectEnd.xValue,
        xMax: selectEnd.xValue,
        borderColor: δ >= 0 ? "#0f0" : "#f44",
        borderWidth: 1,
      };
      ann.changeLabel = {
        type: "label",
        xValue: selectEnd.xValue,
        yValue: getNearestPrice(selectEnd.xValue),
        backgroundColor: δ >= 0 ? "#0f0" : "#f44",
        content: [`${δ >= 0 ? "+" : ""}${δ.toFixed(2)} (${pct.toFixed(2)}%)`],
        position: "start",
        yAdjust: -10,
        font: { size: 12 },
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
        x: {
          type: "time",
          distribution: tf === "1D" ? "linear" : "series",
          time: xTimeScale,
          ticks: xTickScale,
          grid: { display: false },
          ...(tf === "1D" && {
            min: openTime,
            max: closeTime,
            bounds: "ticks",
          }),
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
  ]);

  // ─── HANDLERS ─────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e) => {
      const chart = chartRef.current;
      if (!chart) return;
      const rect = chart.canvas.getBoundingClientRect();
      const xPix = e.clientX - rect.left;
      const yPix = e.clientY - rect.top;
      const { left, right } = chart.chartArea;
      const xValue = chart.scales.x.getValueForPixel(xPix);

      // hover
      if (xPix < left || xPix > right) {
        setHover({ x: null, time: "", price: null });
      } else {
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

      // dragging → update selectEnd
      if (dragging && selectStart) {
        const xVal2 = chart.scales.x.getValueForPixel(xPix);
        const p2 = chart.scales.y.getValueForPixel(yPix);
        setSelectEnd({ xValue: xVal2, price: p2, pixelX: xPix });
      }
    },
    [dragging, selectStart]
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

      // clear existing interval on second click
      if (selectStart && !dragging) {
        setSelectStart(null);
        setSelectEnd(null);
        setHover({ x: null, time: "", price: null });
        return;
      }

      // begin new interval
      const xValue = chart.scales.x.getValueForPixel(xPix);
      const price = chart.scales.y.getValueForPixel(yPix);
      setSelectStart({ xValue, price, pixelX: xPix });
      setSelectEnd(null);
      setDragging(true);
    },
    [selectStart, dragging]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(false);
      // clear both on mouse up:
      setSelectStart(null);
      setSelectEnd(null);
    }
  }, [dragging]);

  // ─── RENDER ───────────────────────────────────────────────
  const displayPrice =
    hover.price != null
      ? hover.price
      : tf === "1D" && typeof livePrice === "number"
      ? livePrice.toFixed(2)
      : staticPrice;

  return (
    <section className="tp-chart-section tp-panel">
      {/* Header & controls */}
      <div className="tp-chart-section-header">
        <div className="tp-chart-section-sub-header">
          <div>
            <div className="tp-symbol-header">{symbol}</div>
            <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
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
                className={`tp-chart-type-btn${type === t ? " tp-active" : ""}`}
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