// src/components/CreateSpaceTulip.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { simpleTools } from './simpleTools';
import './createSpaceTulip.css';
import { useMutation } from '@tanstack/react-query';
import { CREATE_SPACE_PROJECT } from '../../../../services/queryKeys'; // Use your shared key!
import { createSpaceProject } from '../../../../services/space';

const CreateSpaceTulip = () => {
  const navigate = useNavigate();

  // Set up mutation
  const mutation = useMutation({
    mutationKey: CREATE_SPACE_PROJECT,
    mutationFn: ({ apiToolType, name }) =>
      createSpaceProject({ toolType: apiToolType, toolName: name }),
  });

  const handleToolClick = async (tool) => {
    if (tool.apiToolType) {
      try {
        const data = await mutation.mutateAsync({
          apiToolType: tool.apiToolType,
          name: tool.name,
        });
        const id = data.id;
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
            style={{
              opacity: mutation.isLoading ? 0.7 : 1,
              pointerEvents: mutation.isLoading ? "none" : "auto",
            }}
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
