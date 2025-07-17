// components/ChartSection.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Tooltip,
  Legend,
  crosshairPlugin,
  annotationPlugin
);

export default function ChartSection({ symbol }) {
  const chartRef = useRef(null);
  const prevCloseRef = useRef(null);   // store fixed prev-close
  const [tf, setTf] = useState("1D");
  const [type, setType] = useState("line");
  const [hover, setHover] = useState({ x: null, time: "", price: null });
  const [livePrice, setLivePrice] = useState(null);
  const [tick, setTick] = useState(0);
  const dataRef = useRef({});
  const [priceAnchor, setPriceAnchor] = useState(null);

  // 1D: live-price polling
  useEffect(() => {
    if (tf !== "1D") return;
    setLivePrice(prev => prev ?? parseFloat(dataRef.current.price ?? 100));
    const id = setInterval(() => {
      setLivePrice(prev =>
        parseFloat(((prev ?? 100) * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
      );
    }, 3000);
    return () => clearInterval(id);
  }, [tf, symbol]);

  // 1D: re-anchor only on ±5% drift
  const bufferPct = 0.05;
  useEffect(() => {
    if (tf !== "1D" || livePrice == null) return;
    if (priceAnchor == null) {
      setPriceAnchor(livePrice);
    } else {
      const diff = (livePrice - priceAnchor) / priceAnchor;
      if (Math.abs(diff) >= bufferPct) setPriceAnchor(livePrice);
    }
  }, [livePrice, tf, priceAnchor]);

  // 1D: refresh static data every 5m
  useEffect(() => {
    if (tf !== "1D") return;
    const id = setInterval(() => setTick(t => t + 1), 300000);
    return () => clearInterval(id);
  }, [tf, symbol]);

  // generate base chart data for all timeframes
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

  // patch livePrice into last point for 1D
  useEffect(() => {
    if (tf !== "1D") return;
    const chart = chartRef.current;
    if (!chart?.data.datasets[0].data.length) return;
    const pts = chart.data.datasets[0].data;
    pts[pts.length - 1] = { x: Date.now(), y: livePrice };
    chart.update("none");
  }, [livePrice, tf]);

  const fmtHover = dt => format(dt, "MMM d, h:mm a");

  // compute y-axis bounds and capture prev-close
  const { yMin, yMax } = useMemo(() => {
    const pts = baseData.datasets[0].data;
    const yVals = pts.map(p => p.y ?? p.c).filter(v => v != null);
    const minY = Math.min(...yVals), maxY = Math.max(...yVals);

    if (tf === "1D") {
      if (prevCloseRef.current == null) {
        prevCloseRef.current = yVals[0]; // store first point once
      }
      const prevClose = prevCloseRef.current;
      const anchor = priceAnchor ?? prevClose;
      const suggestedMin = anchor * (1 - bufferPct);
      const suggestedMax = anchor * (1 + bufferPct);
      return {
        yMin: Math.min(suggestedMin, minY),
        yMax: Math.max(suggestedMax, maxY),
      };
    }
    return { yMin: null, yMax: null };
  }, [baseData, tf, priceAnchor]);

  // choose which price to display
  const displayPrice =
    hover.price != null
      ? hover.price
      : tf === "1D" && livePrice != null
      ? livePrice.toFixed(2)
      : staticPrice;

  const options = {
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      crosshair: { hoverX: null },
      legend: { display: false },
      tooltip: { enabled: false },
      annotation: {
        annotations:
          tf === "1D" && prevCloseRef.current != null
            ? {
                prevCloseLine: {
                  type: "line",
                  yMin: prevCloseRef.current,
                  yMax: prevCloseRef.current,
                  xScaleID: "x",
                  borderColor: "#888",
                  borderDash: [4, 4],
                  borderWidth: 1,
                  label: { enabled: false },
                },
              }
            : {},
      },
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
        const pt = baseData.datasets[datasetIndex].data[index];
        const xPix = chart.scales.x.getPixelForValue(pt.x);
        chart.options.plugins.crosshair.hoverX = xPix;
        setHover({
          x: xPix,
          time: fmtHover(pt.x),
          price: (pt.y ?? pt.c).toFixed(2),
        });
        chart.update("none");
      } else {
        chart.options.plugins.crosshair.hoverX = null;
        setHover({ x: null, time: "", price: null });
        chart.update("none");
      }
    },
    onLeave: () => {
      const chart = chartRef.current;
      if (chart) {
        chart.options.plugins.crosshair.hoverX = null;
        chart.update("none");
      }
      setHover({ x: null, time: "", price: null });
    },
  };

  return (
    <section className="tp-chart-section tp-panel">
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
              .filter(k => k !== "1H")
              .map(k => (
                <button
                  key={k}
                  className={tf === k ? "tp-active" : ""}
                  onClick={() => {
                    setTf(k);
                    setPriceAnchor(null);
                  }}
                >
                  {k}
                </button>
              ))}
          </div>
          <div className="tp-chart-type-buttons">
            {["line", "candlestick"].map(t => (
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
      <div
        className="tp-chart-body"
        onMouseLeave={() => {
          const chart = chartRef.current;
          if (chart) {
            chart.options.plugins.crosshair.hoverX = null;
            chart.update("none");
          }
          setHover({ x: null, time: "", price: null });
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
          data={{ datasets: baseData.datasets }}
          options={options}
        />
      </div>
    </section>
  );
}
