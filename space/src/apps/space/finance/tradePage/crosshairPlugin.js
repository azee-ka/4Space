// plugins/crosshairPlugin.js
const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart) {
    const x = chart.options.plugins.crosshair?.hoverX;
    if (typeof x === "number") {
      const {
        ctx,
        chartArea: { top, bottom },
      } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#888";
      ctx.stroke();
      ctx.restore();
    }
  },
};

export default crosshairPlugin;
