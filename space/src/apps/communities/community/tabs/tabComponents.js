import CommunityGrades from './school/grades/grades';
import CommunityAssignments from './school/assignments/assignments';
import HomeTab from './home/home';
import Exchange from './general/discussionBoard/discussionBoard';

// import CommunityFunding from './startup/funding/funding';


export const TAB_COMPONENT_CATEGORIES = {
  general: {
    home: {
      key: 'home',
      label: 'Home',
      Component: HomeTab,
      icon: '🏠',
      category: 'general',
    },
    discussion: {
      key: 'discussion',
      label: 'Discussion',
      Component: Exchange,
      icon: '🏠',
      category: 'general',
    },
  },

  school: {
    grades: {
      key: 'grades',
      label: 'Grades',
      Component: CommunityGrades,
      icon: '📊',
      category: 'school',
    },
    assignments: {
      key: 'assignments',
      label: 'Assignments',
      Component: CommunityAssignments,
      icon: '📚',
      category: 'school',
    },
  },

  // startup: {
  //   funding: {
  //     key: 'funding',
  //     label: 'Funding',
  //     Component: CommunityFunding,
  //     icon: '💸',
  //     category: 'startup',
  //   },
  // },
};


export const TAB_COMPONENTS_FLAT = Object.entries(TAB_COMPONENT_CATEGORIES)
  .flatMap(([category, tabs]) =>
    Object.entries(tabs).map(([key, tab]) => [key.toLowerCase(), { ...tab, category }])
  )
  .reduce((acc, [key, tab]) => {
    acc[key] = tab;
    return acc;
  }, {});
