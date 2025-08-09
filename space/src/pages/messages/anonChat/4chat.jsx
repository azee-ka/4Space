import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./4chat.css";
import useWebSocket from "../../../hooks/useWebSocket";
import { useAuth } from "../../../hooks/useAuth";
import { useLocation } from "react-router-dom";
import DisplayMenu from "../../../struct/navbar/displayMenu/displayMenu";
import { ControlCenterIcon } from "../../../utils/CustomIcons";

/**
 * 4Chat — anonymous random chat UI (frontend wired to your useWebSocket)
 * ----------------------------------------------------------------------
 * - No brand mentions. All classnames are namespaced with `fchat-` to avoid
 *   collisions with the rest of your site.
 * - Cleaner control layout: primary actions grouped in header and a bottom
 *   toolbar; settings live in a collapsible sidebar.
 * - Extra settings: theme, compact mode, show timestamps, blur media,
 *   safe mode, sound on match, auto-next, region, language, max message
 *   length, custom interests.
 */

// ----------------------------- UI Helpers ------------------------------
const fmtTime = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const Badge = ({ status }) => {
  const map = {
    idle: { label: "Idle", dot: "var(--fchat-muted)" },
    connecting: { label: "Connecting", dot: "var(--fchat-amber)" },
    searching: { label: "Searching…", dot: "var(--fchat-cyan)" },
    paired: { label: "Connected", dot: "var(--fchat-lime)" },
    disconnected: { label: "Disconnected", dot: "var(--fchat-muted)" },
    error: { label: "Error", dot: "var(--fchat-rose)" },
  };
  const cfg = map[status] || map.idle;
  return (
    <span className="fchat-status-badge">
      <span className="fchat-status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

// --------------------------- Socket Session ----------------------------
function Session({ interests, onEvent, setSenderRef, sessionKey, meta }) {
  const deps = useMemo(
    () => [sessionKey, JSON.stringify(interests), meta.region, meta.language],
    [sessionKey, interests, meta]
  );

  const { sendMessage, isReady } = useWebSocket("anon-4chat", {
    onOpen: () => {
      onEvent({ type: "status", status: "searching" });
      sendMessage({
        type: "join",
        interests,
        region: meta.region,
        language: meta.language,
      });
    },
    onMessage: (data) => {
      try {
        switch (data.type) {
          case "paired":
            onEvent({ type: "status", status: "paired" });
            onEvent({
              type: "partner",
              partner: data.partner || { flair: "Stranger" },
            });
            onEvent({ type: "system", text: "Connected. Say hi!" });
            if (meta.soundOnMatch) {
              // fire and forget — system sound
              const a = new Audio("/sounds/match.mp3");
              a.volume = 0.35;
              a.play().catch(() => {});
            }
            break;
          case "message":
            onEvent({ type: "message", sender: "partner", text: data.text });
            break;
          case "typing":
            onEvent({ type: "typing", isTyping: !!data.isTyping });
            break;
          case "system":
            onEvent({ type: "system", text: data.text });
            break;
          case "left":
            onEvent({ type: "system", text: "Stranger disconnected." });
            onEvent({ type: "status", status: "searching" });
            onEvent({ type: "partner", partner: null });
            if (meta.autoNext) sendMessage({ type: "next" });
            break;
          default:
            break;
        }
      } catch {}
    },
    onClose: () => onEvent({ type: "status", status: "disconnected" }),
    onError: () => onEvent({ type: "status", status: "error" }),
    dependencies: deps,
  });

  useEffect(() => {
    if (!setSenderRef) return;
    setSenderRef(() => ({
      sendText: (text) => sendMessage({ type: "message", text }),
      sendTyping: (isTyping) => sendMessage({ type: "typing", isTyping }),
      next: () => sendMessage({ type: "next" }),
    }));
  }, [setSenderRef, sendMessage]);

  useEffect(() => {
    onEvent({ type: "ready", ready: isReady });
  }, [isReady, onEvent]);

  return null;
}

// ---------------------------- Main Component ---------------------------
const FourChat = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isEmbedded = location.pathname === "/messages/4chat";
  // chat state
  const [status, setStatus] = useState("idle");
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // ui state
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // preferences
  const [interests, setInterests] = useState(["tech", "music"]);
  const [customInterest, setCustomInterest] = useState("");
  const [region, setRegion] = useState("global");
  const [language, setLanguage] = useState("en");
  const [blurMedia, setBlurMedia] = useState(true);
  const [safeMode, setSafeMode] = useState(false);
  const [soundOnMatch, setSoundOnMatch] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [maxLen, setMaxLen] = useState(600);
  const [theme, setTheme] = useState("dark");

  const listRef = useRef(null);
  const typingTimeout = useRef(null);
  const senderRef = useRef({
    sendText: () => {},
    sendTyping: () => {},
    next: () => {},
  });

  const pushMsg = useCallback((msg) => {
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), ts: Date.now(), ...msg },
    ]);
  }, []);

  const onEvent = useCallback(
    (evt) => {
      switch (evt.type) {
        case "status":
          setStatus(evt.status);
          break;
        case "partner":
          setPartner(evt.partner);
          break;
        case "typing":
          setIsPartnerTyping(!!evt.isTyping);
          break;
        case "message":
          pushMsg({ sender: evt.sender, text: evt.text });
          break;
        case "system":
          pushMsg({ sender: "system", text: evt.text });
          break;
        case "ready":
          if (evt.ready && status === "connecting") setStatus("searching");
          break;
        default:
          break;
      }
    },
    [pushMsg, status]
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status !== "paired") return;
    if (text.length > maxLen) return;
    pushMsg({ sender: "me", text });
    senderRef.current.sendText(text);
    setInput("");
    setTyping(false);
    senderRef.current.sendTyping(false);
  }, [input, status, maxLen, pushMsg]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const onInput = useCallback(
    (e) => {
      const v = e.target.value;
      if (v.length <= maxLen) setInput(v);
      if (status === "paired" && !typing) {
        setTyping(true);
        senderRef.current.sendTyping(true);
      }
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        setTyping(false);
        if (status === "paired") senderRef.current.sendTyping(false);
      }, 1500);
    },
    [status, typing, maxLen]
  );

  // Controls
  const connect = () => {
    setMessages([]);
    setPartner(null);
    setStatus("connecting");
    setConnected(true);
    setSessionKey((k) => k + 1);
  };

  const disconnect = () => {
    setConnected(false);
    setStatus("disconnected");
  };

  const next = () => {
    if (status === "paired" || status === "searching") {
      setPartner(null);
      setStatus("searching");
      senderRef.current.next();
    }
  };

  const canChat = status === "paired";
  const setSenderRef = (fn) => {
    senderRef.current = fn ? fn : senderRef.current;
  };

  const addCustomInterest = () => {
    const tag = customInterest.trim().toLowerCase();
    if (!tag) return;
    if (!interests.includes(tag)) setInterests((p) => [...p, tag]);
    setCustomInterest("");
  };

  const toggleChip = (tag) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div
      className={`fchat ${
        theme === "dark" ? "fchat-theme-dark" : "fchat-theme-light"
      } ${isAuthenticated ? "fchat-no-bg" : ""}  ${
        !isEmbedded ? "" : "fchat-bordered"
      }`}
    >
      {connected && (
        <Session
          interests={interests}
          onEvent={onEvent}
          setSenderRef={setSenderRef}
          sessionKey={sessionKey}
          meta={{ region, language, autoNext, soundOnMatch }}
        />
      )}

      {/* Header */}
      <header
        className={`fchat-header ${
          !isEmbedded ? "fchat-glass" : "fchat-bordered"
        }`}
      >
        <div className="fchat-brand">
          <div className="fchat-logo">4</div>
          <div className="fchat-titles">
            <h1 className="fchat-h1">4Chat</h1>
            <small className="fchat-sub">Anonymous · Random pairing</small>
          </div>
        </div>
        <div className="fchat-actions">
          <Badge status={status} />
          <button
            className="fchat-btn fchat-btn-ghost"
            onClick={() => setShowSettings((s) => !s)}
          >
            {showSettings ? "Hide Settings" : "Settings"}
          </button>
          {status === "paired" && (
            <button
              className="fchat-btn fchat-btn-warning"
              onClick={next}
              title="Next"
            >
              Next ▷
            </button>
          )}
          {(status === "paired" ||
            status === "searching" ||
            status === "connecting") && (
            <button className="fchat-btn fchat-btn-danger" onClick={disconnect}>
              Stop ✕
            </button>
          )}
          {(status === "idle" ||
            status === "disconnected" ||
            status === "error") && (
            <button className="fchat-btn fchat-btn-primary" onClick={connect}>
              Connect ⚡
            </button>
          )}
          
          {!isAuthenticated &&
            <div
          className="display-settings-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <DisplayMenu
            toggleContent={
              <button aria-label="Display settings">
                <ControlCenterIcon />
              </button>
            }
          />
        </div>
        }
        </div>
      </header>

      {/* Body */}
      <div className={`fchat-content ${!isEmbedded ? "" : "fchat-bordered"}`}>
        {showSettings && (
          <aside
            className={`fchat-sidebar ${
              !isEmbedded ? "fchat-glass" : "fchat-bordered"
            }`}
          >
            <h3 className="fchat-h3">Match Preferences</h3>
            <p className="fchat-muted">Tune pairing and chat options.</p>

            <div className="fchat-field">
              <label className="fchat-label">Quick Interests</label>
              <div className="fchat-chips">
                {[
                  "tech",
                  "crypto",
                  "gaming",
                  "ai",
                  "music",
                  "art",
                  "movies",
                  "travel",
                  "fitness",
                  "memes",
                  "startups",
                  "books",
                ].map((tag) => (
                  <button
                    key={tag}
                    className={`fchat-chip ${
                      interests.includes(tag) ? "is-active" : ""
                    }`}
                    onClick={() => toggleChip(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="fchat-field">
              <label className="fchat-label">Add Custom Interest</label>
              <div className="fchat-row">
                <input
                  className="fchat-input"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="e.g., basketball"
                />
                <button
                  className="fchat-btn fchat-btn-ghost"
                  onClick={addCustomInterest}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="fchat-grid-2">
              <div className="fchat-field">
                <label className="fchat-label">Region</label>
                <select
                  className="fchat-select"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="global">Global</option>
                  <option value="na">North America</option>
                  <option value="eu">Europe</option>
                  <option value="apac">APAC</option>
                </select>
              </div>

              <div className="fchat-field">
                <label className="fchat-label">Language</label>
                <select
                  className="fchat-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>

            <div className="fchat-grid-2">
              <div className="fchat-field">
                <label className="fchat-label">Max message length</label>
                <input
                  className="fchat-input"
                  type="number"
                  min={120}
                  max={1200}
                  value={maxLen}
                  onChange={(e) => setMaxLen(Number(e.target.value))}
                />
              </div>

              <div className="fchat-field">
                <label className="fchat-label">Theme</label>
                <select
                  className="fchat-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>

            <div className="fchat-panel">
              <div className="fchat-row">
                <span>Blur media</span>
                <button
                  className={`fchat-toggle ${blurMedia ? "is-on" : ""}`}
                  onClick={() => setBlurMedia((v) => !v)}
                  aria-pressed={blurMedia}
                />
              </div>
              <div className="fchat-row">
                <span>Safe mode</span>
                <button
                  className={`fchat-toggle ${safeMode ? "is-on" : ""}`}
                  onClick={() => setSafeMode((v) => !v)}
                  aria-pressed={safeMode}
                />
              </div>
              <div className="fchat-row">
                <span>Sound on match</span>
                <button
                  className={`fchat-toggle ${soundOnMatch ? "is-on" : ""}`}
                  onClick={() => setSoundOnMatch((v) => !v)}
                  aria-pressed={soundOnMatch}
                />
              </div>
              <div className="fchat-row">
                <span>Auto-next on disconnect</span>
                <button
                  className={`fchat-toggle ${autoNext ? "is-on" : ""}`}
                  onClick={() => setAutoNext((v) => !v)}
                  aria-pressed={autoNext}
                />
              </div>
              <div className="fchat-row">
                <span>Compact messages</span>
                <button
                  className={`fchat-toggle ${compact ? "is-on" : ""}`}
                  onClick={() => setCompact((v) => !v)}
                  aria-pressed={compact}
                />
              </div>
              <div className="fchat-row">
                <span>Show timestamps</span>
                <button
                  className={`fchat-toggle ${showTimestamps ? "is-on" : ""}`}
                  onClick={() => setShowTimestamps((v) => !v)}
                  aria-pressed={showTimestamps}
                />
              </div>
            </div>

            <button
              className="fchat-btn fchat-btn-primary fchat-btn-wide"
              onClick={connect}
            >
              Start Matching
            </button>
          </aside>
        )}

        <main
          className={`fchat-chat ${
            !isEmbedded ? "fchat-glass" : "fchat-bordered"
          } ${compact ? "is-compact" : ""}`}
        >
          <div className="fchat-chat-head">
            <div className="fchat-avatar" aria-hidden>
              <span>🌀</span>
            </div>
            <div className="fchat-who">
              <div className="fchat-name">
                {partner?.flair ||
                  (status === "paired" ? "Stranger" : "Waiting…")}
              </div>
              <div className="fchat-sub">
                Interests: {interests.join(", ") || "any"}
              </div>
            </div>
            <div className="fchat-head-actions">
              {status === "paired" && (
                <button className="fchat-btn fchat-btn-warning" onClick={next}>
                  Next ▷
                </button>
              )}
              {(status === "paired" ||
                status === "searching" ||
                status === "connecting") && (
                <button
                  className="fchat-btn fchat-btn-danger"
                  onClick={disconnect}
                >
                  Stop ✕
                </button>
              )}
              {(status === "idle" ||
                status === "disconnected" ||
                status === "error") && (
                <button
                  className="fchat-btn fchat-btn-primary"
                  onClick={connect}
                >
                  Connect ⚡
                </button>
              )}
            </div>
          </div>

          <div className="fchat-chat-log" ref={listRef}>
            {messages.length === 0 && (
              <div className="fchat-empty">
                <div className="fchat-empty-big">Find your stranger.</div>
                <div className="fchat-muted">
                  Click <strong>Connect</strong> to start. Deal more kindly.
                  Stay anonymous.
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`fchat-msg fchat-${m.sender}`}>
                <div className="fchat-bubble">
                  <p>{m.text}</p>
                </div>
                {showTimestamps && (
                  <time className="fchat-time">{fmtTime(m.ts)}</time>
                )}
              </div>
            ))}

            {isPartnerTyping && (
              <div className="fchat-typing">
                <span className="fchat-typing-dot" />
                <span className="fchat-typing-dot" />
                <span className="fchat-typing-dot" />
              </div>
            )}
          </div>

          <div className={`fchat-composer ${canChat ? "" : "is-disabled"}`}>
            <textarea
              className="fchat-inputarea"
              placeholder={
                canChat
                  ? "Type a message…"
                  : status === "searching"
                  ? "Matching you with a stranger…"
                  : "Connect to start chatting"
              }
              value={input}
              onChange={onInput}
              onKeyDown={onKeyDown}
              disabled={!canChat}
              rows={1}
            />
            <div className="fchat-composer-actions">
              <span className="fchat-count">
                {input.length}/{maxLen}
              </span>
              <button
                className="fchat-btn fchat-btn-ghost"
                onClick={() => setInput((p) => (p + " 🔥").slice(0, maxLen))}
                disabled={!canChat}
              >
                React
              </button>
              <button
                className="fchat-btn fchat-btn-primary"
                onClick={handleSend}
                disabled={!canChat || !input.trim()}
              >
                Send ↩
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Footer toolbar for quick access on mobile */}
      <div className="fchat-toolbar">
        <div className="fchat-toolbar-left">
          <Badge status={status} />
        </div>
        <div className="fchat-toolbar-right">
          {status === "paired" && (
            <button className="fchat-btn fchat-btn-warning" onClick={next}>
              Next
            </button>
          )}
          {(status === "paired" ||
            status === "searching" ||
            status === "connecting") && (
            <button className="fchat-btn fchat-btn-danger" onClick={disconnect}>
              Stop
            </button>
          )}
          {(status === "idle" ||
            status === "disconnected" ||
            status === "error") && (
            <button className="fchat-btn fchat-btn-primary" onClick={connect}>
              Connect
            </button>
          )}
        </div>
      </div>

      <footer className="fchat-footer">
        <div className="fchat-tip">Enter: send · Shift+Enter: newline</div>
        <div className="fchat-legal">
          Stay safe. No personal info. Report bad actors.
        </div>
      </footer>
    </div>
  );
};

export default FourChat;
