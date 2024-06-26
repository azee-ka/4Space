import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthDispatch } from '../../general/components/Authentication/utils/AuthProvider';
import './taskFlowApp.css';
import TaskFlowLayout from './taskFlowLayout/taskFlowLayout';

import Dashboard from './pages/Dashboard/Dashboard';
import TaskForm from './appComponents/TaskForm/TaskForm';
import TaskDetails from './pages/TaskDetails/TaskDetails';
import TaskList from './pages/TaskList/TaskList';
import Calendar from './pages/calendar/Calendar';

const TaskFlowApp = () => {
    const { isAuthenticated } = useAuthDispatch();

    const privateRoutes = [
        {
            path: '/',
            element: <Dashboard />,
            showSidebar: true,
            showNavbar: true,
        },
        {
            path: '/tasks',
            element: <TaskList />,
            showSidebar: true,
            showNavbar: true,
        },
        {
            path: '/calendar',
            element: <Calendar />,
            showSidebar: true,
            showNavbar: true,
        },
        // { path: '/profile', element: <Profile /> },
        {
            path: '/add-task',
            element: <TaskForm />,
            showSidebar: true,
            showNavbar: true,
        },
    ];

    return (
        <div className='task-flow-app'>
            <Routes>
                {isAuthenticated ? (
                    privateRoutes.map((route, index) => (
                        <Route
                            key={index}
                            path={route.path}
                            element={
                                <TaskFlowLayout
                                    className={`${route.path.substring(1)}`}
                                    pageName={route.name}
                                    showSidebar={route.showSidebar}
                                    showNavbar={route.showNavbar}
                                >
                                    {route.element}
                                </TaskFlowLayout>
                            }
                        />
                    ))
                ) : (
                    <Route path="/*" element={<Navigate to="/login" />} />
                )}
                <Route path="/*" element={<Navigate to="/login" />} />
            </Routes>
        </div>
    );
};


export default TaskFlowApp;
