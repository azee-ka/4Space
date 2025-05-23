import CommunityGrades from './school/grades/grades';
import CommunityAssignments from './school/assignments/assignments';
import HomeTab from './home/home';
import Exchange from './general/discussionBoard/exchangeBoard';
import PublicationsTab from './research/publicationsTab/publicationsTab';
import PeerReviewTab from './research/peerReviewTab/peerReviewTab';
import PreprintsTab from './research/preprintsTab/preprintsTab';
import DatasetsTab from './research/datasetsTab/datasetsTab';
import CollaborationTab from './research/collaborationTab/collaborationTab';

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
    exchange: {
      key: 'exchange',
      label: 'Exchange',
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
  research: {
    publications: {
      key: 'publications',
      label: 'Publications',
      Component: PublicationsTab,
      icon: '📄',
      category: 'research',
    },
    peerreview: {
      key: 'peerreview',
      label: 'Peer Review',
      Component: PeerReviewTab,
      icon: '🔍',
      category: 'research',
    },
    preprints: {
      key: 'preprints',
      label: 'Preprints',
      Component: PreprintsTab,
      icon: '📝',
      category: 'research',
    },
    datasets: {
      key: 'datasets',
      label: 'Datasets',
      Component: DatasetsTab,
      icon: '📊',
      category: 'research',
    },
    collaboration: {
      key: 'collaboration',
      label: 'Collaboration',
      Component: CollaborationTab,
      icon: '🤝',
      category: 'research',
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
