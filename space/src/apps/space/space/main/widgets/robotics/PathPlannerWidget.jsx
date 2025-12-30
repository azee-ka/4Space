// PathPlannerWidget.jsx - Motion Planning with A* and RRT algorithms
import React, { useState, useRef, useEffect } from 'react';
import './styles/PathPlannerWidget.css';

const PathPlannerWidget = ({ widget, mode, isCompact }) => {
  const [algorithm, setAlgorithm] = useState('astar');
  const [gridSize, setGridSize] = useState(20);
  const [start, setStart] = useState({ x: 2, y: 2 });
  const [goal, setGoal] = useState({ x: 17, y: 17 });
  const [obstacles, setObstacles] = useState([]);
  const [path, setPath] = useState([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [stats, setStats] = useState({ pathLength: 0, nodesExplored: 0, timeMs: 0 });
  const canvasRef = useRef(null);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cellSize = Math.min(width, height) / gridSize;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, gridSize * cellSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(gridSize * cellSize, i * cellSize);
      ctx.stroke();
    }
    
    // Draw visited nodes
    ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
    visitedNodes.forEach(node => {
      ctx.fillRect(node.x * cellSize, node.y * cellSize, cellSize, cellSize);
    });
    
    // Draw obstacles
    ctx.fillStyle = '#ff4444';
    obstacles.forEach(obs => {
      ctx.fillRect(obs.x * cellSize, obs.y * cellSize, cellSize, cellSize);
    });
    
    // Draw path
    if (path.length > 1) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x * cellSize + cellSize / 2, path[0].y * cellSize + cellSize / 2);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
      }
      ctx.stroke();
    }
    
    // Draw start
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(start.x * cellSize + cellSize / 2, start.y * cellSize + cellSize / 2, cellSize / 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw goal
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(goal.x * cellSize + cellSize / 2, goal.y * cellSize + cellSize / 2, cellSize / 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
      canvas.width = size;
      canvas.height = size;
      drawGrid();
    }
  }, [start, goal, obstacles, path, visitedNodes, gridSize]);

  const heuristic = (a, b) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  const astar = () => {
    const startTime = Date.now();
    const openSet = [{ ...start, g: 0, h: heuristic(start, goal), f: heuristic(start, goal), parent: null }];
    const closedSet = [];
    const visited = [];
    
    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIdx = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < current.f) {
          current = openSet[i];
          currentIdx = i;
        }
      }
      
      if (current.x === goal.x && current.y === goal.y) {
        const resultPath = [];
        let temp = current;
        while (temp) {
          resultPath.unshift({ x: temp.x, y: temp.y });
          temp = temp.parent;
        }
        setPath(resultPath);
        setVisitedNodes(visited);
        setStats({ 
          pathLength: resultPath.length, 
          nodesExplored: visited.length, 
          timeMs: Date.now() - startTime 
        });
        return;
      }
      
      openSet.splice(currentIdx, 1);
      closedSet.push(current);
      visited.push({ x: current.x, y: current.y });
      
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];
      
      neighbors.forEach(neighbor => {
        if (neighbor.x < 0 || neighbor.x >= gridSize || neighbor.y < 0 || neighbor.y >= gridSize) return;
        if (obstacles.some(obs => obs.x === neighbor.x && obs.y === neighbor.y)) return;
        if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) return;
        
        const g = current.g + 1;
        const h = heuristic(neighbor, goal);
        const f = g + h;
        
        const existing = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);
        if (existing && g >= existing.g) return;
        
        if (existing) {
          existing.g = g;
          existing.h = h;
          existing.f = f;
          existing.parent = current;
        } else {
          openSet.push({ ...neighbor, g, h, f, parent: current });
        }
      });
    }
    
    setVisitedNodes(visited);
    setStats({ pathLength: 0, nodesExplored: visited.length, timeMs: Date.now() - startTime });
  };

  const planPath = () => {
    setIsPlanning(true);
    setPath([]);
    setVisitedNodes([]);
    setTimeout(() => {
      if (algorithm === 'astar') astar();
      setIsPlanning(false);
    }, 100);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const cellSize = canvas.width / gridSize;
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    
    const isObstacle = obstacles.some(obs => obs.x === x && obs.y === y);
    if (isObstacle) {
      setObstacles(obstacles.filter(obs => !(obs.x === x && obs.y === y)));
    } else if (!(x === start.x && y === start.y) && !(x === goal.x && y === goal.y)) {
      setObstacles([...obstacles, { x, y }]);
    }
  };

  const clearObstacles = () => {
    setObstacles([]);
    setPath([]);
    setVisitedNodes([]);
  };

  const generateMaze = () => {
    const newObstacles = [];
    for (let i = 0; i < gridSize * gridSize * 0.3; i++) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if (!(x === start.x && y === start.y) && !(x === goal.x && y === goal.y)) {
        newObstacles.push({ x, y });
      }
    }
    setObstacles(newObstacles);
    setPath([]);
    setVisitedNodes([]);
  };

  if (mode === 'compact' || isCompact) {
    return (
      <div className="path-planner-compact">
        <div className="planner-canvas-compact">
          <canvas ref={canvasRef} onClick={handleCanvasClick} />
        </div>
        <div className="planner-controls-compact">
          <button onClick={planPath} disabled={isPlanning}>
            {isPlanning ? 'Planning...' : 'Find Path'}
          </button>
          <button onClick={clearObstacles}>Clear</button>
        </div>
        {path.length > 0 && (
          <div className="planner-stats-compact">
            <span>Path: {path.length} steps</span>
            <span>Explored: {visitedNodes.length} nodes</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="path-planner-modal">
      <div className="planner-sidebar">
        <div className="sidebar-section">
          <h3>Algorithm</h3>
          <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
            <option value="astar">A* (A-Star)</option>
            <option value="dijkstra">Dijkstra</option>
            <option value="rrt">RRT</option>
            <option value="rrtstar">RRT*</option>
          </select>
        </div>
        
        <div className="sidebar-section">
          <h3>Grid Settings</h3>
          <label>Grid Size: {gridSize}x{gridSize}</label>
          <input
            type="range"
            min="10"
            max="40"
            value={gridSize}
            onChange={(e) => setGridSize(parseInt(e.target.value))}
          />
        </div>
        
        <div className="sidebar-section">
          <h3>Controls</h3>
          <button className="control-btn primary" onClick={planPath} disabled={isPlanning}>
            {isPlanning ? 'Planning...' : 'Plan Path'}
          </button>
          <button className="control-btn" onClick={generateMaze}>Generate Maze</button>
          <button className="control-btn" onClick={clearObstacles}>Clear Obstacles</button>
        </div>
        
        <div className="sidebar-section">
          <h3>Statistics</h3>
          <div className="stat-item">
            <span>Path Length:</span>
            <span>{stats.pathLength} steps</span>
          </div>
          <div className="stat-item">
            <span>Nodes Explored:</span>
            <span>{stats.nodesExplored}</span>
          </div>
          <div className="stat-item">
            <span>Planning Time:</span>
            <span>{stats.timeMs} ms</span>
          </div>
        </div>
      </div>
      
      <div className="planner-main">
        <div className="planner-viewport">
          <canvas ref={canvasRef} onClick={handleCanvasClick} />
          <div className="viewport-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }}></div>
              <span>Start</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f97316' }}></div>
              <span>Goal</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ff4444' }}></div>
              <span>Obstacle</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#00f0ff' }}></div>
              <span>Path</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathPlannerWidget;