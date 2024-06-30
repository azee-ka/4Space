import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskList.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTh, faList, faSort, faCheck } from '@fortawesome/free-solid-svg-icons';
import API_BASE_URL from '../../../../config';
import GetConfig from '../../../../general/components/Authentication/utils/config';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';
import TaskForm from '../../appComponents/TaskForm/TaskForm';
import { formatDate, timeAgo } from '../../../../general/utils/formatDate';
import { useNavigate } from 'react-router-dom';

const TaskList = () => {
    const navigate = useNavigate();

    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    const { token } = useAuthState();
    const config = GetConfig(token);
    const [isGridView, setIsGridView] = useState(true);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskFormIsOverlay, setTaskFormIsOverlay] = useState(false);

    const [sortOption, setSortOption] = useState('created_at'); // Default sort by created_at
    const [tasks, setTasks] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false); // State to control dropdown visibility

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/taskflow/get-tasks/?sort_by=${sortOption}`, config);
            setTasks(response.data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []); // Refetch tasks when sort option changes

    useEffect(() => {
        // Fetch user's preferred view from the backend
        const fetchPreferredView = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}api/apps/taskflow/get-is-grid-view/`, config);
                setIsGridView(response.data.is_grid_view);
            } catch (error) {
                console.error('Failed to fetch preferred view', error);
            }
        };

        fetchPreferredView();
    }, []);

    const handleCreateTask = async () => {
        setShowTaskForm(true);
        setTaskFormIsOverlay(true);
    };

    const handleCloseTaskForm = () => {
        setShowTaskForm(false);
        setTaskFormIsOverlay(false);
        navigate('');
    };




    const updatePreferredView = async () => {
        try {
            await axios.post(`${API_BASE_URL}api/apps/taskflow/update-view-mode/?is_grid_view=${!isGridView}`, null, config);
        } catch (error) {
            console.error('Failed to update preferred view', error);
        }
    };


    const toggleView = () => {
        setIsGridView((prev) => !prev);
        updatePreferredView();
    };

    useEffect(() => {
        fetchTasks();
    }, [sortOption]); // Refetch tasks when sort option changes

    const handleSortOptionChange = async (option) => {
        setSortOption(option); // Update the local state
        try {
            await axios.post(`${API_BASE_URL}/api/apps/taskflow/update-sort-option/`, { sort_option: option }, config);
            fetchTasks(); // Refetch tasks after updating sort option
        } catch (error) {
            console.error('Failed to update sort option', error);
        }
    };

    return tasks ? (
        <div className='task-list-page' onClick={() => setShowDropdown(false)}>
            <div className='task-list-page-inner'>
                <div className='task-list-header'>
                    <div className='task-list-header-inner'>
                        <FontAwesomeIcon
                            icon={isGridView ? faList : faTh}
                            onClick={toggleView}
                            className="view-toggle-icon"
                        />
                        <div className="sort-dropdown-container">
                            <FontAwesomeIcon className="view-toggle-icon" icon={faSort} onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }} />
                            {showDropdown && (
                                <div className="dropdown-content" onClick={(e) => e.stopPropagation()}>
                                    <div onClick={() => handleSortOptionChange('title')}>Sort by Title</div>
                                    <div onClick={() => handleSortOptionChange('description')}>Sort by Description</div>
                                    <div onClick={() => handleSortOptionChange('started')}>Sort by Started</div>
                                    <div onClick={() => handleSortOptionChange('completed')}>Sort by Completed</div>
                                    <div onClick={() => handleSortOptionChange('created_at')}>Sort by Created At</div>
                                    <div onClick={() => handleSortOptionChange('updated_at')}>Sort by Updated At</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className='task-list-page-content'>
                    <div className={`task-list-page- ${isGridView ? 'grid' : 'list'}`}>
                        {isGridView ? (
                            <div className='task-list-page-grid-inner'>
                                <div className='task-grid-create-button'>
                                    <h2>Tasks</h2>
                                    <button onClick={() => handleCreateTask()}>Create Task</button>
                                </div>
                                {tasks.map((task, index) => (
                                    <div
                                        key={index}
                                        className='task-item-in-grid'
                                        onMouseEnter={() => setHoveredTaskId(task.id)}
                                        onMouseLeave={() => setHoveredTaskId(null)}
                                    >
                                        <div className='task-item-in-grid-inner'>
                                            <div className='task-item-text'>
                                                {task.created_at === task.updated_at &&
                                                    <p className='task-updated-at'>
                                                        Last Updated {formatDate(task.created_at)}<br />{timeAgo(task.created_at)}
                                                    </p>
                                                }
                                                <h3 className="task-title">{task.title}</h3>
                                                <p className="task-description">{task.description.length <= 25 ? task.description : task.description.substr(0, 25) + '...'}</p>
                                                <p className='task-created-at'>Created {formatDate(task.updated_at)}<br />{timeAgo(task.updated_at)}</p>
                                            </div>
                                            <div className="task-status">
                                                {task.started ? (
                                                    task.completed ? (
                                                        <div className="status-circle completed">
                                                            <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                                        </div>
                                                    ) : (
                                                        <div className="status-circle in-progress">
                                                            <div
                                                                className="progress"
                                                                style={{
                                                                    transform: `rotate(${(50 / 100) * 360}deg)`,
                                                                    borderLeftColor: 50 >= 50 ? '#007bff' : 'transparent',
                                                                }}
                                                            ></div>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="status-circle not-started"></div>
                                                )}
                                            </div>
                                            {isGridView && hoveredTaskId === task.id && (
                                                <div className="task-tooltip">
                                                    <div className="task-tooltip-inner">
                                                        <div className='task-tooltip-header'>
                                                            <div className='task-tooltip-title'>
                                                                <h3>{task.title}</h3>
                                                                <div className='task-tooltip-meta-data'>
                                                                    <p className='task-updated-at'>
                                                                        Last Updated {formatDate(task.created_at)}<br />{timeAgo(task.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className='task-tooltip-status'>
                                                                <div className="task-status">
                                                                    {task.started ? (
                                                                        task.completed ? (
                                                                            <div className="status-circle completed">
                                                                                <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="status-circle in-progress">
                                                                                <div
                                                                                    className="progress"
                                                                                    style={{
                                                                                        transform: `rotate(${(50 / 100) * 360}deg)`,
                                                                                        borderLeftColor: 50 >= 50 ? '#007bff' : 'transparent',
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <div className="status-circle not-started"></div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='task-tooltip-content'>
                                                            <div className='task-tooltip-description-title'>
                                                                <h4>Notes</h4>
                                                            </div>
                                                            <div className='task-tooltip-description-content'>
                                                                <p>{task.description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='task-list-page-list-inner'>
                                {tasks.map((task, index) => (
                                    <div
                                        key={index}
                                        className='task-item-in-list'
                                        onMouseEnter={() => setHoveredTaskId(task.id)}
                                        onMouseLeave={() => setHoveredTaskId(null)}
                                    >
                                        <div className='task-item-in-list-inner'>
                                            <div className='task-item-text-list'>
                                                {task.created_at === task.updated_at &&
                                                    <p className='task-list-updated-at'>
                                                        Last Updated {formatDate(task.created_at)}<br />{timeAgo(task.created_at)}
                                                    </p>
                                                }
                                                <h3 className="task-list-title">{task.title}</h3>
                                                <p className="task-list-description">{task.description.length <= 25 ? task.description : task.description.substr(0, 25) + '...'}</p>
                                                <p className='task-list-created-at'>Created {formatDate(task.updated_at)}<br />{timeAgo(task.updated_at)}</p>
                                            </div>
                                            <div className='task-list-status-outer'>
                                                <div className="task-list-status">
                                                    {task.started ? (
                                                        task.completed ? (
                                                            <div className="status-circle completed">
                                                                <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                                            </div>
                                                        ) : (
                                                            <div className="status-circle in-progress">
                                                                <div
                                                                    className="progress"
                                                                    style={{
                                                                        transform: `rotate(${(50 / 100) * 360}deg)`,
                                                                        borderLeftColor: 50 >= 50 ? '#007bff' : 'transparent',
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="status-circle not-started"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showTaskForm && <TaskForm onClose={handleCloseTaskForm} taskFormIsOverlay={taskFormIsOverlay} fetchTasks={fetchTasks} />}
        </div>
    ) : (
        <div>Loading...</div>
    )
};

export default TaskList;
