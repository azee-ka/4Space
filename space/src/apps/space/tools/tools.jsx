// src/appc/space/tools/tools.jsx
import React from "react";
import { useMutation } from '@tanstack/react-query';
import { CREATE_SPACE_PROJECT } from "../../../services/queryKeys";
import { createSpaceProject } from "../../../services/space";
import "./tools.css";
import {
  FiEdit3, FiCode, FiFileText, FiTerminal, FiLayers, FiShare2,
  FiUser, FiBriefcase, FiEdit, FiCheckSquare
} from "react-icons/fi";
import { FaCalculator } from "react-icons/fa";

const tools = [
  {
    name: "Rich Text Editor",
    apiToolType: "richtext",
    launchPath: "/space/project/{id}/rich-editor",
    description: "Modern doc editor with word-processor features.",
    icon: <FiFileText />,
    type: "Writer",
    features: ["Headings", "Lists", "Links", "Export"],
  },
  {
    name: "Markdown Editor",
    apiToolType: "markdown",
    launchPath: "/space/project/{id}/markdown-editor",
    description: "Minimalist markdown with live preview.",
    icon: <FiEdit3 />,
    type: "Writer",
    features: ["GFM", "Tables", "Code Blocks", "Export"],
  },
  {
    name: "LaTeX Editor",
    apiToolType: "latex",
    launchPath: "/space/project/{id}/latex-editor",
    description: "Typeset academic papers with math & references.",
    icon: <FiLayers />,
    type: "Researcher",
    features: ["Math Mode", "Citations", "PDF Export"],
  },
  {
    name: "Code Editor",
    apiToolType: "code",
    launchPath: "/space/project/{id}/code-editor",
    description: "Lightweight IDE with syntax highlighting.",
    icon: <FiCode />,
    type: "Developer",
    features: ["Languages", "Themes", "Shortcuts"],
  },
  {
    name: "Notebook Cell",
    apiToolType: "notebook",
    launchPath: "/space/project/{id}/notebook",
    description: "Write and run code in a block-style format.",
    icon: <FiTerminal />,
    type: "Developer",
    features: ["Live Output", "Logs", "Eval"],
  },
  {
    name: "Advanced Calculator",
    path: "/space/tools/calculator",
    description: "A scientific calculator with advanced math, graphing, history, and programmable expressions.",
    icon: <FaCalculator />,
    type: "Math",
    features: [ "Scientific", "Advanced" ],
  },
  {
    name: "Mind Map",
    path: "/space/tools/mindmap",
    description: "Visually map your thoughts and creative flows.",
    icon: <FiShare2 />,
    type: "Thinker",
    features: ["Drag Nodes", "Zoom", "Connections"],
  },
  {
    name: "Task Planner",
    path: "/space/tools/tasks",
    description: "Plan personal or project-based to-dos.",
    icon: <FiCheckSquare />,
    type: "Planner",
    features: ["Due Dates", "Tags", "Drag to Reorder"],
  },
  {
    name: "PDF Annotator",
    path: "/space/tools/pdf",
    description: "Highlight and comment on uploaded PDFs.",
    icon: <FiEdit />,
    type: "Researcher",
    features: ["Highlight", "Note", "Search"],
  },
  {
    name: "Portfolio Builder",
    path: "/space/tools/portfolio",
    description: "Curate your projects into a personal portfolio.",
    icon: <FiBriefcase />,
    type: "Professional",
    features: ["Custom Sections", "Links", "Themes"],
  },
  {
    name: "Resume Generator",
    path: "/space/tools/resume",
    description: "Auto-generate resumes from your Space activity.",
    icon: <FiUser />,
    type: "Professional",
    features: ["Templates", "PDF Export", "Live Link"],
  }
];


const SpaceTools = () => {
  // React Query mutation
  const mutation = useMutation({
    mutationKey: CREATE_SPACE_PROJECT,
    mutationFn: ({ toolType, toolName, launchPath }) =>
      createSpaceProject({ toolType, toolName })
        .then((data) => ({
          id: data.id,
          launchPath
        })),
    onSuccess: ({ id, launchPath }) => {
      const finalUrl = launchPath.replace("{id}", id);
      window.open(finalUrl, "_blank");
    },
    onError: () => {
      alert("Something went wrong while launching the tool.");
    }
  });

  // Only tools with an apiToolType need project creation
  const isLaunchableTool = (tool) => !!tool.apiToolType && !!tool.launchPath;

  return (
    <div className="space-tools-page">
      <div className="space-tools-header">
        <h1>Tools</h1>
      </div>
      <div className="space-tools-content">
        {tools.map((tool, i) => {
          const handleClick = () => {
            if (isLaunchableTool(tool)) {
              mutation.mutate({
                toolType: tool.apiToolType,
                toolName: tool.name,
                launchPath: tool.launchPath
              });
            } else if (tool.path) {
              window.open(tool.path, "_blank");
            }
          };

          return (
            <div
              key={i}
              className="tool-card"
              onClick={handleClick}
              style={{ cursor: "pointer" }}
            >
              <div className="tool-card-blur" />
              <div className="tool-card-inner">
                <div className="tool-card-icon">{tool.icon}</div>
                <h3>{tool.name}</h3>
                <p className="tool-type">{tool.type}</p>
                <p className="tool-description">{tool.description}</p>
                <ul className="tool-features">
                  {tool.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpaceTools;