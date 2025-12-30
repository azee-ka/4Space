// services/spaceApps/financeServices.js
import apiCall from "../../utils/api";

// ============================================================================
// PORTFOLIO MANAGER
// ============================================================================

/**
 * Fetch all portfolio accounts for a widget
 */
export const fetchPortfolioAccounts = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/accounts/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch portfolio statistics
 */
export const fetchPortfolioStats = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/stats/`,
    'GET'
  );
  return res.data;
};

/**
 * Fetch portfolio holdings
 */
export const fetchPortfolioHoldings = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/holdings/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch portfolio transactions
 */
export const fetchPortfolioTransactions = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/transactions/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Create a portfolio account
 */
export const createPortfolioAccount = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/accounts/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Create a portfolio transaction
 */
export const createPortfolioTransaction = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/transactions/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Update a portfolio holding
 */
export const updatePortfolioHolding = async (spaceId, widgetId, holdingId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/holdings/${holdingId}/`,
    'PATCH',
    data
  );
  return res.data;
};

/**
 * Sync portfolio prices (refresh current prices)
 */
export const syncPortfolioPrices = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/sync-prices/`,
    'POST'
  );
  return res.data;
};

/**
 * Delete a portfolio account
 */
export const deletePortfolioAccount = async (spaceId, widgetId, accountId) => {
  await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/portfolio/accounts/${accountId}/`,
    'DELETE'
  );
};

// ============================================================================
// EXPENSES MANAGER
// ============================================================================

/**
 * Fetch expenses
 */
export const fetchExpenses = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.category) queryParams.append('category', params.category);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch a single expense by ID
 */
export const fetchExpense = async (spaceId, widgetId, expenseId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${expenseId}/`,
    'GET'
  );
  return res.data;
};

/**
 * Fetch expense statistics
 */
export const fetchExpenseStats = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/stats/`,
    'GET'
  );
  return res.data;
};

/**
 * Fetch expense categories
 */
export const fetchExpenseCategories = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/categories/`,
    'GET'
  );
  return res.data || [];
};

/**
 * Create an expense
 */
export const createExpense = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Update an expense
 */
export const updateExpense = async (spaceId, widgetId, expenseId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${expenseId}/`,
    'PATCH',
    data
  );
  return res.data;
};

/**
 * Delete an expense
 */
export const deleteExpense = async (spaceId, widgetId, expenseId) => {
  await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${expenseId}/`,
    'DELETE'
  );
};

/**
 * Approve an expense
 */
export const approveExpense = async (spaceId, widgetId, expenseId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${expenseId}/approve/`,
    'POST'
  );
  return res.data;
};

/**
 * Reject an expense
 */
export const rejectExpense = async (spaceId, widgetId, expenseId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${expenseId}/reject/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Bulk approve expenses
 */
export const bulkApproveExpenses = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/bulk-approve/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Upload expense receipt
 */
export const uploadExpenseReceipt = async (spaceId, widgetId, expenseId, file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/${expenseId}/upload-receipt/`,
    'POST',
    formData,
    'multipart/form-data'
  );
  return res.data;
};

/**
 * Create expense category
 */
export const createExpenseCategory = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/expenses/categories/`,
    'POST',
    data
  );
  return res.data;
};

// ============================================================================
// BUDGET MANAGER
// ============================================================================

/**
 * Fetch budgets
 */
export const fetchBudgets = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch a single budget by ID
 */
export const fetchBudget = async (spaceId, widgetId, budgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/${budgetId}/`,
    'GET'
  );
  return res.data;
};

/**
 * Fetch budget statistics
 */
export const fetchBudgetStats = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/stats/`,
    'GET'
  );
  return res.data;
};

/**
 * Create a budget
 */
export const createBudget = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Update a budget
 */
export const updateBudget = async (spaceId, widgetId, budgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/${budgetId}/`,
    'PATCH',
    data
  );
  return res.data;
};

/**
 * Delete a budget
 */
export const deleteBudget = async (spaceId, widgetId, budgetId) => {
  await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/${budgetId}/`,
    'DELETE'
  );
};

/**
 * Create budget line item
 */
export const createBudgetLineItem = async (spaceId, widgetId, budgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/${budgetId}/items/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Fetch budget line items
 */
export const fetchBudgetLineItems = async (spaceId, widgetId, budgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/budgets/${budgetId}/items/`,
    'GET'
  );
  return res.data || [];
};

// ============================================================================
// CRYPTO TRACKER
// ============================================================================

/**
 * Fetch crypto holdings
 */
export const fetchCryptoHoldings = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/crypto/holdings/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Fetch crypto statistics
 */
export const fetchCryptoStats = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/crypto/stats/`,
    'GET'
  );
  return res.data;
};

/**
 * Create crypto transaction
 */
export const createCryptoTransaction = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/crypto/transactions/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Sync crypto prices
 */
export const syncCryptoPrices = async (spaceId, widgetId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/crypto/sync-prices/`,
    'POST'
  );
  return res.data;
};

// ============================================================================
// INVOICE & ACCOUNTING
// ============================================================================

/**
 * Fetch invoices
 */
export const fetchInvoices = async (spaceId, widgetId, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const query = queryParams.toString();
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/invoices/${query ? `?${query}` : ''}`;
  
  const res = await apiCall(url, 'GET');
  return res.data || [];
};

/**
 * Create invoice
 */
export const createInvoice = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/invoices/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Update invoice
 */
export const updateInvoice = async (spaceId, widgetId, invoiceId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/invoices/${invoiceId}/`,
    'PATCH',
    data
  );
  return res.data;
};

/**
 * Send invoice
 */
export const sendInvoice = async (spaceId, widgetId, invoiceId) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/invoices/${invoiceId}/send/`,
    'POST'
  );
  return res.data;
};

// ============================================================================
// RISK CALCULATOR
// ============================================================================

/**
 * Calculate position size
 */
export const calculatePositionSize = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/risk/calculate-position/`,
    'POST',
    data
  );
  return res.data;
};

/**
 * Calculate risk/reward ratio
 */
export const calculateRiskReward = async (spaceId, widgetId, data) => {
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/risk/calculate-risk-reward/`,
    'POST',
    data
  );
  return res.data;
};

// ============================================================================
// SHARED UTILITIES
// ============================================================================

/**
 * Export data to CSV
 */
export const exportFinanceData = async (spaceId, widgetId, dataType, params = {}) => {
  const queryParams = new URLSearchParams(params);
  queryParams.append('format', 'csv');
  const query = queryParams.toString();
  
  const url = `space/space/finance/${spaceId}/widgets/${widgetId}/${dataType}/export/?${query}`;
  
  const res = await apiCall(url, 'GET', null, null, { responseType: 'blob' });
  return res.data;
};

/**
 * Import data from CSV
 */
export const importFinanceData = async (spaceId, widgetId, dataType, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await apiCall(
    `space/space/finance/${spaceId}/widgets/${widgetId}/${dataType}/import/`,
    'POST',
    formData,
    'multipart/form-data'
  );
  return res.data;
};