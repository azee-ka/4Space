import React from 'react';
import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // assuming your auth hook exists
import Layout from '../struct/layout/layout';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import LoginPage from '../pages/auth/Login/login';
import RegisterPage from '../pages/auth/Register/register';

import FrontPage from '../pages/frontPage/frontpage';

import Profile from '../pages/profile/profile';
import Settings from '../pages/settings/settings';

import { PostProvider } from '../context/PostContext';
import { CreatePostProvider } from '../context/CreatePostContext';
import { EditorProvider } from '../utils/editor/EditorContext';
import Messages from '../pages/messages/messages';
import { ReportOverlayProvider } from '../context/ReportOverlayContext';

import Timeline from '../apps/home/timeline/timeline';
import CreatePost from '../apps/home/createPost/createPost';
import Dashboard from '../apps/home/dashboard/dashboard';
import Explore from '../apps/home/explore/explore';

import CommunitiesTimeline from '../apps/communities/timeline/timline';
import CommunitiesDashboard from '../apps/communities/dashboard/dashboard';
import { ModeProvider } from '../context/modeContext';
import CreateCommunity from '../apps/communities/createCommunity/createCommunity';
import Post from '../apps/home/post/post';
import ExchangeDetail from '../apps/communities/community/tabs/general/discussionBoard/exchangeDetail/exchangeDetail';
import PublicationDetail from '../apps/communities/community/tabs/research/publicationsTab/publicationDetail/publicationDetail';

import Space from '../apps/space/space/space';
import SpaceDashboard from '../apps/space/workspace/dashboard/dashboard';
import SpaceWorkspace from '../apps/space/workspace/spaceWorkspace/spaceWorkspace';
import SpaceTools from '../apps/space/workspace/tools/tools';
import SpaceProjects from '../apps/space/workspace/projects/projects';
import SpacePortfolio from '../apps/space/workspace/portfolio/portfolio';
import RichTextEditor from '../apps/space/workspace/tools/docsEditor/richEditor';
import CodeEditor from '../apps/space/workspace/tools/ide/ide';
import LaTeXEditor from '../apps/space/workspace/tools/latexEditor/latexEditor';
import MarkdownEditor from '../apps/space/workspace/tools/markdownEditor/markdownEditor';
import Calculator from '../apps/space/workspace/tools/calculator/calculator';
import NotebookEditor from '../apps/space/workspace/tools/notebookEditor/notebookEditor';
import { DisplaySettingsProvider } from '../context/DisplaySettingsContext';
import SpaceLibrary from '../apps/space/workspace/library/library';
import { CreateCommunityProvider } from '../context/CreateCommunityContext';
import SpaceRepositories from '../apps/space/workspace/repositories/repositories';
import RepositoryView from '../apps/space/workspace/repositories/repository/repositoryView';
import CommunityPage from '../apps/communities/community/community';
import OauthCallback from '../pages/auth/OauthCallback';
import useAppDataRefetcher from '../hooks/useAppDataRefetcher';
import { HandlesProvider } from '../context/HandlesContext';
import CommentThread from '../components/postUI/threadPost/CommentThread';
import FinanceDashboard from '../apps/space/finance/dashboard/financeDashboard';
import TradePage from '../apps/space/finance/tradePage/tradePage';
import StrategyPage from '../apps/space/finance/strategyPage/strategyPage';
import ResearchPage from '../apps/space/finance/researchPage/researchPage';
import PortfolioPage from '../apps/space/finance/portfolioPage/portfolioPage';
import LivePage from '../apps/space/finance/livePage/livePage';
import BacktestPage from '../apps/space/finance/backtestPage/backtestPage';
import Anon4Chat from '../pages/messages/anonChat/4chat';



// tiny wrapper so that useAppDataRefetcher is called *inside* Router
function DataRefetcher() {
  useAppDataRefetcher();
  return null;
}

