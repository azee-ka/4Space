// simpleTools.js
import { FiEdit3, FiCode, FiFileText, FiTerminal, FiLayers, FiShare2, FiUser, FiBriefcase, FiEdit, FiCheckSquare } from "react-icons/fi";

export const simpleTools = [
  {
    name: "Rich Text Editor",
    icon: <FiFileText />,
    launchPath: "/space/project/{id}/rich-editor",
    apiToolType: "richtext"
  },
  {
    name: "Markdown Editor",
    icon: <FiEdit3 />,
    launchPath: "/space/project/{id}/markdown-editor",
    apiToolType: "markdown"
  },
  {
    name: "LaTeX Editor",
    icon: <FiLayers />,
    launchPath: "/space/project/{id}/latex-editor",
    apiToolType: "latex"
  },
  {
    name: "Code Editor",
    icon: <FiCode />,
    launchPath: "/space/project/{id}/code-editor",
    apiToolType: "code"
  },
  {
    name: "Notebook Cell",
    icon: <FiTerminal />,
    launchPath: "/space/project/{id}/notebook",
    apiToolType: "notebook"
  },
  {
    name: "Mind Map",
    icon: <FiShare2 />,
    path: "/space/tools/mindmap"
  },
  {
    name: "Task Planner",
    icon: <FiCheckSquare />,
    path: "/space/tools/tasks"
  },
  {
    name: "PDF Annotator",
    icon: <FiEdit />,
    path: "/space/tools/pdf"
  },
  {
    name: "Portfolio Builder",
    icon: <FiBriefcase />,
    path: "/space/tools/portfolio"
  },
  {
    name: "Resume Generator",
    icon: <FiUser />,
    path: "/space/tools/resume"
  }
];
