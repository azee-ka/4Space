import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../../../config';
import GetConfig from '../../../../general/components/Authentication/utils/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './TaskForm.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from '../../../../general/components/Authentication/utils/AuthProvider';

const TaskForm = ({ onClose, taskFormIsOverlay, fetchTasks }) => {
    const { token } = useAuthState();
    const navigate = useNavigate();
    const config = GetConfig(token)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [completed, setCompleted] = useState(false);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (taskFormIsOverlay) {
            window.history.replaceState(null, '', '/taskflow/add-task');
        }
    }, []);

    const handleCreateTaskSubmit = async (title, description, completed, started) => {
        try {
            const newTaskData = {
                title: title,
                description: description,
                completed: completed,
                started: started,
            };
            const response = await axios.post(`${API_BASE_URL}api/apps/taskflow/create-task/`, newTaskData, config);
            console.log(response.data);

        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        handleCreateTaskSubmit(title, description, completed, started);
        if (taskFormIsOverlay) {
            await fetchTasks(); // Wait for the tasks to be updated
            onClose(); // Close the form after submission
        } else {
            navigate('/tasks');
        }
    };
    
    return (
        <div className={`task-form-overlay${taskFormIsOverlay ? '' : '-non-overlay'}`} onClick={onClose}>
            {!taskFormIsOverlay &&
                <div className='task-form-non-overlay-title'>
                    <h2>Create New Task</h2>
                </div>
            }
            <div className={`task-form${taskFormIsOverlay ? '' : '-non-overlay'}`} onClick={(e) => e.stopPropagation()}>
                {taskFormIsOverlay &&
                    <button className="close-button" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                }
                {taskFormIsOverlay && <div className={`task-form-header`}>
                    <h2>Create New Task</h2>
                </div>}
                <form onSubmit={handleSubmit}>
                    <div className='task-form-non-overlay-edit-menu'>

                    </div>
                    <div className={`task-form-title-field${taskFormIsOverlay ? '' : '-non-overlay'}`}>
                        <textarea
                            id='titleTextarea'
                            placeholder='Title'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <label htmlFor='titleTextarea'>Title</label>
                    </div>
                    <div className={`task-form-description-field${taskFormIsOverlay ? '' : '-non-overlay'}`}>
                        <textarea
                            id='descriptionTextarea'
                            placeholder='Description'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                        <label htmlFor='descriptionTextarea'>Description</label>
                    </div>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
