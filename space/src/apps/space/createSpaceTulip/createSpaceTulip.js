import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { simpleTools } from "./simpleTools";
import "./createSpaceTulip.css";
import useApi from "../../../utils/useApi";

const CreateSpaceTulip = ({ anchorRef, onClose }) => {
  const tulipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { callApi } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const anchor = anchorRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 12
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tulipRef.current &&
        !tulipRef.current.contains(e.target) &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  
  const handleToolClick = async (tool) => {
    onClose();
    if (tool.apiToolType) {
      try {
        const data = {
          title: `${tool.name} - ${new Date().toISOString()}`,
          tool_type: tool.apiToolType
        };
        const res = await callApi("space/projects/", "POST", data);
        const id = res.data.id;
        const finalUrl = tool.launchPath.replace("{id}", id);
        window.open(finalUrl, "_blank");
      } catch (err) {
        alert("Failed to create project.");
      }
    } else {
      navigate(tool.path);
    }
  };

  return (
    <div
      className="tulip-menu"
      ref={tulipRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="tulip-arrow" />
      <div className="tulip-tools-list">
        {simpleTools.map((tool, i) => (
          <div key={i} className="tulip-tool-item" onClick={() => handleToolClick(tool)}>
            <span className="icon">{tool.icon}</span>
            <span>{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateSpaceTulip;
