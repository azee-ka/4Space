// src/features/space/components/apps/InvoicingApp/InvoicingWidget.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './InvoicingWidget.css';
import { 
  FaFileInvoice, FaPlus, FaClock, FaCheckCircle, FaTimes,
  FaDollarSign, FaExternalLinkAlt, FaPaperPlane, FaDownload
} from 'react-icons/fa';

import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  sendInvoice
} from '../../../../../../../../services/spaceApps/financeServices';

// Mock data
const mockInvoices = [
  { id: '1', number: 'INV-2024-001', client: 'Acme Corp', amount: 5250.00, status: 'paid', dueDate: '2024-01-15', paidDate: '2024-01-10' },
  { id: '2', number: 'INV-2024-002', client: 'Tech Solutions', amount: 3800.00, status: 'pending', dueDate: '2024-02-01', paidDate: null },
  { id: '3', number: 'INV-2024-003', client: 'Global Industries', amount: 7500.00, status: 'overdue', dueDate: '2024-01-20', paidDate: null },
  { id: '4', number: 'INV-2024-004', client: 'StartUp Inc', amount: 2100.00, status: 'draft', dueDate: '2024-02-15', paidDate: null },
];

const mockStats = {
  total_invoices: 45,
  total_revenue: 125340.50,
  outstanding: 28450.00,
  overdue: 8250.00,
  paid_count: 32,
  pending_count: 8,
  overdue_count: 3,
  draft_count: 2
};

// ============================================
// COMPACT MODE
// ============================================

const InvoicingCompact = ({ widget, spaceId }) => {
  const stats = mockStats;

  return (
    <div className="invoicing-compact">
      <div className="invoicing-revenue-card">
        <div className="revenue-header">
          <span className="revenue-label">Total Revenue</span>
          <FaFileInvoice />
        </div>
        <div className="revenue-amount">
          ${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="revenue-subtext">
          {stats.total_invoices} invoices
        </div>
      </div>

      <div className="invoicing-stats-grid">
        <div className="invoice-stat-card pending">
          <FaClock />
          <div className="stat-content">
            <div className="stat-value">{stats.pending_count}</div>
            <div className="stat-label">Pending</div>
            <div className="stat-amount">${stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
          </div>
        </div>
        <div className="invoice-stat-card overdue">
          <FaTimes />
          <div className="stat-content">
            <div className="stat-value">{stats.overdue_count}</div>
            <div className="stat-label">Overdue</div>
            <div className="stat-amount">${stats.overdue.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      <div className="compact-invoice-list">
        {mockInvoices.slice(0, 3).map(invoice => (
          <div key={invoice.id} className="compact-invoice-item">
            <div className="invoice-info">
              <div className="invoice-number">{invoice.number}</div>
              <div className="invoice-client">{invoice.client}</div>
            </div>
            <div className="invoice-details">
              <div className="invoice-amount">${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
              <span className={`invoice-status-badge ${invoice.status}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="compact-view-all">
        <span>Click to view all invoices</span>
      </div>
    </div>
  );
};

// ============================================
// MODAL MODE
// ============================================

const InvoicingModal = ({ widget, spaceId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const invoices = mockInvoices;
  const stats = mockStats;

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'all') return true;
    return inv.status === activeTab;
  });

  const handleOpenApp = () => {
    window.open(`/space/${spaceId}/invoicing/${widget.id}`, '_blank');
  };

  return (
    <div className="invoicing-modal-content">
      <div className="invoicing-sidebar">
        <div className="sidebar-header">
          <h3>Invoicing</h3>
          <button className="add-invoice-btn" title="Create Invoice">
            <FaPlus />
          </button>
        </div>

        <div className="sidebar-stats-cards">
          <div className="sidebar-stat-card large">
            <div className="sidebar-stat-icon">
              <FaDollarSign />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">
                ${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <div className="sidebar-stat-label">Total Revenue</div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon pending">
              <FaClock />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats.pending_count}</div>
              <div className="sidebar-stat-label">Pending</div>
              <div className="sidebar-stat-subtext">
                ${stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon overdue">
              <FaTimes />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats.overdue_count}</div>
              <div className="sidebar-stat-label">Overdue</div>
              <div className="sidebar-stat-subtext">
                ${stats.overdue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon paid">
              <FaCheckCircle />
            </div>
            <div className="sidebar-stat-content">
              <div className="sidebar-stat-value">{stats.paid_count}</div>
              <div className="sidebar-stat-label">Paid</div>
            </div>
          </div>
        </div>

        <button className="sidebar-open-app-btn" onClick={handleOpenApp}>
          <FaExternalLinkAlt />
          Open Full Invoicing App
        </button>
      </div>

      <div className="invoicing-main-content">
        <div className="invoicing-tabs-nav">
          <button
            className={`invoicing-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
            <span className="tab-count">{stats.total_invoices}</span>
          </button>
          <button
            className={`invoicing-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FaClock />
            Pending
            <span className="tab-count">{stats.pending_count}</span>
          </button>
          <button
            className={`invoicing-tab-btn ${activeTab === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            <FaTimes />
            Overdue
            <span className="tab-count">{stats.overdue_count}</span>
          </button>
          <button
            className={`invoicing-tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            <FaCheckCircle />
            Paid
            <span className="tab-count">{stats.paid_count}</span>
          </button>
          <button
            className={`invoicing-tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            Draft
            <span className="tab-count">{stats.draft_count}</span>
          </button>
        </div>

        <div className="invoicing-tab-content">
          <InvoicesTable 
            invoices={filteredInvoices}
            onSelectInvoice={setSelectedInvoice}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// TABLE COMPONENT
// ============================================

const InvoicesTable = ({ invoices, onSelectInvoice }) => {
  if (invoices.length === 0) {
    return (
      <div className="tab-empty">
        <div className="empty-state-icon">
          <FaFileInvoice />
        </div>
        <h3>No invoices found</h3>
        <p>Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="invoices-table-container">
      <table className="invoices-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Paid Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice.id} onClick={() => onSelectInvoice(invoice)}>
              <td className="invoice-number-cell">
                <strong>{invoice.number}</strong>
              </td>
              <td className="invoice-client-cell">{invoice.client}</td>
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
              <td className="invoice-date-cell">
                {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="invoice-date-cell">
                {invoice.paidDate 
                  ? new Date(invoice.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'
                }
              </td>
              <td>
                <div className="invoice-actions">
                  <button className="invoice-action-btn" title="Send">
                    <FaPaperPlane />
                  </button>
                  <button className="invoice-action-btn" title="Download">
                    <FaDownload />
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
// MAIN EXPORT
// ============================================

const InvoicingWidget = ({ widget, mode = 'full', isCompact, spaceId }) => {
  if (mode === 'compact' || isCompact) {
    return <InvoicingCompact widget={widget} spaceId={spaceId} />;
  }
  
  return <InvoicingModal widget={widget} spaceId={spaceId} />;
};

export default InvoicingWidget;