import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheck } from 'react-icons/fa';

const TaskManagerWidget = ({ widget, onConfigUpdate, isExpanded }) => {
  const [tasks, setTasks] = useState(widget.config?.tasks || [
    { id: 1, text: 'Review pull requests', done: false, createdAt: Date.now() },
    { id: 2, text: 'Update documentation', done: true, createdAt: Date.now() },
    { id: 3, text: 'Fix navigation bug', done: false, createdAt: Date.now() }
  ]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed
  
  // Save state to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      onConfigUpdate({ tasks });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [tasks]);
  
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([
        { 
          id: Date.now(), 
          text: newTask, 
          done: false,
          createdAt: Date.now()
        }, 
        ...tasks
      ]);
      setNewTask('');
    }
  };
  
  const toggleTask = (id) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, done: !t.done } : t
    ));
  };
  
  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };
  
  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.done));
  };
  
  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'completed') return t.done;
    return true;
  });
  
  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.done).length,
    completed: tasks.filter(t => t.done).length
  };
  
  return (
    <div className="task-widget">
      {/* Input */}
      <div className="task-input-group">
        <input 
          className="task-input"
          placeholder="Add new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button className="task-add-btn" onClick={addTask}>+</button>
      </div>
      
      {/* Filter */}
      {isExpanded && (
        <div className="task-filters">
          <button 
            className={`task-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`task-filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({stats.active})
          </button>
          <button 
            className={`task-filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({stats.completed})
          </button>
          {stats.completed > 0 && (
            <button className="task-clear-btn" onClick={clearCompleted}>
              Clear Completed
            </button>
          )}
        </div>
      )}
      
      {/* Task List */}
      <div className="task-list" style={{ maxHeight: isExpanded ? '500px' : '400px' }}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div key={task.id} className="task-item">
              <input 
                type="checkbox" 
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="task-checkbox"
              />
              <span className={`task-text ${task.done ? 'task-done' : ''}`}>
                {task.text}
              </span>
              <button 
                className="task-delete" 
                onClick={() => deleteTask(task.id)}
                title="Delete task"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="task-empty">
            <p>No tasks {filter !== 'all' ? `in "${filter}" filter` : 'yet'}</p>
          </div>
        )}
      </div>
      
      {/* Stats */}
      {isExpanded && tasks.length > 0 && (
        <div className="task-stats">
          <span>{stats.active} active</span>
          <span>•</span>
          <span>{stats.completed} completed</span>
        </div>
      )}
    </div>
  );
};

export default TaskManagerWidget;