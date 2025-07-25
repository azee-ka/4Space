// src/utils/crosshairPlugin.js

const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart) {
    const cfg = chart.options.plugins.crosshair || {};
    const { hoverX, selection } = cfg;
    const {
      ctx,
      chartArea: { top, bottom },
    } = chart;

    ctx.save();

    // 1️⃣ hover line (always grey)
    if (typeof hoverX === "number") {
      ctx.beginPath();
      ctx.moveTo(hoverX, top);
      ctx.lineTo(hoverX, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#888";
      ctx.stroke();
    }

    // 2️⃣ interval lines (start & end) in selection.color
    if (selection?.startX != null && selection.color) {
      ctx.beginPath();
      ctx.moveTo(selection.startX, top);
      ctx.lineTo(selection.startX, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = selection.color;
      ctx.stroke();
    }
    if (selection?.endX != null && selection.color) {
      ctx.beginPath();
      ctx.moveTo(selection.endX, top);
      ctx.lineTo(selection.endX, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = selection.color;
      ctx.stroke();
    }

    ctx.restore();
  },
};

export default crosshairPlugin;