const AppRouter = () => {
    const { isLoading, isAuthenticated, isAddingAccount } = useAuth();

    const privateRoutes = [
        // Home
        { name: 'Dashboard', path: '/dashboard', component: <Dashboard />, key: 'Dashboard' },
        { name: 'Timeline', path: '/', component: <Timeline />, key: 'Timeline' },
        { name: 'Timeline', path: '/timeline', component: <Timeline />, key: 'Timeline' },
        { name: 'Explore', path: '/explore', component: <Explore />, key: 'Explore' },
        { name: 'Create Post', path: '/create/post', component: <CreatePost />, key: 'CreatePost' },
        { name: 'Expand Post', path: '/posts/p/:postId', component: <Post />, key: 'ExpandPost' },
        { name: 'Expand Post Comments', path: '/comments/:id', component: <CommentThread />, key: 'ExpandPostComments' },

        // Communities
        { name: 'Community Dasboard', path: '/communities', component: <CommunitiesDashboard />, key: 'Communities Dashboard' },
        { name: 'Community Dasboard', path: '/communities/dashboard', component: <CommunitiesDashboard />, key: 'Communities Dashboard' },
        { name: 'Communities Timeline', path: '/communities/timeline', component: <CommunitiesTimeline />, key: 'Communities Timline' },
        { name: 'Community', path: '/communities/c/:slug', component: <CommunityPage />, key: 'Community' },
        { name: 'Community Exchange', path: '/communities/e/:exchangeId', component: <ExchangeDetail />, key: 'ExchangeDetail' },
        { name: 'Create Community', path: '/communities/create', component: <CreateCommunity />, key: 'CreateCommunity' },
        { name: 'Community Publication Detail', path: '/communities/research/:publicationId', component: <PublicationDetail />, key: 'PublicationDetailPage' },


        // Space
        // Workspace sub-app
{ name: 'Space', path: '/space', component: <Space />, key: 'SpaceHome' },
{ name: 'Space Home', path: '/space/workspace', component: <SpaceWorkspace />, key: 'SpaceHome' },
{ name: 'Space Dashboard', path: '/space/workspace/dashboard', component: <SpaceDashboard />, key: 'SpaceDashboard' },
{ name: 'Space Projects', path: '/space/workspace/projects', component: <SpaceProjects />, key: 'SpaceProjects' },
{ name: 'Space Library', path: '/space/workspace/library', component: <SpaceLibrary />, key: 'SpaceLibrary' },
{ name: 'Space Tools', path: '/space/workspace/tools', component: <SpaceTools />, key: 'SpaceTools' },
{ name: 'Create Space', path: '/space/workspace/create', component: <SpaceProjects />, key: 'SpaceCreate' },
{ name: 'Space Repositories', path: '/space/workspace/repositories', component: <SpaceRepositories />, key: 'SpaceRepositories' },
{ name: 'Space Repository', path: '/space/workspace/repositories/r/:repositoryId', component: <RepositoryView />, key: 'RepositoryView' },

{ name: 'Rich Editor', path: '/space/workspace/project/:projectId/rich-editor', component: <RichTextEditor />, key: 'RichTextEditor' },
{ name: 'Code Editor', path: '/space/workspace/project/:projectId/code-editor', component: <CodeEditor />, key: 'CodeEditor' },
{ name: 'Latex Editor', path: '/space/workspace/project/:projectId/latex-editor', component: <LaTeXEditor />, key: 'LaTeXEditor' },
{ name: 'Markdown Editor', path: '/space/workspace/project/:projectId/markdown-editor', component: <MarkdownEditor />, key: 'MarkdownEditor' },
{ name: 'Notebook', path: '/space/workspace/project/:projectId/notebook', component: <NotebookEditor />, key: 'NotebookEditor' },
{ name: 'Calculator', path: '/space/workspace/tools/calculator', component: <Calculator />, key: 'Calculator' },

// Finance sub-app
{ name: 'Finance Dashboard', path: '/space/finance/dashboard', component: <FinanceDashboard />, key: 'FinanceDashboard' },
{ name: 'Finance Trade', path: '/space/finance/trade', component: <TradePage />, key: 'FinanceTrade' },
{ name: 'Finance Startegy', path: '/space/finance/startegy', component: <StrategyPage />, key: 'FinanceStartegy' },
{ name: 'Finance Research', path: '/space/finance/research', component: <ResearchPage/>, key: 'FinanceResearch' },
{ name: 'Finance Portfolio', path: '/space/finance/portfolio', component: <PortfolioPage />, key: 'FinancePortfolio' },
{ name: 'Finance Live', path: '/space/finance/live', component: <LivePage />, key: 'FinanceLive' },
{ name: 'Finance Backtest', path: '/space/finance/backtest', component: <BacktestPage />, key: 'FinanceBacktest' },



        { name: 'Profile', path: '/profile/:username', component: <Profile />, key: 'Profile' },
        { name: 'My Profile', path: '/profile', component: <Profile />, key: 'MyProfile' },
        { name: 'Settings', path: '/settings', component: <Settings />, key: 'Settings' },

        { name: 'Messages', path: '/messages', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/inbox', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/requests', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/4chat', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/4chat', component: <Anon4Chat />, key: 'Messages' },
        { name: 'Messages', path: '/messages/inbox/c/:conversationId', component: <Messages />, key: 'Messages' },
        { name: 'Messages', path: '/messages/requests/c/:conversationId', component: <Messages />, key: 'Messages' },
    ];

    const publicRoutes = [
        { name: 'Login', path: '/login', component: <LoginPage />, key: 'Login' },
        { name: 'Login', path: '/login?from=add-account', component: <LoginPage />, key: 'Login' },
        { name: 'Register', path: '/register', component: <RegisterPage />, key: 'Register' },
        { name: 'Home', path: '/', component: <FrontPage />, key: 'FrontPage' },
        { name: 'Home', path: '/home', component: <FrontPage />, key: 'FrontPage' },
        { name: 'OAuth Callback', path: '/oauth/callback', component: <OauthCallback />, key: 'OauthCallback' },

        { name: 'Profile', path: '/profile/:username', component: <Profile />, key: 'Profile' },

        { name: 'Calculator', path: '/space/tools/calculator', component: <Calculator />, key: 'Calculator' },

        { name: 'Messages', path: '/4chat', component: <Anon4Chat />, key: 'Messages' },
    ];


    if (isLoading) {
        return <div>Loading...</div>;
    }

    const renderPrivateRoutes = () => {
        return privateRoutes.map((route, index) => {
            const Component = route.component;
            return (
                <Route
                    key={`${index}-${route.path}`}
                    path={route.path}
                    element={
                        <Layout
                            key={`${index}-${route.path}`}
                            className={route.path.substring(1)}
                            pageName={route.pageName}
                        >
                            {Component}
                        </Layout>
                    }
                />
            );
        });
    };

    return (
        <Router>
            {isAuthenticated && <DataRefetcher />}
            <DndProvider backend={HTML5Backend}>
                <HandlesProvider>
                    <DisplaySettingsProvider>
                        <ModeProvider>
                            <ReportOverlayProvider>
                                <EditorProvider>
                                    <PostProvider>
                                        <CreateCommunityProvider>
                                            <CreatePostProvider>
                                                <React.Suspense fallback={<div>Loading...</div>}>
                                                    <Routes>
                                                        {/* Public Routes (Accessible by everyone) */}
                                                        {!isAuthenticated && publicRoutes.map((route, index) => {
                                                            const Component = route.component;
                                                            return (
                                                                <Route
                                                                    key={`${index}-${route.path}`}
                                                                    path={route.path}
                                                                    element={
                                                                        <Layout
                                                                            key={`${index}-${route.path}`}
                                                                            className={`${route.path.substring(1)}`}
                                                                            pageName={route.pageName}
                                                                        >
                                                                            {Component}
                                                                        </Layout>
                                                                    }
                                                                />
                                                            );
                                                        })}

                                                        {/* Private Routes (Accessible only by authenticated users) */}
                                                        {isAuthenticated && renderPrivateRoutes()}


                                                        {/* If not authenticated, redirect to login page */}
                                                        {!isAuthenticated && !isAddingAccount && (
                                                            <Route path="/*" element={<Navigate to="/login" />} />
                                                        )}

                                                        {/* If authenticated, allow access to private routes */}
                                                        {isAuthenticated && (
                                                            <Route path="/*" element={<Navigate to="/" />} />
                                                        )}
                                                    </Routes>
                                                </React.Suspense>
                                            </CreatePostProvider>
                                        </CreateCommunityProvider>
                                    </PostProvider>
                                </EditorProvider>
                            </ReportOverlayProvider>
                        </ModeProvider>
                    </DisplaySettingsProvider>
                </HandlesProvider>
            </DndProvider>
        </Router>
    );
};

export default AppRouter;
