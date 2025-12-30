// spaceTemplates.js - Space Templates Registry
// Integrated with widgetRegistry for dynamic widget loading

import {
  FaChartLine, FaBuilding, FaTruck, FaBullhorn, FaUserFriends,
  FaPalette, FaCode, FaDumbbell, FaGraduationCap, FaFolder,
  FaFlask, FaCogs, FaHospital, FaIndustry, FaGavel,
  FaHome, FaMicroscope, FaChartBar, FaComments, FaHeart,
  FaCalculator, FaBrain, FaTasks, FaShoppingCart, FaCamera, FaBriefcase
} from 'react-icons/fa';

import { WIDGET_REGISTRY } from './widgetRegistry';

// Helper to get widgets by category from registry
const getWidgetsByCategory = (category) => 
  WIDGET_REGISTRY.filter(w => w.category === category).map(w => w.id);

// Helper to get specific widget IDs
const getWidgetIds = (...ids) => ids;

export const SPACE_TEMPLATES = [
  // FINANCE & TRADING - Complete trading workspace
  {
    id: 'trading-desk',
    name: 'Trading Desk Pro',
    icon: FaChartLine,
    description: 'Professional trading workspace with real-time charts, portfolio management, and risk analysis',
    type: 'Finance',
    accentColor: '#10b981',
    definition: 'Trading command center',
    widgets: getWidgetIds('trading-terminal', 'market-scanner', 'portfolio-manager', 'quant-analyzer', 
                          'options-analyzer', 'crypto-tracker', 'forex-trader', 'risk-calc', 
                          'econ-calendar', 'dividends', 'fin-modeling')
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance Hub',
    icon: FaCalculator,
    description: 'Manage your personal finances, budgets, investments, and financial planning',
    type: 'Finance',
    accentColor: '#10b981',
    definition: 'Financial planning hub',
    widgets: getWidgetIds('budget-pro', 'expenses', 'invoicing', 'retirement', 'credit', 
                          'loan-calc', 'cashflow', 'tax-planner', 'portfolio-manager')
  },

  // ENTERPRISE & BUSINESS - Complete business platform
  {
    id: 'enterprise-ops',
    name: 'Enterprise Operations',
    icon: FaBuilding,
    description: 'Complete business management platform with CRM, project management, and business intelligence',
    type: 'Enterprise',
    accentColor: '#6366f1',
    definition: 'Business operations hub',
    widgets: getWidgetIds('crm', 'erp', 'ppm', 'workflow', 'helpdesk', 'bi', 'dms', 
                          'knowledge', 'contracts', 'vendors', 'assets', 'compliance', 
                          'risk-mgmt', 'strategy')
  },
  {
    id: 'startup-hub',
    name: 'Startup Hub',
    icon: FaBrain,
    description: 'Everything a startup needs to launch and grow - from planning to execution',
    type: 'Enterprise',
    accentColor: '#8b5cf6',
    definition: 'Startup command center',
    widgets: getWidgetIds('crm', 'ppm', 'knowledge', 'bi', 'strategy', 'compliance',
                          'marketing-auto', 'social', 'budget-pro', 'invoicing')
  },

  // SUPPLY CHAIN & OPERATIONS - Complete supply chain
  {
    id: 'supply-chain',
    name: 'Supply Chain Hub',
    icon: FaTruck,
    description: 'End-to-end supply chain management with inventory, logistics, and production planning',
    type: 'Operations',
    accentColor: '#f59e0b',
    definition: 'Supply chain operations',
    widgets: getWidgetIds('inventory', 'procurement', 'warehouse', 'shipping', 'demand', 
                          'production', 'qc', 'suppliers', 'returns', 'routing', 'freight', 'mrp')
  },
  {
    id: 'warehouse-ops',
    name: 'Warehouse Operations',
    icon: FaShoppingCart,
    description: 'Complete warehouse management and fulfillment operations',
    type: 'Operations',
    accentColor: '#f59e0b',
    definition: 'Warehouse control center',
    widgets: getWidgetIds('warehouse', 'inventory', 'shipping', 'qc', 'returns', 
                          'routing', 'procurement', 'suppliers')
  },

  // MARKETING & SALES - Complete marketing suite
  {
    id: 'marketing-suite',
    name: 'Marketing Suite',
    icon: FaBullhorn,
    description: 'Complete marketing automation, campaign management, and analytics platform',
    type: 'Marketing',
    accentColor: '#ec4899',
    definition: 'Marketing command center',
    widgets: getWidgetIds('marketing-auto', 'email-mkt', 'social', 'content', 'seo', 
                          'landing', 'ads', 'feedback', 'forms', 'competitors', 
                          'affiliates', 'referrals', 'sms', 'influencers')
  },
  {
    id: 'sales-team',
    name: 'Sales Team Pro',
    icon: FaChartLine,
    description: 'Complete sales pipeline, CRM, and performance tracking',
    type: 'Sales',
    accentColor: '#06b6d4',
    definition: 'Sales operations',
    widgets: getWidgetIds('sales', 'crm', 'forms', 'email-mkt', 'affiliates', 
                          'competitors', 'landing', 'feedback')
  },

  // HR & PEOPLE - Complete HR platform
  {
    id: 'hr-platform',
    name: 'HR Platform',
    icon: FaUserFriends,
    description: 'Complete people management with recruiting, performance, and employee engagement',
    type: 'HR',
    accentColor: '#06b6d4',
    definition: 'People & culture hub',
    widgets: getWidgetIds('hris', 'ats', 'time', 'performance', 'lms', 'engagement',
                          'benefits', 'payroll', 'shifts', 'directory', 'okrs', 
                          'succession', 'comp', 'ess', 'hr-analytics')
  },
  {
    id: 'talent-management',
    name: 'Talent Management',
    icon: FaUserFriends,
    description: 'Recruiting, performance management, and talent development',
    type: 'HR',
    accentColor: '#06b6d4',
    definition: 'Talent operations',
    widgets: getWidgetIds('ats', 'performance', 'lms', 'succession', 'comp', 
                          'hr-analytics', 'okrs', 'engagement')
  },

  // CREATIVE & DESIGN - Complete creative suite
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    icon: FaPalette,
    description: 'Complete creative production workspace with design, video, and asset management',
    type: 'Creative',
    accentColor: '#8b5cf6',
    definition: 'Creative projects',
    widgets: getWidgetIds('graphics', 'video', 'photo', 'ui-ux', 'brand', 'dam',
                          'animation', '3d', 'audio', 'print', 'wireframe', 
                          'icons', 'logo', 'color-scheme', 'typography')
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    icon: FaCamera,
    description: 'Video production, graphics, photography, and multimedia creation',
    type: 'Creative',
    accentColor: '#ec4899',
    definition: 'Content production',
    widgets: getWidgetIds('video', 'graphics', 'photo', 'audio', 'animation', 
                          'color-scheme', 'dam', 'brand')
  },

  // DEVELOPER & ENGINEERING - Complete dev workspace
  {
    id: 'developer-hub',
    name: 'Developer Hub',
    icon: FaCode,
    description: 'Complete development tools, code management, and API testing',
    type: 'Development',
    accentColor: '#8b5cf6',
    definition: 'Dev workspace',
    widgets: getWidgetIds('snippets', 'api', 'git', 'db-query', 'markdown', 'json',
                          'regex', 'diff', 'base64', 'jwt', 'cron', 'api-docs',
                          'webhook', 'sql-opt', 'colors')
  },
  {
    id: 'engineering-lab',
    name: 'Engineering Lab',
    icon: FaCogs,
    description: 'Engineering design, simulation, and calculation tools',
    type: 'Engineering',
    accentColor: '#84cc16',
    definition: 'Engineering workspace',
    widgets: getWidgetIds('circuit', 'cad', 'eng-notebook', 'fea', 'signals', 'control',
                          'structural', 'electrical', 'hvac', 'robotics')
  },

  // HEALTHCARE - Complete medical platform
  {
    id: 'medical-practice',
    name: 'Medical Practice',
    icon: FaHospital,
    description: 'Complete patient care and medical practice management',
    type: 'Healthcare',
    accentColor: '#ef4444',
    definition: 'Medical operations',
    widgets: getWidgetIds('ehr', 'scheduling', 'billing', 'rx', 'labs', 'telehealth',
                          'patient-portal', 'imaging', 'cds', 'immunizations', 
                          'chronic-care', 'health-analytics')
  },

  // MANUFACTURING - Complete production system
  {
    id: 'manufacturing-ops',
    name: 'Manufacturing Operations',
    icon: FaIndustry,
    description: 'Complete production planning, quality control, and shop floor management',
    type: 'Manufacturing',
    accentColor: '#f97316',
    definition: 'Production control',
    widgets: getWidgetIds('mes', 'shop-floor', 'cmms', 'oee', 'spc', 'bom',
                          'tools', 'prod-analytics', 'downtime', 'yield')
  },

  // SCIENCE & RESEARCH - Complete research platform
  {
    id: 'research-lab',
    name: 'Research Lab',
    icon: FaMicroscope,
    description: 'Complete scientific research, experimentation, and documentation',
    type: 'Research',
    accentColor: '#06b6d4',
    definition: 'Research workspace',
    widgets: getWidgetIds('research', 'lab', 'hypothesis', 'references', 'experiments', 
                          'grants', 'citations', 'lit-review')
  },
  {
    id: 'science-toolkit',
    name: 'Science Toolkit',
    icon: FaFlask,
    description: 'Scientific calculations, simulations, and analysis tools',
    type: 'Science',
    accentColor: '#06b6d4',
    definition: 'Science workspace',
    widgets: getWidgetIds('sci-calc', 'chemistry', 'physics', 'math', 'graphing', 'stats',
                          'equations', 'periodic', 'molecules', 'converter')
  },

  // DATA & ANALYTICS - Complete analytics platform
  {
    id: 'data-analytics',
    name: 'Data Analytics',
    icon: FaChartBar,
    description: 'Complete business intelligence, data analysis, and visualization',
    type: 'Analytics',
    accentColor: '#10b981',
    definition: 'Analytics hub',
    widgets: getWidgetIds('viz', 'spreadsheet', 'dashboard', 'reports', 'etl', 'ml',
                          'data-clean', 'sql-analyze', 'pivot', 'profiler')
  },

  // PERSONAL & LIFESTYLE - Complete personal workspace
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: FaDumbbell,
    description: 'Complete fitness tracking, nutrition, and healthy living',
    type: 'Personal',
    accentColor: '#10b981',
    definition: 'Health journey',
    widgets: getWidgetIds('workout', 'meals', 'water', 'calories', 'macros', 'weight',
                          'sleep', 'steps', 'hr', 'meditation', 'running', 'cycling',
                          'swimming', 'strength', 'fitness-goals')
  },
  {
    id: 'personal-growth',
    name: 'Personal Growth',
    icon: FaHeart,
    description: 'Self-improvement, mindfulness, and personal development',
    type: 'Personal',
    accentColor: '#ec4899',
    definition: 'Personal development',
    widgets: getWidgetIds('journal', 'habits', 'personal-goals', 'gratitude', 'mood', 
                          'vision', 'affirmations', 'memory', 'wiki')
  },

  // EDUCATION & LEARNING - Complete learning platform
  {
    id: 'student-workspace',
    name: 'Student Workspace',
    icon: FaGraduationCap,
    description: 'Complete academic tools for students',
    type: 'Education',
    accentColor: '#8b5cf6',
    definition: 'Study space',
    widgets: getWidgetIds('study', 'flashcards', 'notes', 'calendar', 'assignments', 
                          'grades', 'exam-prep', 'cornell', 'concept-map', 'courses')
  },
  {
    id: 'teacher-hub',
    name: 'Teacher Hub',
    icon: FaGraduationCap,
    description: 'Lesson planning, course management, and student assessment',
    type: 'Education',
    accentColor: '#06b6d4',
    definition: 'Teaching workspace',
    widgets: getWidgetIds('courses', 'quizzes', 'grades', 'lms', 'calendar', 
                          'study-group', 'assignments', 'learning-path')
  },

  // REAL ESTATE - Complete property platform
  {
    id: 'property-management',
    name: 'Property Management',
    icon: FaHome,
    description: 'Complete property, tenant, and maintenance management',
    type: 'Real Estate',
    accentColor: '#f59e0b',
    definition: 'Property operations',
    widgets: getWidgetIds('prop-mgmt', 'leases', 'maintenance', 'tenant-portal', 'rent', 
                          'inspections', 're-vendors', 're-crm', 'prop-analytics', 'listings')
  },

  // LEGAL - Complete legal platform
  {
    id: 'legal-practice',
    name: 'Legal Practice',
    icon: FaGavel,
    description: 'Complete case management, contract management, and legal operations',
    type: 'Legal',
    accentColor: '#6366f1',
    definition: 'Legal workspace',
    widgets: getWidgetIds('legal-matter', 'legal-clm', 'litigation', 'legal-billing', 
                          'ediscovery', 'ndas', 'ip', 'compliance-track', 'regulatory', 'doc-gen')
  },

  // COMMUNICATION - Complete communication platform
  {
    id: 'communication-hub',
    name: 'Communication Hub',
    icon: FaComments,
    description: 'Complete team communication, collaboration, and messaging',
    type: 'Communication',
    accentColor: '#06b6d4',
    definition: 'Communication center',
    widgets: getWidgetIds('messaging', 'email-client', 'video-conf', 'voip', 'collab', 
                          'comm-analytics', 'email-templates', 'call-log', 'contacts', 
                          'newsletter', 'chatbot')
  },

  // AI & AUTOMATION - Complete automation platform
  {
    id: 'ai-automation',
    name: 'AI & Automation',
    icon: FaBrain,
    description: 'AI tools, workflow automation, and intelligent processing',
    type: 'Technology',
    accentColor: '#8b5cf6',
    definition: 'AI workspace',
    widgets: getWidgetIds('workflow', 'chatbot', 'ml', 'api', 'etl', 'dashboard',
                          'bi', 'automation')
  },

  // PRODUCTIVITY - Complete productivity suite
  {
    id: 'productivity-pro',
    name: 'Productivity Pro',
    icon: FaTasks,
    description: 'Ultimate productivity toolkit with tasks, notes, and time management',
    type: 'Productivity',
    accentColor: '#10b981',
    definition: 'Productivity hub',
    widgets: getWidgetIds('tasks', 'notes', 'calendar', 'pomodoro', 'goals', 'inbox-zero',
                          'mind-map', 'project-planner', 'meeting-notes', 'daily-planner',
                          'bookmarks', 'quick-capture')
  },

  // FREELANCER - Complete freelance platform
  {
    id: 'freelancer',
    name: 'Freelancer Hub',
    icon: FaBriefcase,
    description: 'Client management, invoicing, project tracking, and business operations',
    type: 'Freelance',
    accentColor: '#06b6d4',
    definition: 'Freelance business',
    widgets: getWidgetIds('crm', 'invoicing', 'ppm', 'time', 'expenses', 'tasks',
                          'budget-pro', 'cashflow')
  },

  // BLANK CANVAS
  {
    id: 'blank',
    name: 'Blank Canvas',
    icon: FaFolder,
    description: 'Start fresh and add exactly what you need',
    type: 'Custom',
    accentColor: '#00f0ff',
    definition: 'Define your space...',
    widgets: []
  }
];

// Helper functions
export const getTemplateById = (templateId) => 
  SPACE_TEMPLATES.find(t => t.id === templateId);

export const getTemplatesByType = (type) => 
  type === 'all' 
    ? SPACE_TEMPLATES 
    : SPACE_TEMPLATES.filter(t => t.type === type);

export const searchTemplates = (query) => {
  const lowerQuery = query.toLowerCase();
  return SPACE_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) || 
    t.description.toLowerCase().includes(lowerQuery) ||
    t.type.toLowerCase().includes(lowerQuery)
  );
};

export const getTemplateTypes = () => 
  ['all', ...new Set(SPACE_TEMPLATES.map(t => t.type))];

// Get widgets for a template with validation
export const getTemplateWidgets = (templateId) => {
  const template = getTemplateById(templateId);
  if (!template) return [];
  
  // Validate that all widget IDs exist in registry
  return template.widgets
    .map(widgetId => WIDGET_REGISTRY.find(w => w.id === widgetId))
    .filter(Boolean); // Remove any widgets that don't exist
};