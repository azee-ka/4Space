import React from 'react';
import Masonry from 'react-masonry-css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './modal.css';
import { Copy } from 'lucide-react';

const EXTENSION_TO_LANGUAGE = {
  js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
  py: "python", java: "java", css: "css", html: "html",
  json: "json", md: "markdown", sh: "bash", go: "go",
  c: "c", cpp: "cpp", cs: "csharp", php: "php",
  rb: "ruby", swift: "swift",
};

export default function ModalOverlay({
  isOpen, onClose, prompt = '', agents = [],
  breakpointCols = { default: 3, 1200: 2, 768: 1 }
}) {
  if (!isOpen) return null;

  return (
    <div className="space-modal-overlay">
      <button className="space-modal-close" onClick={onClose}>×</button>
      <div className="space-modal-glass">
        <h2 className="space-modal-header">
          Working on: <em>{prompt}</em>
        </h2>
        <Masonry
          breakpointCols={breakpointCols}
          className="masonry-grid"
          columnClassName="masonry-column"
        >
          {agents.map(agent => (
            <div key={agent.id} className="space-modal-card">
              <h3>{agent.name}</h3>
              <p className={`status-${agent.status}`}>{agent.status}</p>
              <div className="agent-log">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const ext = agent.name.split('.').pop().toLowerCase();
                      const lang = match
                        ? match[1]
                        : EXTENSION_TO_LANGUAGE[ext] || '';

                      if (!inline && lang) {
                        const codeString = String(children).replace(/\n$/, '');
                        const handleCopy = () => {
                          navigator.clipboard.writeText(codeString);
                        };

                        return (
                          <div className="code-wrapper">
                            <button
                              className="code-copy-btn"
                              onClick={handleCopy}
                              title="Copy code"
                            >
                              <Copy size={16} /> Copy
                            </button>
                            <SyntaxHighlighter
                              PreTag="div"
                              style={oneDark}
                              language={lang}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {agent.result || ''}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </Masonry>
      </div>
    </div>
  );
}
