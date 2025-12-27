// widgetRegistry.js - REAL FUNCTIONAL WIDGETS
import {
  FaBook, FaCamera, FaTasks, FaCalendar, FaStickyNote, FaLink,
  FaChartLine, FaHeart, FaDumbbell, FaUtensils, FaGlassMartini,
  FaBriefcase, FaGraduationCap, FaHome, FaPlane, FaBaby,
  FaGamepad, FaMusic, FaPalette, FaCoffee, FaDollarSign,
  FaCalculator, FaBullseye, FaClock, FaBookmark, FaUsers,
  FaFolder, FaFileAlt, FaListUl, FaCheckSquare
} from 'react-icons/fa';

// ============================================
// WIDGET CATEGORIES
// ============================================

export const WIDGET_CATEGORIES = [
  { id: 'all', name: 'All Widgets', icon: FaFolder },
  { id: 'personal-life', name: 'Personal Life', icon: FaHeart },
  { id: 'health-fitness', name: 'Health & Fitness', icon: FaDumbbell },
  { id: 'productivity', name: 'Productivity', icon: FaTasks },
  { id: 'finance', name: 'Finance', icon: FaDollarSign },
  { id: 'relationships', name: 'Relationships', icon: FaUsers },
  { id: 'creative', name: 'Creative', icon: FaPalette },
  { id: 'learning', name: 'Learning', icon: FaGraduationCap },
  { id: 'professional', name: 'Professional', icon: FaBriefcase },
  { id: 'home', name: 'Home & Lifestyle', icon: FaHome },
  { id: 'travel', name: 'Travel', icon: FaPlane },
  { id: 'utilities', name: 'Utilities', icon: FaCalculator }
];

// ============================================
// COMPLETE WIDGET REGISTRY
// ============================================

