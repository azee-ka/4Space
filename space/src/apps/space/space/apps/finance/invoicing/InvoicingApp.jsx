// src/features/space/components/apps/InvoicingApp/InvoicingApp.jsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './InvoicingApp.css';
import {
  FaFileInvoice, FaPlus, FaDownload, FaUpload, FaSearch,
  FaPaperPlane, FaEdit, FaTrash, FaCheckCircle, FaClock,
  FaTimes, FaDollarSign, FaEye, FaCopy
} from 'react-icons/fa';

import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  sendInvoice
} from '../../../../../services/spaceApps/financeServices';

// Mock data
const mockInvoices = [
  { id: '1', number: 'INV-2024-001', client: 'Acme Corp', clientEmail: 'billing@acme.com', amount: 5250.00, status: 'paid', issueDate: '2024-01-01', dueDate: '2024-01-15', paidDate: '2024-01-10', items: 3 },
  { id: '2', number: 'INV-2024-002', client: 'Tech Solutions', clientEmail: 'ap@techsol.com', amount: 3800.00, status: 'pending', issueDate: '2024-01-15', dueDate: '2024-02-01', paidDate: null, items: 2 },
  { id: '3', number: 'INV-2024-003', client: 'Global Industries', clientEmail: 'finance@global.com', amount: 7500.00, status: 'overdue', issueDate: '2023-12-20', dueDate: '2024-01-20', paidDate: null, items: 5 },
  { id: '4', number: 'INV-2024-004', client: 'StartUp Inc', clientEmail: 'pay@startup.io', amount: 2100.00, status: 'draft', issueDate: '2024-01-25', dueDate: '2024-02-15', paidDate: null, items: 1 },
  { id: '5', number: 'INV-2024-005', client: 'Enterprise LLC', clientEmail: 'invoices@enterprise.com', amount: 12500.00, status: 'paid', issueDate: '2024-01-05', dueDate: '2024-01-20', paidDate: '2024-01-18', items: 7 },
  { id: '6', number: 'INV-2024-006', client: 'Digital Agency', clientEmail: 'accounts@digital.com', amount: 4200.00, status: 'pending', issueDate: '2024-01-20', dueDate: '2024-02-05', paidDate: null, items: 3 },
];

const mockStats = {
  total_revenue: 125340.50,
  outstanding: 28450.00,
  overdue_amount: 8250.00,
  paid_count: 32,
  pending_count: 8,
  overdue_count: 3,
  draft_count: 2,
  average_invoice: 2785.50
};

