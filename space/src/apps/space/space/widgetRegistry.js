// space/widgetRegistry.js
import {
    FaCode, FaCalculator, FaChartLine, FaBookReader, FaPalette,
    FaGamepad, FaGraduationCap, FaRobot, FaMicroscope, FaFlask,
    FaBriefcase, FaUsers, FaShare, FaCog, FaPlus, FaTimes,
    FaEdit, FaTrash, FaExpand, FaLink, FaLock, FaGlobe,
    FaFolder, FaFileAlt, FaImage, FaVideo, FaMusic, FaComments,
    FaTasks, FaCalendar, FaBell, FaChartBar, FaCloud, FaLightbulb,
    FaPencilAlt, FaNewspaper, FaMoneyBill, FaBitcoin, FaHeartbeat,
    FaTerminal, FaDatabase, FaServer, FaLayerGroup, FaClock,
    FaHashtag, FaBookmark, FaBrain, FaFlask as FaScience, FaRocket
  } from 'react-icons/fa';
  
  // Widget Categories
  export const WIDGET_CATEGORIES = [
    { id: 'all', name: 'All Widgets', icon: FaFolder },
    { id: 'engineering', name: 'Engineering', icon: FaCode },
    { id: 'finance', name: 'Finance & Trading', icon: FaMoneyBill },
    { id: 'creative', name: 'Creative', icon: FaPalette },
    { id: 'education', name: 'Education', icon: FaGraduationCap },
    { id: 'productivity', name: 'Productivity', icon: FaTasks },
    { id: 'collaboration', name: 'Collaboration', icon: FaUsers },
    { id: 'analytics', name: 'Analytics', icon: FaChartBar },
    { id: 'health', name: 'Health & Wellness', icon: FaHeartbeat }
  ];
  
  // Complete Widget Registry
  export const WIDGET_REGISTRY = [
    // ========== ENGINEERING ==========
    {
      id: 'code-editor',
      name: 'Code Editor',
      icon: FaCode,
      category: 'engineering',
      description: 'Full-featured IDE with syntax highlighting and IntelliSense',
      size: 'large',
      tags: ['development', 'coding', 'ide'],
      defaultConfig: { theme: 'dark', language: 'javascript' }
    },
    {
      id: 'terminal',
      name: 'Terminal',
      icon: FaTerminal,
      category: 'engineering',
      description: 'Embedded terminal for command execution',
      size: 'medium',
      tags: ['cli', 'shell', 'bash'],
      defaultConfig: { shell: 'bash' }
    },
    {
      id: 'github-activity',
      name: 'GitHub Activity',
      icon: FaCode,
      category: 'engineering',
      description: 'Monitor repository activity, commits, and PRs',
      size: 'medium',
      tags: ['git', 'version-control', 'collaboration']
    },
    {
      id: 'latex-editor',
      name: 'LaTeX Editor',
      icon: FaFlask,
      category: 'engineering',
      description: 'Write mathematical and scientific documents',
      size: 'large',
      tags: ['math', 'science', 'academic']
    },
    {
      id: 'circuit-designer',
      name: 'Circuit Designer',
      icon: FaMicroscope,
      category: 'engineering',
      description: 'Design and simulate electronic circuits',
      size: 'large',
      tags: ['electronics', 'hardware', 'simulation']
    },
    {
      id: 'database-manager',
      name: 'Database Manager',
      icon: FaDatabase,
      category: 'engineering',
      description: 'Query and manage databases visually',
      size: 'large',
      tags: ['sql', 'nosql', 'data']
    },
    {
      id: 'api-tester',
      name: 'API Tester',
      icon: FaServer,
      category: 'engineering',
      description: 'Test REST and GraphQL APIs',
      size: 'medium',
      tags: ['api', 'http', 'testing']
    },
    {
      id: 'docker-manager',
      name: 'Docker Manager',
      icon: FaLayerGroup,
      category: 'engineering',
      description: 'Manage containers and images',
      size: 'medium',
      tags: ['devops', 'containers', 'docker']
    },
  
    // ========== FINANCE ==========
    {
      id: 'portfolio-tracker',
      name: 'Portfolio Tracker',
      icon: FaChartLine,
      category: 'finance',
      description: 'Track stocks, crypto, and investment performance',
      size: 'large',
      tags: ['investing', 'stocks', 'crypto']
    },
    {
      id: 'trading-terminal',
      name: 'Trading Terminal',
      icon: FaBitcoin,
      category: 'finance',
      description: 'Execute trades with advanced charting',
      size: 'large',
      tags: ['trading', 'charts', 'technical-analysis']
    },
    {
      id: 'budget-planner',
      name: 'Budget Planner',
      icon: FaMoneyBill,
      category: 'finance',
      description: 'Personal budgeting and expense tracking',
      size: 'medium',
      tags: ['budgeting', 'expenses', 'personal-finance']
    },
    {
      id: 'crypto-ticker',
      name: 'Crypto Ticker',
      icon: FaBitcoin,
      category: 'finance',
      description: 'Real-time cryptocurrency prices',
      size: 'small',
      tags: ['crypto', 'prices', 'market-data']
    },
    {
      id: 'stock-screener',
      name: 'Stock Screener',
      icon: FaChartBar,
      category: 'finance',
      description: 'Filter and discover stocks by criteria',
      size: 'large',
      tags: ['stocks', 'screening', 'research']
    },
    {
      id: 'tax-calculator',
      name: 'Tax Calculator',
      icon: FaCalculator,
      category: 'finance',
      description: 'Estimate taxes and deductions',
      size: 'medium',
      tags: ['taxes', 'calculator', 'planning']
    },
  
    // ========== CREATIVE ==========
    {
      id: 'canvas',
      name: 'Drawing Canvas',
      icon: FaPalette,
      category: 'creative',
      description: 'Digital canvas for sketching and design',
      size: 'large',
      tags: ['drawing', 'art', 'design']
    },
    {
      id: 'gallery',
      name: 'Photo Gallery',
      icon: FaImage,
      category: 'creative',
      description: 'Organize and share photos with AI tagging',
      size: 'medium',
      tags: ['photos', 'gallery', 'albums']
    },
    {
      id: 'video-library',
      name: 'Video Library',
      icon: FaVideo,
      category: 'creative',
      description: 'Curate and share video content',
      size: 'large',
      tags: ['videos', 'media', 'library']
    },
    {
      id: 'music-player',
      name: 'Music Player',
      icon: FaMusic,
      category: 'creative',
      description: 'Organize playlists with visualizer',
      size: 'medium',
      tags: ['music', 'audio', 'playlists']
    },
    {
      id: 'color-palette',
      name: 'Color Palette',
      icon: FaPalette,
      category: 'creative',
      description: 'Generate and save color palettes',
      size: 'small',
      tags: ['colors', 'design', 'branding']
    },
    {
      id: 'typography',
      name: 'Typography Lab',
      icon: FaPencilAlt,
      category: 'creative',
      description: 'Explore and preview fonts',
      size: 'medium',
      tags: ['fonts', 'typography', 'design']
    },
  
    // ========== EDUCATION ==========
    {
      id: 'note-taking',
      name: 'Smart Notes',
      icon: FaPencilAlt,
      category: 'education',
      description: 'AI-enhanced note-taking with bidirectional linking',
      size: 'large',
      tags: ['notes', 'zettelkasten', 'knowledge']
    },
    {
      id: 'flashcards',
      name: 'Flashcards',
      icon: FaGraduationCap,
      category: 'education',
      description: 'Spaced repetition learning system',
      size: 'medium',
      tags: ['learning', 'memory', 'studying']
    },
    {
      id: 'research-papers',
      name: 'Research Library',
      icon: FaBookReader,
      category: 'education',
      description: 'Organize and annotate research papers',
      size: 'large',
      tags: ['research', 'papers', 'citations']
    },
    {
      id: 'calculator',
      name: 'Scientific Calculator',
      icon: FaCalculator,
      category: 'education',
      description: 'Advanced mathematical calculations and graphing',
      size: 'small',
      tags: ['math', 'calculator', 'science']
    },
    {
      id: 'mind-map',
      name: 'Mind Map',
      icon: FaBrain,
      category: 'education',
      description: 'Visual thinking and brainstorming',
      size: 'large',
      tags: ['brainstorming', 'visual', 'thinking']
    },
    {
      id: 'quiz-maker',
      name: 'Quiz Maker',
      icon: FaGraduationCap,
      category: 'education',
      description: 'Create and take interactive quizzes',
      size: 'medium',
      tags: ['quiz', 'testing', 'learning']
    },
  
    // ========== PRODUCTIVITY ==========
    {
      id: 'tasks',
      name: 'Task Manager',
      icon: FaTasks,
      category: 'productivity',
      description: 'Organize tasks with Kanban, list, and calendar views',
      size: 'medium',
      tags: ['tasks', 'todo', 'gtd']
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: FaCalendar,
      category: 'productivity',
      description: 'Schedule events with smart reminders',
      size: 'medium',
      tags: ['calendar', 'scheduling', 'events']
    },
    {
      id: 'quick-links',
      name: 'Quick Links',
      icon: FaLink,
      category: 'productivity',
      description: 'Bookmarks and frequently accessed links',
      size: 'small',
      tags: ['bookmarks', 'links', 'shortcuts']
    },
    {
      id: 'journal',
      name: 'Daily Journal',
      icon: FaFileAlt,
      category: 'productivity',
      description: 'Daily reflections with prompts and mood tracking',
      size: 'medium',
      tags: ['journal', 'diary', 'reflection']
    },
    {
      id: 'pomodoro',
      name: 'Pomodoro Timer',
      icon: FaClock,
      category: 'productivity',
      description: 'Focus sessions with breaks',
      size: 'small',
      tags: ['focus', 'time-management', 'productivity']
    },
    {
      id: 'habit-tracker',
      name: 'Habit Tracker',
      icon: FaHashtag,
      category: 'productivity',
      description: 'Build and maintain daily habits',
      size: 'medium',
      tags: ['habits', 'streaks', 'self-improvement']
    },
    {
      id: 'bookmarks',
      name: 'Smart Bookmarks',
      icon: FaBookmark,
      category: 'productivity',
      description: 'Intelligent bookmark organization with tags',
      size: 'medium',
      tags: ['bookmarks', 'organization', 'research']
    },
  
    // ========== COLLABORATION ==========
    {
      id: 'chat',
      name: 'Team Chat',
      icon: FaComments,
      category: 'collaboration',
      description: 'Real-time messaging with channels',
      size: 'large',
      tags: ['chat', 'messaging', 'communication']
    },
    {
      id: 'shared-links',
      name: 'Shared Links',
      icon: FaShare,
      category: 'collaboration',
      description: 'Collaborative link collection',
      size: 'medium',
      tags: ['sharing', 'collaboration', 'links']
    },
    {
      id: 'whiteboard',
      name: 'Whiteboard',
      icon: FaPalette,
      category: 'collaboration',
      description: 'Collaborative infinite canvas',
      size: 'large',
      tags: ['whiteboard', 'brainstorming', 'drawing']
    },
    {
      id: 'video-call',
      name: 'Video Call',
      icon: FaVideo,
      category: 'collaboration',
      description: 'HD video conferencing',
      size: 'large',
      tags: ['video', 'calls', 'meetings']
    },
    {
      id: 'screen-share',
      name: 'Screen Share',
      icon: FaShare,
      category: 'collaboration',
      description: 'Share your screen in real-time',
      size: 'medium',
      tags: ['screen-sharing', 'demo', 'presentation']
    },
  
    // ========== ANALYTICS ==========
    {
      id: 'activity-tracker',
      name: 'Activity Tracker',
      icon: FaChartBar,
      category: 'analytics',
      description: 'Track productivity and time spent',
      size: 'medium',
      tags: ['analytics', 'tracking', 'productivity']
    },
    {
      id: 'analytics-dashboard',
      name: 'Analytics Dashboard',
      icon: FaChartLine,
      category: 'analytics',
      description: 'Custom data visualizations',
      size: 'large',
      tags: ['analytics', 'charts', 'insights']
    },
    {
      id: 'goal-tracker',
      name: 'Goal Tracker',
      icon: FaRocket,
      category: 'analytics',
      description: 'Set and track long-term goals',
      size: 'medium',
      tags: ['goals', 'okr', 'progress']
    },
  
    // ========== HEALTH ==========
    {
      id: 'fitness-tracker',
      name: 'Fitness Tracker',
      icon: FaHeartbeat,
      category: 'health',
      description: 'Track workouts and health metrics',
      size: 'medium',
      tags: ['fitness', 'health', 'exercise']
    },
    {
      id: 'meditation',
      name: 'Meditation Timer',
      icon: FaHeartbeat,
      category: 'health',
      description: 'Guided meditation and mindfulness',
      size: 'small',
      tags: ['meditation', 'mindfulness', 'wellness']
    },
    {
      id: 'sleep-tracker',
      name: 'Sleep Tracker',
      icon: FaClock,
      category: 'health',
      description: 'Monitor sleep patterns and quality',
      size: 'medium',
      tags: ['sleep', 'health', 'recovery']
    },
    {
      id: 'water-reminder',
      name: 'Water Reminder',
      icon: FaBell,
      category: 'health',
      description: 'Stay hydrated with smart reminders',
      size: 'small',
      tags: ['hydration', 'health', 'reminders']
    }
  ];
  
  // Accent Colors
  export const ACCENT_COLORS = [
    '#00f0ff', // Cyan
    '#ff006e', // Magenta
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Teal
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#f97316'  // Orange
  ];
  
  // Space Templates
  export const SPACE_TEMPLATES = [
    {
      id: 'developer',
      name: 'Developer Workspace',
      icon: FaCode,
      description: 'Everything a developer needs: code editor, terminal, GitHub, and more',
      type: 'work',
      accentColor: '#00f0ff',
      definition: 'Your complete development environment',
      widgets: [
        'code-editor',
        'terminal',
        'github-activity',
        'tasks',
        'quick-links',
        'api-tester',
        'database-manager'
      ]
    },
    {
      id: 'trader',
      name: 'Trading Desk',
      icon: FaBitcoin,
      description: 'Professional trading setup with charts, portfolio, and market data',
      type: 'finance',
      accentColor: '#10b981',
      definition: 'Your personal trading command center',
      widgets: [
        'trading-terminal',
        'portfolio-tracker',
        'crypto-ticker',
        'stock-screener',
        'analytics-dashboard',
        'calendar'
      ]
    },
    {
      id: 'student',
      name: 'Study Space',
      icon: FaGraduationCap,
      description: 'Optimized for learning with notes, flashcards, and research tools',
      type: 'educational',
      accentColor: '#8b5cf6',
      definition: 'Your digital study sanctuary',
      widgets: [
        'note-taking',
        'flashcards',
        'research-papers',
        'calendar',
        'tasks',
        'pomodoro',
        'mind-map'
      ]
    },
    {
      id: 'creative',
      name: 'Creative Studio',
      icon: FaPalette,
      description: 'For designers and artists with canvas, gallery, and color tools',
      type: 'creative',
      accentColor: '#ec4899',
      definition: 'Where creativity meets productivity',
      widgets: [
        'canvas',
        'gallery',
        'color-palette',
        'typography',
        'music-player',
        'inspiration-board'
      ]
    },
    {
      id: 'productivity',
      name: 'Productivity Hub',
      icon: FaRocket,
      description: 'Get things done with tasks, calendar, goals, and habits',
      type: 'personal',
      accentColor: '#f59e0b',
      definition: 'Your productivity command center',
      widgets: [
        'tasks',
        'calendar',
        'habit-tracker',
        'goal-tracker',
        'pomodoro',
        'journal',
        'quick-links'
      ]
    },
    {
      id: 'researcher',
      name: 'Research Lab',
      icon: FaScience,
      description: 'Academic research with papers, notes, and citations',
      type: 'educational',
      accentColor: '#6366f1',
      definition: 'Your research workspace',
      widgets: [
        'research-papers',
        'note-taking',
        'latex-editor',
        'mind-map',
        'bookmarks',
        'analytics-dashboard'
      ]
    },
    {
      id: 'team',
      name: 'Team Workspace',
      icon: FaUsers,
      description: 'Collaborate with chat, whiteboard, and shared resources',
      type: 'collaborative',
      accentColor: '#06b6d4',
      definition: 'Where teams collaborate seamlessly',
      widgets: [
        'chat',
        'whiteboard',
        'shared-links',
        'video-call',
        'tasks',
        'calendar'
      ]
    },
    {
      id: 'wellness',
      name: 'Wellness Center',
      icon: FaHeartbeat,
      description: 'Focus on health with fitness, meditation, and habit tracking',
      type: 'personal',
      accentColor: '#84cc16',
      definition: 'Your personal wellness companion',
      widgets: [
        'fitness-tracker',
        'meditation',
        'sleep-tracker',
        'habit-tracker',
        'journal',
        'water-reminder'
      ]
    },
    {
      id: 'blank',
      name: 'Blank Canvas',
      icon: FaPlus,
      description: 'Start fresh and add exactly what you need',
      type: 'personal',
      accentColor: '#00f0ff',
      definition: 'Define your space purpose...',
      widgets: []
    }
  ];
  
  // Helper function to get widget by ID
  export const getWidget = (widgetId) => {
    return WIDGET_REGISTRY.find(w => w.id === widgetId);
  };
  
  // Helper function to get widgets by category
  export const getWidgetsByCategory = (category) => {
    if (category === 'all') return WIDGET_REGISTRY;
    return WIDGET_REGISTRY.filter(w => w.category === category);
  };
  
  // Helper function to search widgets
  export const searchWidgets = (query) => {
    const lowerQuery = query.toLowerCase();
    return WIDGET_REGISTRY.filter(w =>
      w.name.toLowerCase().includes(lowerQuery) ||
      w.description.toLowerCase().includes(lowerQuery) ||
      w.tags?.some(tag => tag.includes(lowerQuery))
    );
  };