export const WIDGET_REGISTRY = [
  // ========== PERSONAL LIFE & WELLNESS ==========
  {
    id: 'journal',
    name: 'Journal',
    icon: FaBook,
    category: 'personal-life',
    description: 'Daily entries with mood tracking, tags, and search',
    size: 'large',
    tags: ['journaling', 'reflection', 'mood'],
    defaultConfig: {
      defaultPrompt: true,
      reminderTime: '21:00',
      streakGoal: 30,
      enableMoodTracking: true
    },
    features: [
      'Rich text entries',
      'Mood/emotion tracking',
      'Tags and categories',
      'Search and filter',
      'Entry streaks',
      'Privacy controls'
    ]
  },
  
  {
    id: 'photo-album',
    name: 'Photo Album',
    icon: FaCamera,
    category: 'personal-life',
    description: 'Organize photos with albums, captions, and tags',
    size: 'large',
    tags: ['photos', 'memories', 'albums'],
    defaultConfig: {
      viewMode: 'grid',
      photosPerPage: 24,
      enableCaptions: true
    },
    features: [
      'Upload photos',
      'Create albums',
      'Add captions',
      'Timeline view',
      'Share albums'
    ]
  },

  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    icon: FaCheckSquare,
    category: 'personal-life',
    description: 'Build and track daily habits with streaks',
    size: 'medium',
    tags: ['habits', 'tracking', 'self-improvement'],
    defaultConfig: {
      viewMode: 'calendar',
      reminderEnabled: true
    },
    features: [
      'Custom habits',
      'Daily check-in',
      'Streak counter',
      'Calendar view',
      'Reminders'
    ]
  },

  {
    id: 'book-tracker',
    name: 'Reading List',
    icon: FaBook,
    category: 'personal-life',
    description: 'Track books with ratings and notes',
    size: 'medium',
    tags: ['reading', 'books', 'reviews'],
    defaultConfig: {
      viewMode: 'list',
      showProgress: true
    }
  },

  // ========== HEALTH & FITNESS ==========
  {
    id: 'workout-log',
    name: 'Workout Logger',
    icon: FaDumbbell,
    category: 'health-fitness',
    description: 'Track exercises, sets, reps, and PRs',
    size: 'large',
    tags: ['fitness', 'gym', 'exercise'],
    defaultConfig: {
      restTimerEnabled: true,
      trackPRs: true,
      defaultRestTime: 90
    },
    features: [
      'Exercise library',
      'Log sets and reps',
      'PR tracking',
      'Progress charts',
      'Rest timer'
    ]
  },

  {
    id: 'meal-planner',
    name: 'Meal Planner',
    icon: FaUtensils,
    category: 'health-fitness',
    description: 'Plan meals and track nutrition',
    size: 'large',
    tags: ['nutrition', 'meals', 'recipes'],
    defaultConfig: {
      trackCalories: true,
      trackMacros: true
    },
    features: [
      'Weekly planner',
      'Recipe storage',
      'Macro tracking',
      'Shopping list'
    ]
  },

  {
    id: 'water-tracker',
    name: 'Water Intake',
    icon: FaGlassMartini,
    category: 'health-fitness',
    description: 'Track daily hydration with reminders',
    size: 'small',
    tags: ['hydration', 'health', 'wellness'],
    defaultConfig: {
      dailyGoal: 8,
      reminderInterval: 60
    }
  },

  // ========== PRODUCTIVITY ==========
  {
    id: 'tasks',
    name: 'Task Manager',
    icon: FaTasks,
    category: 'productivity',
    description: 'Kanban boards, lists, and task tracking',
    size: 'large',
    tags: ['tasks', 'todo', 'project-management'],
    defaultConfig: {
      viewMode: 'kanban',
      columns: ['To Do', 'In Progress', 'Done'],
      enableSubtasks: true
    },
    features: [
      'Kanban boards',
      'Multiple views',
      'Due dates',
      'Priorities',
      'Assignees',
      'Subtasks'
    ]
  },

  {
    id: 'notes',
    name: 'Notes',
    icon: FaStickyNote,
    category: 'productivity',
    description: 'Rich text notes with folders and search',
    size: 'large',
    tags: ['notes', 'documentation', 'writing'],
    defaultConfig: {
      enableMarkdown: true,
      autoSave: true
    },
    features: [
      'Rich text editor',
      'Folders',
      'Tags',
      'Search',
      'Markdown support'
    ]
  },

  {
    id: 'calendar',
    name: 'Calendar',
    icon: FaCalendar,
    category: 'productivity',
    description: 'Schedule events and reminders',
    size: 'large',
    tags: ['calendar', 'events', 'scheduling'],
    defaultConfig: {
      viewMode: 'month',
      firstDayOfWeek: 0
    },
    features: [
      'Month/week views',
      'Create events',
      'Reminders',
      'Color coding'
    ]
  },

  {
    id: 'link-library',
    name: 'Link Library',
    icon: FaLink,
    category: 'productivity',
    description: 'Bookmark and organize useful links',
    size: 'medium',
    tags: ['bookmarks', 'links', 'organization'],
    defaultConfig: {
      autoPreview: true,
      viewMode: 'grid'
    },
    features: [
      'Save links',
      'Categories',
      'Tags',
      'Search',
      'Preview cards'
    ]
  },

  {
    id: 'goals',
    name: 'Goals Tracker',
    icon: FaBullseye,
    category: 'productivity',
    description: 'Set and track long-term goals',
    size: 'medium',
    tags: ['goals', 'planning', 'progress'],
    defaultConfig: {
      viewMode: 'list',
      showProgress: true
    }
  },

  {
    id: 'pomodoro',
    name: 'Focus Timer',
    icon: FaClock,
    category: 'productivity',
    description: 'Pomodoro technique timer with stats',
    size: 'small',
    tags: ['focus', 'productivity', 'time-management'],
    defaultConfig: {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15
    }
  },

  // ========== FINANCE ==========
  {
    id: 'expenses',
    name: 'Expense Tracker',
    icon: FaDollarSign,
    category: 'finance',
    description: 'Track spending and budgets',
    size: 'large',
    tags: ['finance', 'budgeting', 'expenses'],
    defaultConfig: {
      currency: 'USD',
      categories: ['Food', 'Transport', 'Entertainment', 'Bills', 'Other'],
      monthlyBudget: 0
    },
    features: [
      'Log expenses',
      'Categories',
      'Monthly budgets',
      'Charts',
      'Receipt photos'
    ]
  },

  {
    id: 'budget',
    name: 'Budget Planner',
    icon: FaChartLine,
    category: 'finance',
    description: 'Plan and track monthly budgets',
    size: 'medium',
    tags: ['budgeting', 'planning', 'finance'],
    defaultConfig: {
      viewMode: 'monthly'
    }
  },

  {
    id: 'subscriptions',
    name: 'Subscription Manager',
    icon: FaCalendar,
    category: 'finance',
    description: 'Track recurring subscriptions and bills',
    size: 'medium',
    tags: ['subscriptions', 'bills', 'recurring'],
    defaultConfig: {
      reminderDays: 7
    }
  },

  // ========== RELATIONSHIPS ==========
  {
    id: 'date-ideas',
    name: 'Date Ideas',
    icon: FaHeart,
    category: 'relationships',
    description: 'Save and track date ideas with ratings',
    size: 'medium',
    tags: ['dating', 'relationships', 'activities'],
    defaultConfig: {
      enableRatings: true,
      enablePhotos: true
    },
    features: [
      'Save ideas',
      'Mark as done',
      'Ratings',
      'Photos',
      'Randomizer'
    ]
  },

  {
    id: 'gift-ideas',
    name: 'Gift Tracker',
    icon: FaHeart,
    category: 'relationships',
    description: 'Track gift ideas for friends and family',
    size: 'medium',
    tags: ['gifts', 'occasions', 'shopping'],
    defaultConfig: {
      enableBudget: true
    }
  },

  {
    id: 'relationship-journal',
    name: 'Couple Journal',
    icon: FaHeart,
    category: 'relationships',
    description: 'Shared journaling for couples',
    size: 'large',
    tags: ['couples', 'journal', 'shared'],
    defaultConfig: {
      enablePrompts: true,
      enableMood: true
    }
  },

  // ========== CREATIVE ==========
  {
    id: 'recipes',
    name: 'Recipe Book',
    icon: FaUtensils,
    category: 'creative',
    description: 'Save and organize recipes',
    size: 'large',
    tags: ['cooking', 'recipes', 'food'],
    defaultConfig: {
      viewMode: 'grid',
      enableRatings: true
    },
    features: [
      'Recipe cards',
      'Ingredients',
      'Instructions',
      'Photos',
      'Ratings'
    ]
  },

  {
    id: 'music-practice',
    name: 'Music Practice Log',
    icon: FaMusic,
    category: 'creative',
    description: 'Track music practice sessions',
    size: 'medium',
    tags: ['music', 'practice', 'learning'],
    defaultConfig: {
      trackDuration: true
    }
  },

  {
    id: 'art-portfolio',
    name: 'Art Portfolio',
    icon: FaPalette,
    category: 'creative',
    description: 'Showcase artwork and track projects',
    size: 'large',
    tags: ['art', 'portfolio', 'creative'],
    defaultConfig: {
      viewMode: 'grid',
      publicGallery: false
    }
  },

  // ========== LEARNING ==========
  {
    id: 'study-planner',
    name: 'Study Planner',
    icon: FaGraduationCap,
    category: 'learning',
    description: 'Organize study sessions and track progress',
    size: 'large',
    tags: ['studying', 'education', 'learning'],
    defaultConfig: {
      enablePomodoro: true,
      trackTime: true
    }
  },

  {
    id: 'skills',
    name: 'Skill Tracker',
    icon: FaBullseye,
    category: 'learning',
    description: 'Track skills you\'re learning',
    size: 'medium',
    tags: ['skills', 'development', 'learning'],
    defaultConfig: {
      viewMode: 'list'
    }
  },

  // ========== PROFESSIONAL ==========
  {
    id: 'job-search',
    name: 'Job Search Tracker',
    icon: FaBriefcase,
    category: 'professional',
    description: 'Track job applications and interviews',
    size: 'large',
    tags: ['career', 'job-search', 'applications'],
    defaultConfig: {
      viewMode: 'kanban',
      columns: ['Applied', 'Interview', 'Offer', 'Rejected']
    }
  },

  {
    id: 'projects',
    name: 'Project Portfolio',
    icon: FaFolder,
    category: 'professional',
    description: 'Document projects for portfolio',
    size: 'large',
    tags: ['portfolio', 'projects', 'showcase'],
    defaultConfig: {
      viewMode: 'grid',
      enablePublic: true
    }
  },

  // ========== HOME & LIFESTYLE ==========
  {
    id: 'shopping',
    name: 'Shopping Lists',
    icon: FaListUl,
    category: 'home',
    description: 'Collaborative shopping lists',
    size: 'medium',
    tags: ['shopping', 'groceries', 'lists'],
    defaultConfig: {
      enableQuantities: true,
      enableCategories: true
    },
    features: [
      'Multiple lists',
      'Check off items',
      'Quantities',
      'Categories',
      'Sharing'
    ]
  },

  {
    id: 'maintenance',
    name: 'Home Maintenance',
    icon: FaHome,
    category: 'home',
    description: 'Track home and car maintenance',
    size: 'medium',
    tags: ['maintenance', 'home', 'car'],
    defaultConfig: {
      enableReminders: true
    }
  },

  // ========== TRAVEL ==========
  {
    id: 'travel',
    name: 'Travel Planner',
    icon: FaPlane,
    category: 'travel',
    description: 'Plan trips with itineraries and packing lists',
    size: 'large',
    tags: ['travel', 'planning', 'vacation'],
    defaultConfig: {
      enableBudget: true,
      enablePacking: true
    },
    features: [
      'Itinerary',
      'Bookings',
      'Packing list',
      'Budget',
      'Photos'
    ]
  },

  {
    id: 'bucket-list',
    name: 'Bucket List',
    icon: FaBullseye,
    category: 'travel',
    description: 'Track life experiences and adventures',
    size: 'medium',
    tags: ['goals', 'experiences', 'adventures'],
    defaultConfig: {
      viewMode: 'grid'
    }
  },

  // ========== UTILITIES ==========
  {
    id: 'calculator',
    name: 'Calculator',
    icon: FaCalculator,
    category: 'utilities',
    description: 'Scientific calculator with history',
    size: 'small',
    tags: ['calculator', 'math', 'utility'],
    defaultConfig: {
      mode: 'standard',
      history: []
    }
  },

  {
    id: 'bookmarks',
    name: 'Quick Bookmarks',
    icon: FaBookmark,
    category: 'utilities',
    description: 'Quick access bookmarks',
    size: 'small',
    tags: ['bookmarks', 'shortcuts', 'quick-access'],
    defaultConfig: {
      viewMode: 'list'
    }
  }
];

