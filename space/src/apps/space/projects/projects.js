import React, { useEffect, useState } from "react";
import "./projects.css";
import {
  FiFileText,
  FiEdit3,
  FiLayers,
  FiCode,
  FiTerminal,
  FiList,
  FiGrid,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import useApi from "../../../utils/useApi";
import { formatDateTime } from "../../../utils/formatDateTime";
import useTabSessionSync from "../../../hooks/useTabSessionSync";

const toolIcons = {
  richtext: <FiFileText />,
  markdown: <FiEdit3 />,
  latex: <FiLayers />,
  code: <FiCode />,
  notebook: <FiTerminal />,
};

const toolLaunchPaths = {
  richtext: "/space/project/{id}/rich-editor",
  markdown: "/space/project/{id}/markdown-editor",
  latex: "/space/project/{id}/latex-editor",
  code: "/space/project/{id}/code-editor",
  notebook: "/space/project/{id}/notebook",
};

const SpaceProjects = () => {
  const { callApi } = useApi();
  const [projects, setProjects] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const { openProjectInNewTab } = useTabSessionSync();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await callApi("space/projects/");
        setProjects(res.data || []);
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }
    fetchProjects();
  }, []);


  const groupedProjects = projects.reduce((acc, project) => {
    const type = project.tool_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(project);
    return acc;
  }, {});


  return (
    <div className="space-projects-page">
      <div className="space-projects-header">
        <h1>My Projects</h1>
        <div className="projects-view-toggle">
          <button
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            <FiGrid />
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            <FiList />
          </button>
        </div>
      </div>



      {viewMode === "list" && (
        <div className="list-header-row">
          <div className="col-icon-title">Name</div>
          <div className="col-type">Type</div>
          <div className="col-updated">Last Updated</div>
          {/* <div className="col-id">ID</div> */}
        </div>
      )}

      <div className={`space-projects-content ${viewMode}`}>
        {viewMode === "list" &&
          projects.map((project) => {
            const updated = new Date(project.updated_at).toLocaleDateString();
            const idShort = project.id.slice(0, 8);
            const title = project.title;
            const href = toolLaunchPaths[project.tool_type]?.replace("{id}", project.id);

            return (
              <a
                key={project.id}
                onClick={(e) => {
                  e.preventDefault();
                  openProjectInNewTab(href);
                }}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-card list-row"
              >
                <div className="project-card-blur" />
                <div className="list-row-inner">
                  <div className="col-icon-title">
                    <span className="project-card-icon">{toolIcons[project.tool_type]}</span>
                    <span className="list-title">{title}</span>
                  </div>
                  <div className="col-type">{project.tool_type}</div>
                  <div className="col-updated">{formatDateTime(updated)}</div>
                </div>
              </a>
            );
          })}

        {viewMode === "grid" &&
          Object.entries(groupedProjects).map(([type, group]) => (
            <div key={type} className="project-group-column">
              <h3 className="project-group-header">{type.toUpperCase()}</h3>
              <div className="project-row">
                {group.map((project) => {
                  const updated = new Date(project.updated_at).toLocaleDateString();
                  const href = toolLaunchPaths[project.tool_type]?.replace("{id}", project.id);
                  return (
                    <a
                      key={project.id}
                      onClick={(e) => {
                        e.preventDefault();
                        openProjectInNewTab(href);
                      }}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-card"
                    >
                      <div className="project-card-blur" />
                      <div className="project-card-inner">
                        <div className="project-card-icon top">{toolIcons[project.tool_type]}</div>
                        <h3>{project.title}</h3>
                        <div className="project-meta">
                          <p className="project-type">{project.tool_type}</p>
                          <p className="project-dates">Last Updated: {formatDateTime(updated)}</p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SpaceProjects;
