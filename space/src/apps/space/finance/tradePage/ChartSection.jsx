// components/ChartSection.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
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
import crosshairPlugin from "./crosshairPlugin";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { TIMEFRAMES, COMPANY_NAMES } from "./chartConfig";
import { generateChartData } from "./generateChartData";

// register Chart.js components & plugins
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
  annotationPlugin
);

export default function ChartSection({ symbol }) {
  const chartRef = useRef(null);
  const prevCloseRef = useRef(null);

  // core state
  const [tf, setTf] = useState("1D");               // timeframe
  const [type, setType] = useState("line");         // "line" or "candlestick"
  const [hover, setHover] = useState({ x: null, time: "", price: null });
  const [livePrice, setLivePrice] = useState(null);
  const [tick, setTick] = useState(0);
  const dataRef = useRef({});
  const [priceAnchor, setPriceAnchor] = useState(null);

  // selection state
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd]     = useState(null);
  const [dragging, setDragging]       = useState(false);

  // 1D live-price polling and anchor logic
  useEffect(() => {
    if (tf !== "1D") return;
    setLivePrice(p => p ?? parseFloat(dataRef.current.price ?? 100));
    const id = setInterval(() => {
      setLivePrice(p =>
        parseFloat(((p ?? 100) * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
      );
    }, 3000);
    return () => clearInterval(id);
  }, [tf, symbol]);

  const bufferPct = 0.05;
  useEffect(() => {
    if (tf !== "1D" || livePrice == null) return;
    if (priceAnchor == null) setPriceAnchor(livePrice);
    else if (Math.abs((livePrice - priceAnchor) / priceAnchor) >= bufferPct) {
      setPriceAnchor(livePrice);
    }
  }, [livePrice, tf, priceAnchor]);

  // static data refresh every 5m
  useEffect(() => {
    if (tf !== "1D") return;
    const id = setInterval(() => setTick(t => t + 1), 300000);
    return () => clearInterval(id);
  }, [tf, symbol]);

  // generate base data
  const {
    data: baseData,
    price: staticPrice,
    openTime,
    closeTime,
    timeScale,
    tickScale,
  } = useMemo(() => {
    const r = generateChartData(tf, type, symbol, tick);
    dataRef.current.price = r.price;
    return r;
  }, [tf, type, symbol, tick]);

  // patch livePrice into last point
  useEffect(() => {
    if (tf !== "1D") return;
    const chart = chartRef.current;
    const ds = chart?.data.datasets[0].data;
    if (!ds?.length) return;
    ds[ds.length - 1] = { x: new Date(), y: livePrice };
    chart.update("none");
  }, [livePrice, tf]);

  const fmtHover = dt => format(dt, "MMM d, h:mm a");

  // compute y-axis bounds and prev-close
  const { yMin, yMax } = useMemo(() => {
    const pts = baseData.datasets[0].data;
    const yVals = pts.map(p => p.y ?? p.c).filter(v => v != null);
    if (tf === "1D") {
      if (prevCloseRef.current == null) prevCloseRef.current = yVals[0];
      const prevClose = prevCloseRef.current;
      const anchor = priceAnchor ?? prevClose;
      const sMin = anchor * (1 - bufferPct),
            sMax = anchor * (1 + bufferPct);
      const minVal = Math.min(...yVals),
            maxVal = Math.max(...yVals);
      return { yMin: Math.min(sMin, minVal), yMax: Math.max(sMax, maxVal) };
    }
    return { yMin: null, yMax: null };
  }, [baseData, tf, priceAnchor]);

  // price to show in header
  const displayPrice =
    hover.price != null
      ? hover.price
      : tf === "1D" && livePrice != null
      ? livePrice.toFixed(2)
      : staticPrice;

  // nearest data‐point helper
  function nearestPoint(xPix) {
    const chart = chartRef.current;
    if (!chart) return null;
    const xVal = chart.scales.x.getValueForPixel(xPix);
    const ds = baseData.datasets[0].data;
    let best = ds[0],
        bestDt = Math.abs(new Date(best.x).getTime() - xVal);
    for (const p of ds) {
      const dt = Math.abs(new Date(p.x).getTime() - xVal);
      if (dt < bestDt) {
        bestDt = dt;
        best = p;
      }
    }
    return best;
  }

  // mouse event handlers
  const onMouseDown = e => {
    const chart = chartRef.current;
    if (!chart) return;
    const rect = chart.canvas.getBoundingClientRect();
    const xPix = e.clientX - rect.left;

    // clear existing selection
    if (selectStart && !dragging) {
      setSelectStart(null);
      setSelectEnd(null);
      chart.options.plugins.crosshair.hoverX = null;
      chart.update("none");
      return;
    }

    const p = nearestPoint(xPix);
    if (!p) return;
    setSelectStart({
      xValue: new Date(p.x).getTime(),
      price: p.y ?? p.c,
      pixelX: xPix
    });
    setSelectEnd(null);
    setDragging(true);
  };

  const onMouseMove = e => {
    if (!dragging) return;
    const chart = chartRef.current;
    const rect = chart.canvas.getBoundingClientRect();
    const xPix = e.clientX - rect.left;
    const p = nearestPoint(xPix);
    if (!p) return;
    setSelectEnd({
      xValue: new Date(p.x).getTime(),
      price: p.y ?? p.c,
      pixelX: xPix
    });
  };

  const onMouseUp = () => {
    setDragging(false);
    setSelectStart(null);
    setSelectEnd(null);
    const chart = chartRef.current;
    if (chart) {
      chart.options.plugins.crosshair.hoverX = null;
      chart.update("none");
    }
  };

  // build dataset (line with selection logic, or raw candles)
  const mainDataset = useMemo(() => {
    if (type === "candlestick") {
      return baseData.datasets[0];
    }

    const src = baseData.datasets[0];
    const defaultBorder = src.borderColor;
    const defaultPoint = src.pointBackgroundColor || defaultBorder;
    const startTS = selectStart?.xValue;
    const endTS   = selectEnd?.xValue;
    const delta   = (selectEnd?.price ?? 0) - (selectStart?.price ?? 0);

    const ds = {
      label: src.label,
      data: src.data,
      spanGaps: src.spanGaps,
      borderWidth: src.borderWidth,
      tension: src.tension,
      backgroundColor: src.backgroundColor,
      borderColor: src.borderColor,
      pointRadius: src.pointRadius,
      pointHoverRadius: src.pointHoverRadius,
      segment: {
        borderColor: ctx => {
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
          return defaultBorder;
        }
      },
      pointBackgroundColor: ctx => {
        const x = new Date(ctx.parsed.x).getTime();
        if (
          startTS != null &&
          endTS != null &&
          x >= startTS &&
          x <= endTS
        ) {
          return delta >= 0 ? "#0f0" : "#f44";
        }
        return defaultPoint;
      }
    };
    ds.pointBorderColor = ds.pointBackgroundColor;
    return ds;
  }, [baseData, selectStart, selectEnd, type]);

  // annotations
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
    const δ   = selectEnd.price - selectStart.price;
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

  // chart options
  const options = {
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      crosshair: { hoverX: null },
      legend: { display: false },
      tooltip: { enabled: false },
      annotation: { annotations },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
    scales: {
      x: {
        type: "time",
        time: timeScale,
        ticks: tickScale,
        grid: { display: false },
        ...(tf === "1D" && { min: openTime, max: closeTime, bounds: "ticks" }),
      },
      y: {
        ticks: { color: "#999" },
        grid: { display: false },
        ...(tf === "1D" && { min: yMin, max: yMax }),
      },
    },
    onHover: (e, items) => {
      const chart = chartRef.current;
      if (!chart) return;
      if (items.length) {
        const { datasetIndex, index } = items[0];
        const pt = chart.data.datasets[datasetIndex].data[index];
        const xPix = chart.scales.x.getPixelForValue(pt.x);
        chart.options.plugins.crosshair.hoverX = xPix;
        setHover({
          x: xPix,
          time: fmtHover(pt.x),
          price: (pt.y ?? pt.c).toFixed(2)
        });
        chart.update("none");
      } else {
        if (chartRef.current) {
          chartRef.current.options.plugins.crosshair.hoverX = null;
          chartRef.current.update("none");
        }
        setHover({ x: null, time: "", price: null });
      }
    },
    onLeave: () => {
      setDragging(false);
      setHover({ x: null, time: "", price: null });
      setSelectStart(null);
      setSelectEnd(null);
      const chart = chartRef.current;
      if (chart) {
        chart.options.plugins.crosshair.hoverX = null;
        chart.update("none");
      }
    },
  };

  return (
    <section className="tp-chart-section tp-panel">
      {/* header & controls */}
      <div className="tp-chart-section-header">
        <div className="tp-chart-section-sub-header">
          <div>
            <div className="tp-symbol-header">{symbol}</div>
            <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
          </div>
          <span className="tp-price">${displayPrice}</span>
        </div>
        <div className="tp-chart-controls">
          {/* timeframes */}
          <div className="tp-timeframe">
            {Object.keys(TIMEFRAMES)
              .filter(k => k !== "1H")
              .map(k => (
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
          {/* line/candle toggle */}
          <div className="tp-chart-type-buttons">
            {["line","candlestick"].map(t => (
              <button
                key={t}
                className={`tp-chart-type-btn${type===t?" tp-active":""}`}
                onClick={()=>setType(t)}
              >
                {t==="line"?"Line":"Candle"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* the chart */}
      <div
        className="tp-chart-body"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => {
          setDragging(false);
          setHover({ x: null, time: "", price: null });
          setSelectStart(null);
          setSelectEnd(null);
          const chart = chartRef.current;
          if (chart) {
            chart.options.plugins.crosshair.hoverX = null;
            chart.update("none");
          }
        }}
      >
        {hover.x != null && hover.time && (
          <div className="tp-hover-info" style={{ left: hover.x }}>
            {hover.time}
          </div>
        )}
        <Chart
          ref={chartRef}
          type={type}
          data={type === "candlestick" ? baseData : { datasets: [mainDataset] }}
          options={options}
        />
      </div>
    </section>
  );
}