// ============================================
// ACCENT COLORS
// ============================================

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

// ============================================
// SPACE TEMPLATES
// ============================================

export const SPACE_TEMPLATES = [
  {
    id: 'couple-life',
    name: 'Life Together',
    icon: FaHeart,
    description: 'Shared space for couples with journal, photos, and date ideas',
    type: 'personal',
    accentColor: '#ec4899',
    definition: 'Our shared life and memories',
    widgets: ['relationship-journal', 'photo-album', 'date-ideas', 'calendar', 'shopping', 'expenses']
  },
  {
    id: 'wellness',
    name: 'Wellness Journey',
    icon: FaDumbbell,
    description: 'Track fitness, nutrition, and health goals',
    type: 'personal',
    accentColor: '#10b981',
    definition: 'My health and fitness journey',
    widgets: ['workout-log', 'meal-planner', 'water-tracker', 'habit-tracker', 'journal', 'goals']
  },
  {
    id: 'productivity',
    name: 'Productivity Hub',
    icon: FaTasks,
    description: 'Get things done with tasks, calendar, and goals',
    type: 'work',
    accentColor: '#f59e0b',
    definition: 'Your productivity command center',
    widgets: ['tasks', 'calendar', 'notes', 'goals', 'pomodoro', 'link-library']
  },
  {
    id: 'family',
    name: 'Family Hub',
    icon: FaHome,
    description: 'Coordinate family life with shared tools',
    type: 'collaborative',
    accentColor: '#06b6d4',
    definition: 'Our family\'s shared space',
    widgets: ['calendar', 'shopping', 'photo-album', 'meal-planner', 'tasks']
  },
  {
    id: 'student',
    name: 'Study Space',
    icon: FaGraduationCap,
    description: 'Organize studies with planner, notes, and goals',
    type: 'educational',
    accentColor: '#8b5cf6',
    definition: 'My academic workspace',
    widgets: ['study-planner', 'notes', 'calendar', 'tasks', 'goals', 'pomodoro']
  },
  {
    id: 'freelance',
    name: 'Freelance Business',
    icon: FaBriefcase,
    description: 'Manage freelance work and projects',
    type: 'work',
    accentColor: '#6366f1',
    definition: 'My freelance business hub',
    widgets: ['projects', 'tasks', 'expenses', 'calendar', 'notes']
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    icon: FaFolder,
    description: 'Start fresh and add what you need',
    type: 'personal',
    accentColor: '#00f0ff',
    definition: 'Define your space...',
    widgets: []
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getWidget = (widgetId) => {
  return WIDGET_REGISTRY.find(w => w.id === widgetId);
};

export const getWidgetsByCategory = (category) => {
  if (category === 'all') return WIDGET_REGISTRY;
  return WIDGET_REGISTRY.filter(w => w.category === category);
};

export const searchWidgets = (query) => {
  const lowerQuery = query.toLowerCase();
  return WIDGET_REGISTRY.filter(w =>
    w.name.toLowerCase().includes(lowerQuery) ||
    w.description.toLowerCase().includes(lowerQuery) ||
    w.tags?.some(tag => tag.includes(lowerQuery))
  );
};