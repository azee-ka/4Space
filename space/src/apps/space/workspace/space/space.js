import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModalOverlay from './ModalOverlay';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Settings, Trash2, Copy, Send, User, Cpu } from 'lucide-react';
import './space.css';
import './modal.css';
import { formatDateTime } from '../../../../utils/formatDateTime';
import { useAuth } from '../../../../hooks/useAuth';

import {
  fetchSpaceProjects,
  runSpaceWorkflow,
  fetchSpaceWorkflowStatus,
  postSpaceProjectChat
} from '../../../../services/space';
import { SPACE_COPILOT_PROJECTS, SPACE_WORKFLOW } from '../../../../services/queryKeys';

const MAX_PARALLEL = 1;

export default function Space() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  // ---- State ----
  const [prompt, setPrompt] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const queueRef = useRef([]);
  const inFlight = useRef(0);
  const pollRef = useRef(null);

  // ---- Projects (sidebar) ----
  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: SPACE_COPILOT_PROJECTS,
    queryFn: fetchSpaceProjects
  });

  // ---- Workflow mutation ----
  const workflowMutation = useMutation({
    mutationFn: ({ prompt }) => runSpaceWorkflow({ prompt }),
    onSuccess: async (data) => {
      const wf = data.workflow;
      const tasks = Array.isArray(wf.tasks) ? wf.tasks : [];

      setAgents(tasks.map(t => ({ ...t, status: 'pending', result: '' })));
      queueRef.current = [...tasks];

      for (let i = 0; i < MAX_PARALLEL; i++) runNextAgent(wf.id);

      // Start polling for workflow completion
      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetchSpaceWorkflowStatus(wf.id);
          const done = Array.isArray(poll.tasks) && poll.tasks.every(t => t.status === 'done');
          if (done) clearInterval(pollRef.current);
        } catch {}
      }, 2000);

      setIsModalOpen(true);
      refetchProjects();
    },
    onError: () => {
      setIsModalOpen(false);
    }
  });

  // ---- Chat mutation ----
  const chatMutation = useMutation({
    mutationFn: ({ project, message }) => postSpaceProjectChat({ project, message }),
    onSuccess: (data) => {
      setChatMessages(m => [...m, { sender: 'bot', text: data.response || 'No response' }]);
    },
    onError: () => {
      setChatMessages(m => [...m, { sender: 'bot', text: 'Error replying.' }]);
    }
  });

  // ---- Agent streaming (manual SSE, not react-query) ----
  async function streamAgent(task, onToken, onDone, onError) {
    try {
      const res = await fetch(
        `/api/space/space/agent/${task.id}/stream/`,
        { headers: { Authorization: `Token ${authState.current.token}` } }
      );
      if (!res.ok) throw new Error(`SSE failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop(); // keep remainder
        for (const chunk of parts) {
          if (chunk.startsWith('data: ')) {
            const { id, token } = JSON.parse(chunk.slice(6));
            onToken(id, token);
          } else if (chunk.startsWith('event: done')) {
            onDone();
          }
        }
      }
    } catch (err) {
      onError(err);
    }
  }

  function runNextAgent() {
    if (!queueRef.current.length || inFlight.current >= MAX_PARALLEL) return;
    const task = queueRef.current.shift();
    inFlight.current++;

    setAgents(a =>
      a.map(x =>
        x.id === task.id ? { ...x, status: 'running', result: '' } : x
      )
    );

    streamAgent(
      task,
      (id, token) => {
        setAgents(a =>
          a.map(x =>
            x.id === id ? { ...x, result: (x.result || '') + token } : x
          )
        );
      },
      () => {
        setAgents(a =>
          a.map(x =>
            x.id === task.id ? { ...x, status: 'done' } : x
          )
        );
        inFlight.current--;
        runNextAgent();
      },
      err => {
        setAgents(a =>
          a.map(x =>
            x.id === task.id ? { ...x, status: 'failed' } : x
          )
        );
        inFlight.current--;
        runNextAgent();
      }
    );
  }

  // ---- Select project for chat ----
  function handleSelectProject(p) {
    setSelectedProject(p);
    const msgs = [{ sender: 'system', text: p.description }];
    (p.files || []).forEach(f =>
      msgs.push({ sender: 'bot', text: `**${f.filename}**\n\n${f.content}` })
    );
    setChatMessages(msgs);
    setIsModalOpen(false);
  }

  // ---- Chat send ----
  function sendChat() {
    if (!chatInput.trim() || !selectedProject) return;
    const txt = chatInput.trim();
    setChatMessages(m => [...m, { sender: 'user', text: txt }]);
    setChatInput('');
    chatMutation.mutate({ project: selectedProject.id, message: txt });
  }

  // ---- Workflow run ----
  function handleRunPrompt() {
    workflowMutation.mutate({ prompt });
  }

  return (
    <div className="space-wrapper">
      <aside className="copilot-panel glass">
        <h2 className="copilot-title">Copilot</h2>
        <textarea
          className="copilot-input"
          placeholder="Describe your workflow…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <button className="run-button" onClick={handleRunPrompt}>
          {workflowMutation.isLoading ? 'Running…' : 'Run Workflow'}
        </button>
        <div className="space-project-list">
          {projects.map(p => (
            <div
              key={p.id}
              className="space-project-card"
              onClick={() => handleSelectProject(p)}
            >
              <h4>{p.title}</h4>
              <small>{formatDateTime(p.created_at, true)}</small>
            </div>
          ))}
        </div>
      </aside>

      <main className="workflow-panel">
        {selectedProject ? (
          <div className="space-project-chat">
            <div className="space-chat-header space-glass">
              <button
                className="space-icon-btn"
                onClick={() => setSelectedProject(null)}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="space-chat-title">{selectedProject.title}</h2>
              <div className="space-chat-header-actions">
                <button className="space-icon-btn">
                  <Copy size={20} />
                </button>
                <button className="space-icon-btn">
                  <Trash2 size={20} />
                </button>
                <button className="space-icon-btn">
                  <Settings size={20} />
                </button>
              </div>
            </div>

            <div className="space-chat-container">
              {chatMessages.map((m, i) => (
                <div key={i} className={`space-chat-msg ${m.sender}`}>
                  <div className="space-avatar">
                    {m.sender === 'user' ? <User size={20} /> : <Cpu size={20} />}
                  </div>
                  <div className="space-bubble">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-chat-input-wrapper space-glass">
              <textarea
                className="space-chat-input"
                placeholder="Ask about this project…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                rows={1}
              />
              <div className='space-input-toolbar'>
                <button className="space-send-btn" onClick={sendChat}>
                  <Send />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <h1>Welcome to Workflow Space</h1>
            <p>Select or run a workflow to see details here.</p>
          </div>
        )}
      </main>

      <ModalOverlay
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prompt={prompt}
        agents={agents}
      />
    </div>
  );
}
