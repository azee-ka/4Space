// src/components/TimeSeriesChart.jsx
import React, { useRef, useMemo, useState, useEffect } from "react";
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
import { generateChartData } from "./generateChartData";
import { TIMEFRAMES } from "./chartConfig";

// register Chart.js components & plugins once
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

export default function TimeSeriesChart({
  symbol,
  timeframe = "1D",        // e.g. "1D", "1W", etc.
  chartType = "line",      // "line" or "candlestick"
  sparkline = false,       // true → no controls / axes / tooltips
  onTimeframeChange,       // (newTf) => …
  onChartTypeChange,       // (newType) => …
}) {
  const chartRef = useRef(null);
  const [tf, setTf]     = useState(timeframe);
  const [type, setType] = useState(chartType);

  // keep internal state in sync if parent props change
  useEffect(() => setTf(timeframe), [timeframe]);
  useEffect(() => setType(chartType), [chartType]);

  // generate data & scales
  const { data: baseData, openTime, closeTime, timeScale, tickScale } =
    useMemo(() => generateChartData(tf, type, symbol, 0), [symbol, tf, type]);

  // if sparkline, recolor & strip points
  const dataset = useMemo(() => {
    const src = baseData.datasets[0];
    if (!sparkline) return src;

    const ys = src.data.filter(p => p.y != null).map(p => p.y);
    const up = ys[ys.length - 1] >= ys[0];
    return {
      ...src,
      borderColor: up ? "#00FF8C" : "#FF6B6B",
      backgroundColor: "transparent",
      pointRadius: 0,
      borderWidth: 1,
      tension: 0.3,
    };
  }, [baseData, sparkline]);

  const data = useMemo(() => ({ datasets: [dataset] }), [dataset]);

  // chart options
  const options = useMemo(() => {
    if (sparkline) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { display: false }, y: { display: false } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      };
    }

    const annotations = {}; // re-inject your prevClose/selection lines here if needed

    return {
      responsive: true,
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
          bounds: "ticks",
          min: openTime,
          max: closeTime,
        },
        y: { grid: { display: false } },
      },
    };
  }, [sparkline, openTime, closeTime, timeScale, tickScale]);

  return (
    <>
      {!sparkline && (
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
                    onTimeframeChange?.(k);
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
                onClick={() => {
                  setType(t);
                  onChartTypeChange?.(t);
                }}
              >
                {t === "line" ? "Line" : "Candle"}
              </button>
            ))}
          </div>
        </div>
      )}

      <Chart
        ref={chartRef}
        type={type}
        data={data}
        options={options}
      />
    </>
  );
}