const InvoicingApp = () => {
  const { spaceId, widgetId } = useParams();
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const invoices = mockInvoices;
  const stats = mockStats;

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesView = activeView === 'all' || inv.status === activeView;
    const matchesSearch = inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inv.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesView && matchesSearch;
  });

  return (
    <div className="invoicing-app">
      {/* Header */}
      <div className="invoicing-app-header">
        <div className="invoicing-app-title">
          <FaFileInvoice />
          <h1>Invoicing</h1>
        </div>
        <div className="invoicing-app-actions">
          <button className="header-action-btn">
            <FaDownload />
            Export
          </button>
          <button className="header-action-btn">
            <FaUpload />
            Import
          </button>
          <button
            className="header-action-btn primary"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="invoicing-stats-overview">
        <div className="stat-overview-card large">
          <div className="stat-overview-label">Total Revenue</div>
          <div className="stat-overview-value">
            ${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-overview-subtext">
            {stats.paid_count + stats.pending_count} invoices
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon pending">
            <FaClock />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Outstanding</div>
            <div className="stat-overview-value">
              ${stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="stat-overview-subtext">{stats.pending_count} pending</div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon overdue">
            <FaTimes />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Overdue</div>
            <div className="stat-overview-value">
              ${stats.overdue_amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="stat-overview-subtext">{stats.overdue_count} invoices</div>
          </div>
        </div>

        <div className="stat-overview-card">
          <div className="stat-overview-icon paid">
            <FaCheckCircle />
          </div>
          <div className="stat-overview-content">
            <div className="stat-overview-label">Paid</div>
            <div className="stat-overview-value">{stats.paid_count}</div>
            <div className="stat-overview-subtext">invoices</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="invoicing-app-nav">
        <button
          className={`nav-btn ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          All Invoices
          <span className="nav-count">{invoices.length}</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveView('pending')}
        >
          <FaClock />
          Pending
          <span className="nav-count">{stats.pending_count}</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveView('overdue')}
        >
          <FaTimes />
          Overdue
          <span className="nav-count">{stats.overdue_count}</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveView('paid')}
        >
          <FaCheckCircle />
          Paid
          <span className="nav-count">{stats.paid_count}</span>
        </button>
        <button
          className={`nav-btn ${activeView === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveView('draft')}
        >
          Draft
          <span className="nav-count">{stats.draft_count}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="invoicing-app-content">
        <div className="invoicing-toolbar">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <InvoicesTable
          invoices={filteredInvoices}
          onSelectInvoice={setSelectedInvoice}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

// ============================================
// INVOICES TABLE
// ============================================

const InvoicesTable = ({ invoices, onSelectInvoice }) => {
  if (invoices.length === 0) {
    return (
      <div className="invoicing-empty">
        <div className="empty-state-icon">
          <FaFileInvoice />
        </div>
        <h3>No invoices found</h3>
        <p>Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="invoices-table-wrapper">
      <table className="invoices-table-full">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice.id}>
              <td className="invoice-number-cell">
                <strong>{invoice.number}</strong>
              </td>
              <td className="invoice-client-cell">
                <div className="client-info">
                  <strong>{invoice.client}</strong>
                  <span>{invoice.clientEmail}</span>
                </div>
              </td>
              <td className="invoice-date-cell">
                {new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="invoice-date-cell">
                {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="invoice-amount-cell">
                <strong>${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </td>
              <td>
                <span className={`invoice-status-badge ${invoice.status}`}>
                  {invoice.status === 'paid' && <FaCheckCircle />}
                  {invoice.status === 'pending' && <FaClock />}
                  {invoice.status === 'overdue' && <FaTimes />}
                  {invoice.status}
                </span>
              </td>
              <td className="invoice-items-cell">{invoice.items}</td>
              <td>
                <div className="table-actions">
                  <button className="icon-btn" title="View" onClick={() => onSelectInvoice(invoice)}>
                    <FaEye />
                  </button>
                  <button className="icon-btn" title="Send">
                    <FaPaperPlane />
                  </button>
                  <button className="icon-btn" title="Download">
                    <FaDownload />
                  </button>
                  <button className="icon-btn" title="Duplicate">
                    <FaCopy />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// MODALS
// ============================================

const CreateInvoiceModal = ({ onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Create Invoice</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <div className="form-grid">
          <div className="form-field">
            <label>Client</label>
            <select>
              <option>Select client...</option>
              <option>Acme Corp</option>
              <option>Tech Solutions</option>
              <option>Global Industries</option>
            </select>
          </div>
          <div className="form-field">
            <label>Invoice Number</label>
            <input type="text" placeholder="INV-2024-007" />
          </div>
          <div className="form-field">
            <label>Issue Date</label>
            <input type="date" />
          </div>
          <div className="form-field">
            <label>Due Date</label>
            <input type="date" />
          </div>
        </div>
        <div className="form-field">
          <label>Items</label>
          <div className="invoice-items-list">
            <div className="invoice-item-row">
              <input type="text" placeholder="Description" />
              <input type="number" placeholder="Qty" style={{width: '80px'}} />
              <input type="number" placeholder="Rate" style={{width: '100px'}} />
              <input type="number" placeholder="Amount" style={{width: '100px'}} disabled />
            </div>
          </div>
          <button className="add-item-btn">
            <FaPlus /> Add Item
          </button>
        </div>
        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary">Create Invoice</button>
        </div>
      </div>
    </div>
  </div>
);

const InvoiceDetailModal = ({ invoice, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{invoice.number}</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <div className="invoice-detail-grid">
          <div className="detail-row">
            <span className="detail-label">Client:</span>
            <span className="detail-value">{invoice.client}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{invoice.clientEmail}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`invoice-status-badge ${invoice.status}`}>{invoice.status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Issue Date:</span>
            <span className="detail-value">{new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Due Date:</span>
            <span className="detail-value">{new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn">
            <FaPaperPlane /> Send Invoice
          </button>
          <button className="modal-btn">
            <FaDownload /> Download PDF
          </button>
          <button className="modal-btn danger">
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default InvoicingApp;