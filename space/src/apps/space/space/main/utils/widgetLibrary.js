// COMPREHENSIVE WIDGET LIBRARY
// Real functional mini-apps that live in Spaces

export const WIDGET_LIBRARY = {
  
    // ============================================
    // PERSONAL LIFE & WELLNESS
    // ============================================
    
    JOURNALING: {
      id: 'journal',
      name: 'Journal',
      description: 'Daily entries with mood tracking, tags, and search',
      category: 'personal-life',
      features: [
        'Rich text entries',
        'Mood/emotion tracking',
        'Tags and categories',
        'Search and filter',
        'Entry streaks',
        'Prompts and templates',
        'Export to PDF',
        'Privacy lock (password for entry)',
      ],
      stateStructure: {
        entries: [
          {
            id: 'uuid',
            date: 'timestamp',
            content: 'rich text',
            mood: 'happy|sad|neutral|anxious|excited',
            tags: ['reflection', 'work'],
            weather: 'optional',
            photos: ['url1', 'url2'],
            isPrivate: false,
          }
        ],
        settings: {
          defaultPrompt: true,
          reminderTime: '21:00',
          streakGoal: 30
        }
      },
      useCases: [
        'Personal private journal',
        'Shared journal with partner (couples journaling)',
        'Gratitude journal',
        'Dream journal',
        'Therapy journal'
      ]
    },
  
    PHOTO_ALBUM: {
      id: 'photo-album',
      name: 'Photo Album',
      description: 'Organize photos with albums, tags, and AI auto-tagging',
      category: 'personal-life',
      features: [
        'Upload bulk photos',
        'Create albums/folders',
        'AI auto-tagging (people, places, objects)',
        'Captions and descriptions',
        'Timeline view',
        'Map view (if geo-tagged)',
        'Slideshow mode',
        'Download original quality',
        'Share album publicly',
        'Face recognition grouping'
      ],
      stateStructure: {
        photos: [
          {
            id: 'uuid',
            url: 'storage_url',
            uploadDate: 'timestamp',
            takenDate: 'timestamp',
            caption: 'string',
            location: { lat, lng, name },
            tags: ['vacation', 'beach', 'family'],
            faces: ['person_id_1'],
            album: 'album_id',
            isStarred: false
          }
        ],
        albums: [
          { id: 'uuid', name: 'Europe 2024', coverPhoto: 'photo_id', photoCount: 45 }
        ]
      },
      useCases: [
        'Family photo album (shared with family)',
        'Travel memories',
        'Photography portfolio',
        'Event photos (wedding, birthday)',
        'Year in review'
      ]
    },
  
    HABIT_TRACKER: {
      id: 'habit-tracker',
      name: 'Habit Tracker',
      description: 'Build and track daily habits with streaks and insights',
      category: 'personal-life',
      features: [
        'Custom habits',
        'Daily check-in',
        'Streak counter',
        'Habit chains/calendar view',
        'Reminder notifications',
        'Insights/analytics (best days, completion rate)',
        'Habit templates (exercise, reading, meditation)',
        'Notes per habit per day'
      ],
      stateStructure: {
        habits: [
          {
            id: 'uuid',
            name: 'Morning workout',
            frequency: 'daily|weekly|custom',
            targetDays: ['Mon', 'Wed', 'Fri'],
            currentStreak: 12,
            longestStreak: 45,
            color: '#ff6b6b'
          }
        ],
        completions: [
          { habitId: 'uuid', date: '2024-12-26', completed: true, note: 'Felt great!' }
        ]
      },
      useCases: [
        'Personal habit building',
        'Accountability partner (shared space)',
        'Family habits (kids chores)',
        'Team habits (standup attendance)'
      ]
    },
  
    MOOD_TRACKER: {
      id: 'mood-tracker',
      name: 'Mood Tracker',
      description: 'Track emotions and identify patterns over time',
      category: 'personal-life',
      features: [
        'Quick mood check-in',
        'Emotion intensity (1-10)',
        'Contributing factors (sleep, exercise, social)',
        'Charts and trends',
        'Trigger identification',
        'Export for therapist'
      ]
    },
  
    BOOK_TRACKER: {
      id: 'book-tracker',
      name: 'Reading List',
      description: 'Track books, ratings, notes, and reading goals',
      category: 'personal-life',
      features: [
        'Currently reading',
        'Want to read list',
        'Finished books',
        'Rating and review',
        'Reading stats (books per year, pages)',
        'Genre tracking',
        'Book recommendations',
        'Reading challenges/goals',
        'Quotes collection'
      ]
    },
  
    MOVIE_TV_TRACKER: {
      id: 'movie-tracker',
      name: 'Watch List',
      description: 'Track movies/shows, ratings, and recommendations',
      category: 'personal-life'
    },
  
    // ============================================
    // HEALTH & FITNESS
    // ============================================
  
    WORKOUT_LOGGER: {
      id: 'workout-log',
      name: 'Workout Logger',
      description: 'Track exercises, sets, reps, and personal records',
      category: 'health-fitness',
      features: [
        'Exercise library',
        'Custom workouts/routines',
        'Log sets, reps, weight',
        'Rest timer',
        'PR tracking',
        'Progress charts (strength over time)',
        'Volume calculations',
        'Workout templates',
        'Body part split tracking',
        'Notes per exercise'
      ],
      stateStructure: {
        workouts: [
          {
            id: 'uuid',
            date: '2024-12-26',
            name: 'Push Day',
            duration: '45 mins',
            exercises: [
              {
                exerciseId: 'bench-press',
                sets: [
                  { setNumber: 1, reps: 10, weight: 135, isWarmup: false },
                  { setNumber: 2, reps: 8, weight: 155, isPR: true }
                ]
              }
            ],
            notes: 'Felt strong today'
          }
        ],
        exercises: [
          { id: 'bench-press', name: 'Bench Press', category: 'chest', equipment: 'barbell' }
        ]
      },
      useCases: [
        'Personal training log',
        'Gym buddy accountability (shared)',
        'Coach-athlete tracking'
      ]
    },
  
    MEAL_PLANNER: {
      id: 'meal-planner',
      name: 'Meal Planner',
      description: 'Plan meals, track macros, save recipes',
      category: 'health-fitness',
      features: [
        'Weekly meal planner',
        'Recipe database',
        'Macro/calorie tracking',
        'Shopping list generation',
        'Meal prep planning',
        'Favorite meals',
        'Barcode scanner',
        'Restaurant meals database'
      ]
    },
  
    WATER_TRACKER: {
      id: 'water-tracker',
      name: 'Water Intake',
      description: 'Daily hydration tracking with reminders',
      category: 'health-fitness'
    },
  
    WEIGHT_TRACKER: {
      id: 'weight-tracker',
      name: 'Weight & Measurements',
      description: 'Body weight, measurements, and progress photos',
      category: 'health-fitness'
    },
  
    SLEEP_TRACKER: {
      id: 'sleep-tracker',
      name: 'Sleep Log',
      description: 'Track sleep quality, duration, and patterns',
      category: 'health-fitness'
    },
  
    // ============================================
    // PRODUCTIVITY & ORGANIZATION
    // ============================================
  
    TASK_MANAGER: {
      id: 'tasks',
      name: 'Task Manager',
      description: 'Kanban boards, lists, and task tracking',
      category: 'productivity',
      features: [
        'Multiple views (Kanban, List, Calendar)',
        'Projects and sub-tasks',
        'Due dates and reminders',
        'Priority levels',
        'Labels/tags',
        'Assignees (for shared spaces)',
        'Recurring tasks',
        'Time tracking',
        'Task templates',
        'Filters and search',
        'Completed tasks archive'
      ],
      stateStructure: {
        tasks: [
          {
            id: 'uuid',
            title: 'Finish proposal',
            description: 'Complete Q1 proposal for client',
            status: 'in-progress|todo|done',
            priority: 'high|medium|low',
            dueDate: '2024-12-30',
            assignedTo: 'user_id',
            tags: ['work', 'urgent'],
            subtasks: [
              { id: 'uuid', title: 'Research competitors', done: true }
            ],
            timeSpent: 120, // minutes
            createdAt: 'timestamp'
          }
        ],
        boards: [
          { id: 'uuid', name: 'Work Projects', columns: ['To Do', 'In Progress', 'Done'] }
        ]
      },
      useCases: [
        'Personal to-do list',
        'Team project management',
        'Household chores (family shared)',
        'Event planning tasks',
        'Client project tracking'
      ]
    },
  
    NOTES: {
      id: 'notes',
      name: 'Notes & Documents',
      description: 'Rich text notes with folders and search',
      category: 'productivity',
      features: [
        'Rich text editor',
        'Markdown support',
        'Folders/organization',
        'Tags',
        'Search',
        'Link notes (backlinks)',
        'Templates',
        'Table of contents',
        'Version history',
        'Share note publicly',
        'Collaborative editing (in shared spaces)'
      ]
    },
  
    LINK_LIBRARY: {
      id: 'link-library',
      name: 'Link Library',
      description: 'Bookmark and organize useful links',
      category: 'productivity',
      features: [
        'Save links with auto-preview',
        'Categories/folders',
        'Tags',
        'Search',
        'Archive dead links',
        'Share collections',
        'Browser extension'
      ]
    },
  
    CALENDAR: {
      id: 'calendar',
      name: 'Calendar & Events',
      description: 'Schedule events and reminders',
      category: 'productivity',
      features: [
        'Month/week/day views',
        'Create events',
        'Recurring events',
        'Reminders',
        'Color coding',
        'Sync with Google Calendar (future)',
        'Shared calendar (in shared spaces)',
        'Availability view'
      ]
    },
  
    GOALS_TRACKER: {
      id: 'goals',
      name: 'Goals & Milestones',
      description: 'Set and track long-term goals',
      category: 'productivity',
      features: [
        'SMART goals',
        'Milestones/checkpoints',
        'Progress tracking',
        'Deadline tracking',
        'Sub-goals',
        'Reflection notes',
        'Visual progress bars'
      ]
    },
  
    POMODORO: {
      id: 'pomodoro',
      name: 'Focus Timer',
      description: 'Pomodoro technique timer with stats',
      category: 'productivity',
      features: [
        '25/5 minute timer',
        'Customizable intervals',
        'Task association',
        'Daily focus stats',
        'Break reminders',
        'Ambient sounds (optional)'
      ]
    },
  
    // ============================================
    // FINANCE
    // ============================================
  
    EXPENSE_TRACKER: {
      id: 'expenses',
      name: 'Expense Tracker',
      description: 'Track spending and budgets',
      category: 'finance',
      features: [
        'Log expenses',
        'Categories (food, rent, entertainment)',
        'Monthly budgets',
        'Spending charts',
        'Receipt photos',
        'Recurring expenses',
        'Export to CSV',
        'Split expenses (in shared spaces)'
      ],
      useCases: [
        'Personal budgeting',
        'Shared expenses with partner',
        'Roommate expense splitting',
        'Small business tracking'
      ]
    },
  
    BUDGET_PLANNER: {
      id: 'budget',
      name: 'Budget Planner',
      description: 'Plan and track monthly budgets',
      category: 'finance'
    },
  
    SUBSCRIPTION_TRACKER: {
      id: 'subscriptions',
      name: 'Subscription Manager',
      description: 'Track recurring subscriptions and bills',
      category: 'finance',
      features: [
        'List subscriptions',
        'Monthly/annual costs',
        'Renewal reminders',
        'Total monthly cost',
        'Cancel suggestions (unused)',
        'Category breakdown'
      ]
    },
  
    // ============================================
    // RELATIONSHIPS & SOCIAL
    // ============================================
  
    DATE_IDEAS: {
      id: 'date-ideas',
      name: 'Date Ideas',
      description: 'Save and track date ideas with ratings',
      category: 'relationships',
      features: [
        'Ideas list (restaurants, activities)',
        'Mark as done',
        'Ratings and notes',
        'Location/address',
        'Price range',
        'Randomizer (pick random idea)',
        'Photos from date'
      ],
      useCases: [
        'Couples shared space',
        'Friend group hangout ideas'
      ]
    },
  
    GIFT_TRACKER: {
      id: 'gift-ideas',
      name: 'Gift Ideas',
      description: 'Track gift ideas for friends/family',
      category: 'relationships',
      features: [
        'People list',
        'Gift ideas per person',
        'Interests/wishlist',
        'Budget',
        'Occasions (birthday, holiday)',
        'Mark as purchased',
        'Links to products'
      ]
    },
  
    RELATIONSHIP_JOURNAL: {
      id: 'relationship-journal',
      name: 'Couple Journal',
      description: 'Shared journaling for couples',
      category: 'relationships',
      features: [
        'Both partners write',
        'Prompts (gratitude, memories)',
        'Mood check-ins',
        'Photos',
        'Anniversary countdown',
        'Memory lane (past entries)'
      ]
    },
  
    CONTACTS_MANAGER: {
      id: 'contacts',
      name: 'Personal CRM',
      description: 'Keep track of important people and interactions',
      category: 'relationships',
      features: [
        'Contact info',
        'Last contacted date',
        'Notes about person',
        'Reminders (reach out)',
        'Important dates (birthday)',
        'Conversation log',
        'Gift ideas for this person'
      ]
    },
  
    // ============================================
    // CREATIVE & HOBBIES
    // ============================================
  
    RECIPE_BOOK: {
      id: 'recipes',
      name: 'Recipe Book',
      description: 'Save and organize recipes',
      category: 'creative',
      features: [
        'Recipe cards',
        'Ingredients and instructions',
        'Photos',
        'Tags (dessert, vegan, quick)',
        'Cook time',
        'Difficulty',
        'Rating and notes',
        'Meal plan integration',
        'Shopping list generation',
        'Share recipes'
      ]
    },
  
    MUSIC_PRACTICE: {
      id: 'music-practice',
      name: 'Music Practice Log',
      description: 'Track music practice sessions',
      category: 'creative',
      features: [
        'Log practice sessions',
        'Pieces/songs worked on',
        'Techniques practiced',
        'Duration tracking',
        'Progress notes',
        'Goals (perform by date)',
        'Practice streak'
      ]
    },
  
    ART_PORTFOLIO: {
      id: 'art-portfolio',
      name: 'Art Portfolio',
      description: 'Showcase artwork and track projects',
      category: 'creative',
      features: [
        'Upload artwork images',
        'Project details',
        'Medium/technique',
        'Time spent',
        'Progress photos',
        'Exhibition history',
        'Client work vs personal',
        'Public gallery view'
      ]
    },
  
    GARDEN_PLANNER: {
      id: 'garden',
      name: 'Garden Planner',
      description: 'Plan and track garden/plants',
      category: 'creative',
      features: [
        'Plant database',
        'Planting schedule',
        'Watering schedule',
        'Harvest tracking',
        'Garden layout',
        'Photos over time',
        'Notes (fertilizer, issues)'
      ]
    },
  
    // ============================================
    // LEARNING & DEVELOPMENT
    // ============================================
  
    STUDY_PLANNER: {
      id: 'study-planner',
      name: 'Study Planner',
      description: 'Organize study sessions and track progress',
      category: 'learning',
      features: [
        'Subjects/courses',
        'Study sessions',
        'Topic checklist',
        'Flashcards',
        'Exam dates',
        'Study time tracking',
        'Resources/links',
        'Progress tracking'
      ]
    },
  
    SKILL_TRACKER: {
      id: 'skills',
      name: 'Skill Development',
      description: 'Track skills you\'re learning',
      category: 'learning',
      features: [
        'Skills list',
        'Proficiency levels',
        'Learning resources',
        'Practice log',
        'Milestones',
        'Certificates',
        'Projects using skill'
      ]
    },
  
    LANGUAGE_LEARNING: {
      id: 'language',
      name: 'Language Learning',
      description: 'Track language learning progress',
      category: 'learning',
      features: [
        'Vocabulary lists',
        'Daily practice log',
        'Grammar notes',
        'Conversation practice log',
        'Media consumed (books, shows)',
        'Speaking/writing practice',
        'Level assessment'
      ]
    },
  
    // ============================================
    // PROFESSIONAL & CAREER
    // ============================================
  
    JOB_SEARCH_TRACKER: {
      id: 'job-search',
      name: 'Job Search Tracker',
      description: 'Track job applications and interviews',
      category: 'professional',
      features: [
        'Applications list',
        'Status (applied, interviewing, offer, rejected)',
        'Company info',
        'Salary range',
        'Application date',
        'Interview notes',
        'Follow-up reminders',
        'Contacts',
        'Stats (response rate)'
      ]
    },
  
    NETWORKING_LOG: {
      id: 'networking',
      name: 'Professional Network',
      description: 'Track professional contacts and interactions',
      category: 'professional'
    },
  
    PROJECT_TRACKER: {
      id: 'projects',
      name: 'Project Portfolio',
      description: 'Document projects for portfolio',
      category: 'professional',
      features: [
        'Project details',
        'Technologies used',
        'Role/responsibilities',
        'Outcomes/metrics',
        'Screenshots/demos',
        'Links (GitHub, live site)',
        'Testimonials',
        'Timeline'
      ]
    },
  
    // ============================================
    // HOME & LIFESTYLE
    // ============================================
  
    SHOPPING_LIST: {
      id: 'shopping',
      name: 'Shopping Lists',
      description: 'Collaborative shopping lists',
      category: 'home',
      features: [
        'Multiple lists (groceries, household, wishlist)',
        'Check off items',
        'Quantities',
        'Categories',
        'Frequently bought',
        'Share with family/roommates',
        'Estimated total cost'
      ],
      useCases: [
        'Family grocery list',
        'Roommate household items',
        'Event shopping (party supplies)'
      ]
    },
  
    HOME_INVENTORY: {
      id: 'inventory',
      name: 'Home Inventory',
      description: 'Track possessions for insurance/organization',
      category: 'home',
      features: [
        'Items by room/category',
        'Photos',
        'Purchase date/price',
        'Warranty info',
        'Serial numbers',
        'Insurance documentation',
        'Total value calculation'
      ]
    },
  
    MAINTENANCE_LOG: {
      id: 'maintenance',
      name: 'Home Maintenance',
      description: 'Track home/car maintenance',
      category: 'home',
      features: [
        'Maintenance schedule',
        'Completed tasks',
        'Service history',
        'Costs',
        'Service providers',
        'Reminders (oil change, HVAC filter)',
        'Photos (before/after)'
      ]
    },
  
    MOVING_CHECKLIST: {
      id: 'moving',
      name: 'Moving Planner',
      description: 'Organize moving tasks and inventory',
      category: 'home'
    },
  
    // ============================================
    // TRAVEL & ADVENTURE
    // ============================================
  
    TRAVEL_PLANNER: {
      id: 'travel',
      name: 'Travel Planner',
      description: 'Plan trips with itineraries and packing lists',
      category: 'travel',
      features: [
        'Trip details',
        'Itinerary (day by day)',
        'Bookings (flights, hotels)',
        'Packing list',
        'Budget tracking',
        'Places to visit',
        'Restaurant wishlist',
        'Travel documents',
        'Photos/memories',
        'Trip sharing'
      ]
    },
  
    BUCKET_LIST: {
      id: 'bucket-list',
      name: 'Bucket List',
      description: 'Track life experiences and adventures',
      category: 'travel',
      features: [
        'Items list',
        'Categories (travel, food, adventure)',
        'Completed items',
        'Photos/memories',
        'Priority',
        'Cost estimate',
        'Target date',
        'Notes'
      ]
    },
  
    // ============================================
    // FAMILY & PARENTING
    // ============================================
  
    BABY_TRACKER: {
      id: 'baby-tracker',
      name: 'Baby Tracker',
      description: 'Track baby feeding, sleep, diapers',
      category: 'family',
      features: [
        'Feeding log',
        'Sleep tracking',
        'Diaper changes',
        'Growth milestones',
        'Vaccinations',
        'Doctor visits',
        'Photos',
        'Stats and patterns',
        'Share with partner/caregiver'
      ]
    },
  
    CHORE_CHART: {
      id: 'chores',
      name: 'Family Chore Chart',
      description: 'Assign and track family chores',
      category: 'family',
      features: [
        'Chore assignments',
        'Family members',
        'Completion tracking',
        'Points/rewards',
        'Recurring chores',
        'Allowance tracking'
      ]
    },
  
    // ============================================
    // COLLECTIONS & HOBBIES
    // ============================================
  
    WINE_CELLAR: {
      id: 'wine',
      name: 'Wine Collection',
      description: 'Track wine collection and tasting notes',
      category: 'collections'
    },
  
    GAME_COLLECTION: {
      id: 'games',
      name: 'Game Library',
      description: 'Track video games, board games collection',
      category: 'collections'
    },
  
    VINYL_COLLECTION: {
      id: 'vinyl',
      name: 'Record Collection',
      description: 'Catalog vinyl collection',
      category: 'collections'
    },
  
    // ============================================
    // UTILITIES & TOOLS
    // ============================================
  
    PASSWORD_VAULT: {
      id: 'passwords',
      name: 'Password Vault',
      description: 'Encrypted password storage',
      category: 'utilities',
      note: 'Space-specific passwords, encrypted client-side'
    },
  
    CALCULATOR: {
      id: 'calculator',
      name: 'Calculator',
      description: 'Advanced calculator with history',
      category: 'utilities',
      features: [
        'Basic operations',
        'Scientific functions',
        'History',
        'Unit conversions',
        'Percentage calculations'
      ],
      note: 'Actually useful as a quick-access tool in work/finance spaces'
    },
  
    TIMER_STOPWATCH: {
      id: 'timer',
      name: 'Timer & Stopwatch',
      description: 'Countdown timers and stopwatch',
      category: 'utilities'
    },
  
    CURRENCY_CONVERTER: {
      id: 'currency',
      name: 'Currency Converter',
      description: 'Real-time currency conversion',
      category: 'utilities',
      useCases: [
        'Travel planning space',
        'International business space'
      ]
    },
  
    STICKY_NOTES: {
      id: 'sticky-notes',
      name: 'Quick Notes',
      description: 'Post-it style quick notes',
      category: 'utilities',
      features: [
        'Colorful notes',
        'Pin to space',
        'Quick add',
        'Dismiss when done'
      ]
    }
  };
  
  // ============================================
  // SPACE TEMPLATES WITH WIDGET COMBINATIONS
  // ============================================
  
  export const MEANINGFUL_SPACE_TEMPLATES = {
    
    LIFE_WITH_PARTNER: {
      name: 'Life Together',
      description: 'Shared space for couples',
      privacy: 'shared',
      widgets: [
        'relationship-journal',
        'photo-album',
        'date-ideas',
        'calendar',
        'shopping',
        'expenses',
        'goals'
      ],
      layout: 'Dashboard with shared activities at center',
      why_useful: 'All couple activities in one place, both can contribute'
    },
  
    FAMILY_HUB: {
      name: 'Family Central',
      description: 'Shared space for family',
      privacy: 'shared',
      widgets: [
        'calendar',
        'shopping',
        'chores',
        'photo-album',
        'meal-planner',
        'events'
      ],
      why_useful: 'Coordinate family life, everyone sees same info'
    },
  
    PERSONAL_WELLNESS: {
      name: 'Wellness Journey',
      description: 'Track health and fitness',
      privacy: 'private',
      widgets: [
        'workout-log',
        'meal-planner',
        'water-tracker',
        'weight-tracker',
        'sleep-tracker',
        'mood-tracker',
        'progress-photos'
      ],
      why_useful: 'Holistic view of health, all metrics in one place'
    },
  
    SIDE_HUSTLE: {
      name: 'Side Business',
      description: 'Manage freelance/side business',
      privacy: 'private',
      widgets: [
        'projects',
        'tasks',
        'expenses',
        'notes',
        'calendar',
        'contacts',
        'goals'
      ],
      why_useful: 'Separate business from personal, professional organization'
    },
  
    TRIP_PLANNING: {
      name: 'Europe Trip 2025',
      description: 'Plan a specific trip',
      privacy: 'shared', // with travel buddies
      widgets: [
        'travel',
        'expenses',
        'photo-album',
        'notes',
        'link-library',
        'shopping' // packing list
      ],
      why_useful: 'Everything for one trip together, share with travel companions'
    },
  
    CREATIVE_PORTFOLIO: {
      name: 'My Portfolio',
      description: 'Showcase creative work',
      privacy: 'public',
      widgets: [
        'art-portfolio',
        'projects',
        'notes', // case studies
        'link-library' // social links
      ],
      why_useful: 'Public-facing portfolio with private workspace'
    },
  
    SELF_IMPROVEMENT: {
      name: 'Personal Growth',
      description: 'Track growth and learning',
      privacy: 'private',
      widgets: [
        'journal',
        'goals',
        'habit-tracker',
        'book-tracker',
        'skills',
        'mood-tracker'
      ],
      why_useful: 'Reflect and track all personal development'
    },
  
    HOME_MANAGEMENT: {
      name: 'Our Home',
      description: 'Manage household',
      privacy: 'shared', // roommates/family
      widgets: [
        'shopping',
        'expenses', // split bills
        'chores',
        'maintenance',
        'inventory',
        'notes'
      ],
      why_useful: 'Coordinate household with roommates/family'
    },
  
    STUDENT_LIFE: {
      name: 'College Semester',
      description: 'Organize academic life',
      privacy: 'private',
      widgets: [
        'study-planner',
        'tasks',
        'calendar',
        'notes',
        'goals',
        'expenses'
      ],
      why_useful: 'Keep academics organized, track deadlines'
    },
  
    PET_CARE: {
      name: 'Pet Care',
      description: 'Track pet health and care',
      privacy: 'shared', // family
      widgets: [
        'vet-log',
        'feeding-schedule',
        'photo-album',
        'notes',
        'expenses'
      ],
      why_useful: 'Shared pet responsibilities, health history'
    }
  };
  
  // What makes this BETTER than separate apps?
  export const WHY_SPACES_MATTER = {
    CONTEXTUAL_GROUPING: 'Related tools together (fitness journey = workouts + meals + progress photos)',
    SHARED_ACCESS: 'Invite partner to "Our Life" space, they see ALL relevant widgets',
    CROSS_WIDGET_CONNECTIONS: 'Journal entry can reference a photo, task can link to a note',
    PRIVACY_BOUNDARIES: 'Private wellness space, shared family space, public portfolio',
    CUSTOMIZABLE_LAYOUT: 'Arrange YOUR way, not locked into app structure',
    UNIFIED_INTERFACE: 'Don\'t switch apps, everything accessible in context',
    DATA_RELATIONSHIPS: 'Widgets can share data (expense tracker → budget planner)',
    PROGRESSIVE_DISCLOSURE: 'Start simple, add widgets as needed',
    SPACE_AS_ARTIFACT: 'The space itself becomes meaningful (our couple space, my fitness journey)'
  };