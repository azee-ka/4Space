// data/generateChartData.js
import { TF_CONFIG, getTickConfig, MAX_TICKS, DEFAULT_TOKENS } from "./chartConfig";

export function generateChartData(tf, type, symbol, tick) {
  const now = Date.now();
  const cfg = TF_CONFIG[tf];
  let labels = [], series = [], openTime = null, closeTime = null;

  if (tf === "1D") {
    const d = new Date();
    openTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 30).getTime();
    closeTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 16, 0).getTime();
    const step = 5 * 60 * 1000, count = Math.floor((closeTime - openTime) / step) + 1;
    labels = Array.from({ length: count }, (_, i) => new Date(openTime + i * step));
    let v = 100 + Math.random() * 50;
    series = labels.map(ts =>
      ts.getTime() <= now ? (v = parseFloat((v * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))) : null
    );
  } else {
    const span = tf === "YTD"
      ? (now - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000
      : cfg.spanDays;
    const start = now - span * 86400000;
    const pts = Math.max(2, Math.round(span / cfg.resolutionDays));
    labels = Array.from({ length: pts }, (_, i) => new Date(start + ((now - start) * i) / (pts - 1)));
    for (let i = 0; i < labels.length; i++) {
      if (i === 0) series.push(100 + Math.random() * 50);
      else {
        const p = series[i - 1];
        series.push(parseFloat((p * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)));
      }
    }
  }

  const clean = series.filter(v => v != null);
  const first = clean[0] || 0, last = clean.at(-1) || first;
  const up = last >= first, color = up ? "#00FF8C" : "#FF6B6B";

  // compute stable Y range
const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
const paddingPercent = 0.05;
const min = +(avg * (1 - paddingPercent)).toFixed(2);
const max = +(avg * (1 + paddingPercent)).toFixed(2);


  let datasets;
  if (type === "line") {
    const pts = labels.map((t, i) => ({ x: t, y: series[i] })).filter(p => p.y != null);
    if (tf === "1D") pts.push({ x: new Date(Math.min(now, closeTime)), y: last });
    datasets = [{
      label: symbol,
      data: pts,
      spanGaps: true,
      borderColor: color,
      backgroundColor: "transparent",
      pointRadius: (ctx) => (ctx.dataIndex === pts.length - 1 && tf === "1D" ? 6 : 0),
      borderWidth: 2,
      tension: 0,
    }];
  } else {
    const ohlc = labels.map((t, i) => {
      const o = series[i] || last;
      const c = o * (1 + (Math.random() - 0.5) * 0.02);
      return {
        x: t,
        o,
        h: Math.max(o, c) * (1 + Math.random() * 0.01),
        l: Math.min(o, c) * (1 - Math.random() * 0.01),
        c,
      };
    });
    datasets = [{
      label: symbol,
      data: ohlc,
      color: { up: "#00FF8C", down: "#FF6B6B", unchanged: "#00FF8C" },
      barThickness: "flex",
      maxBarThickness: 12,
    }];
  }

  const base = getTickConfig(cfg.resolutionDays);
  const unit = cfg.tickUnit || base.unit;
  const stepSize = cfg.tickStep || base.stepSize;
  const fmt = cfg.displayFormats?.[unit] || DEFAULT_TOKENS[unit];

  return {
    data: { datasets },
    price: last.toFixed(2),
    openTime,
    closeTime,
    timeScale: { unit, stepSize, displayFormats: { [unit]: fmt } },
    tickScale: {
      source: tf === "1D" ? "auto" : "data",
      autoSkip: true,
      maxTicksLimit: MAX_TICKS[tf],
      color: "#999999",
    },
    range: { min, max },
  };
}
