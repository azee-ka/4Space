import apiCall from "../utils/api";

// ─── Chart Data ───────────────────────────────────────────────────────────────

/**
 * Fetch historical chart bars for a symbol & timeframe.
 * @param {string} symbol e.g. "AAPL"
 * @param {string} tf     e.g. "1D","1W","1M",…,"MAX"
 * @returns Array<{x:string,y:number}>
 */
export const fetchChartData = async (symbol, tf) => {
  const res = await apiCall(`chart-data/?symbol=${symbol}&tf=${tf}`, "GET");
  // res.data.datasets[0].data == [{x,y},…]
  return res.data.datasets[0].data;
};

// ─── Watchlists ──────────────────────────────────────────────────────────────

/**
 * List the current user’s watchlists.
 * @returns Array<{id, name, items:[{symbol,order}]}>
 */
export const fetchWatchlists = async () => {
  const res = await apiCall("watchlists/", "GET");
  return res.data;
};

/** Create a new watchlist */
export const createWatchlist = async ({ name, symbols }) => {
  const items = symbols.map((sym, idx) => ({ symbol: sym, order: idx }));
  const res = await apiCall("watchlists/", "POST", { name, items });
  return res.data;
};

/** Update an existing watchlist */
export const updateWatchlist = async ({ id, name, symbols }) => {
  const items = symbols.map((sym, idx) => ({ symbol: sym, order: idx }));
  const res = await apiCall(`watchlists/${id}/`, "PUT", { name, items });
  return res.data;
};

/** Delete a watchlist */
export const deleteWatchlist = async (id) => {
  await apiCall(`watchlists/${id}/`, "DELETE");
};
