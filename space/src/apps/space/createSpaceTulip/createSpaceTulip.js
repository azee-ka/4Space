import React from 'react';
import { useNavigate } from 'react-router-dom';
import { simpleTools } from './simpleTools';
import './createSpaceTulip.scss';
import useApi from '../../../utils/useApi';

const CreateSpaceTulip = () => {
  const { callApi } = useApi();
  const navigate = useNavigate();

  const handleToolClick = async (tool) => {
    if (tool.apiToolType) {
      try {
        const data = {
          title: `${tool.name} - ${new Date().toISOString()}`,
          tool_type: tool.apiToolType,
        };
        const res = await callApi('space/projects/', 'POST', data);
        const id = res.data.id;
        const finalUrl = tool.launchPath.replace('{id}', id);
        window.open(finalUrl, '_blank');
      } catch (err) {
        alert('Failed to create project.');
      }
    } else {
      navigate(tool.path);
    }
  };

  return (
    <div className="tulip-menu">
        
      <div className="tulip-arrow" />
      <div className="tulip-tools-list">
        {simpleTools.map((tool, i) => (
          <div
            key={i}
            className="tulip-tool-item"
            onClick={() => handleToolClick(tool)}
          >
            <span className="icon">{tool.icon}</span>
            <span>{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateSpaceTulip;
