// components/ChartSection.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Chart } from "react-chartjs-2";
import crosshairPlugin from "./crosshairPlugin";
import { TIMEFRAMES, TF_CONFIG, COMPANY_NAMES } from "./chartConfig";
import { generateChartData } from "./generateChartData";

function ChartSection({ symbol }) {
  const chartRef = useRef(null);
  const [tf, setTf] = useState("1D");
  const [type, setType] = useState("line");
  const [hover, setHover] = useState({ x: null, time: "", price: null });
  const [livePrice, setLivePrice] = useState(null);
  const [tick, setTick] = useState(0);
  const dataRef = useRef({});

  // Live price ticker
  useEffect(() => {
    if (tf !== "1D") return;
    setLivePrice(p => p ?? parseFloat(dataRef.current.price ?? 100));
    const id = setInterval(() => {
      setLivePrice(p => {
        const base = p ?? 100;
        return parseFloat((base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2));
      });
    }, 3000);
    return () => clearInterval(id);
  }, [tf, symbol]);

  // Full chart rebuild tick
  useEffect(() => {
    if (tf !== "1D") return;
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [tf, symbol]);

  const { data, price, openTime, closeTime, timeScale, tickScale } = useMemo(() => {
    const result = generateChartData(tf, type, symbol, tick);
    dataRef.current.price = result.price;
    return result;
  }, [tf, type, symbol, tick]);

  useEffect(() => {
    if (tf !== "1D") return;
    const chart = chartRef.current;
    if (chart && chart.data.datasets[0].data.length) {
      const ds = chart.data.datasets[0].data;
      ds[ds.length - 1] = { x: new Date(), y: livePrice };
      chart.update("none");
    }
  }, [livePrice]);

  const fmtHover = dt => format(dt, "MMM d, h:mm a");

  const options = {
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      crosshair: { hoverX: null },
      legend: { display: false },
      tooltip: { enabled: false },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
    scales: {
      x: {
        type: "time",
        time: timeScale,
        ticks: tickScale,
        grid: { color: "#444" },
        ...(tf === "1D" ? { min: openTime, max: closeTime, bounds: "ticks" } : {}),
      },
      y: {
        ticks: { color: "#999" },
        grid: { color: "#444" },
      },
    },
    onHover: (e, items) => {
      const chart = chartRef.current;
      if (!chart) return;
      if (items.length) {
        const idx = items[0].index;
        const pt = data.datasets[0].data[idx];
        const xPix = chart.scales.x.getPixelForValue(pt.x);
        chart.options.plugins.crosshair.hoverX = xPix;
        setHover({ x: xPix, time: fmtHover(pt.x), price: pt.y.toFixed(2) });
        chart.update();
      } else {
        chart.options.plugins.crosshair.hoverX = null;
        setHover({ x: null, time: "", price: null });
        chart.update();
      }
    },
    onLeave: () => {
      const chart = chartRef.current;
      if (chart) {
        chart.options.plugins.crosshair.hoverX = null;
        chart.update();
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
            <div className="tp-company-name">{COMPANY_NAMES[symbol]}</div>
          </div>
          <span className="tp-price">
            ${hover.price ?? (tf === "1D" && livePrice != null ? livePrice.toFixed(2) : price)}
          </span>
        </div>
        <div className="tp-chart-controls">
          <div className="tp-timeframe">
            {Object.keys(TIMEFRAMES)
              .filter(k => k !== "1H")
              .map(k => (
                <button key={k} className={tf === k ? "tp-active" : ""} onClick={() => setTf(k)}>
                  {k}
                </button>
              ))}
          </div>
          <div className="tp-chart-type-buttons">
            {["line", "candlestick"].map(t => (
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
        onMouseLeave={() => {
          const chart = chartRef.current;
          if (chart) {
            chart.options.plugins.crosshair.hoverX = null;
            chart.update();
          }
          setHover({ x: null, time: "", price: null });
        }}
      >
        {hover.x != null && hover.time && (
          <div className="tp-hover-info" style={{ left: hover.x }}>
            {hover.time}
          </div>
        )}
        <Chart ref={chartRef} type={type} data={data} options={options} />
      </div>
    </section>
  );
}

export default ChartSection;
