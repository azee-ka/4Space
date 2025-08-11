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
import { defaultSettings } from "../../../context/DisplaySettingsContext";

/**
 * 4Chat — Next‑Gen Anonymous Chat
 * --------------------------------
 * Safer, required onboarding (DOB + gender + seeking), powerful matching.
 * Highlights
 * - Mandatory onboarding modal on first open: DOB, gender (male/female/other), seeking gender (male/female/other/any)
 * - Countries multi-select with strict/prefer/any
 * - Wait controls: general (default 3s), interest wait, country wait, max overall
 * - Opt-in anonymous pings to reconnect lost partners; Known list panel
 * - Bottom-right Connect/Stop FAB; in-composer Next button (left of text area)
 * - Larger composer, simplified settings (no language/region, no theme picker, no message length control)
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

// ---------- Guest display helpers (mirror of DisplayMenu guest apply) ----------
const GUEST_DEFAULTS = {
  themeMode: "dark",
  gradient: "linear",
  linearAngle: "128deg",
  gradientColors: [
    { color: "#7c3aed", alpha: 0.22 },
    { color: "#22d3ee", alpha: 0.16 },
    { color: "#10b981", alpha: 0.08 },
    { color: "#000000", alpha: 0.0 },
  ],
  fontSize: "1.08em",
  padding: "medium",
  animations: true,
  brightness: 0.98,
  contrast: 1.15,
  saturation: 1.12,
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const toRgba = (hex, a = 1) => {
  try {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch {
    return `rgba(124, 58, 237, ${a})`;
  }
};

const computeGuestGradient = (s) => {
  const src = (
    s.gradientColors?.length ? s.gradientColors : defaultSettings.gradientColors
  ).slice(0, 4);
  const cols = src.map((gc) => toRgba(gc.color, gc.alpha));
  const c0 = cols[0] ?? "rgba(124,58,237,0.35)";
  const c1 = cols[1] ?? c0;
  const c2 = cols[2] ?? c1;
  if (s.gradient === "linear") {
    const angle = s.linearAngle || "128deg";
    return `linear-gradient(${angle}, ${c0} 0%, ${c0} 18%, ${c1} 28%, ${c2} 40%, rgba(0,0,0,0) 58%)`;
  }
  const fallbackPos = defaultSettings.radialPosition || "50% 0%";
  const [px, py] = (s.radialPosition || fallbackPos).split(/\s+/);
  const pos = `${px || "50%"} ${py || "0%"}`;
  const sxPct = clamp(
    Number.isFinite(+s.radialSizeX)
      ? +s.radialSizeX
      : defaultSettings.radialSizeX ?? 85,
    30,
    120
  );
  const syPct = clamp(
    Number.isFinite(+s.radialSizeY)
      ? +s.radialSizeY
      : defaultSettings.radialSizeY ?? 70,
    30,
    120
  );
  return `radial-gradient(${sxPct}% ${syPct}% at ${pos}, ${c0} 0%, ${c0} 18%, ${c1} 28%, ${c2} 48%, rgba(0,0,0,0) 68%)`;
};

const setGuestEffectsStyle = (settings, { selector = "html" } = {}) => {
  const id = "guest-display-fx";
  let tag = document.getElementById(id);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = id;
    document.head.appendChild(tag);
  }
  const b = Number.isFinite(+settings.brightness) ? +settings.brightness : 1;
  const c = Number.isFinite(+settings.contrast) ? +settings.contrast : 1;
  const s = Number.isFinite(+settings.saturation) ? +settings.saturation : 1;
  tag.textContent = `
    ${selector} {
      filter: brightness(${b}) contrast(${c}) saturate(${s});
    }
  `;
};

const applyGuestDisplay = (settings) => {
  const root = document.documentElement;
  root.style.setProperty("--global-gradient", computeGuestGradient(settings));
  const effectiveTheme =
    settings.themeMode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : settings.themeMode || "system";
  root.setAttribute("data-theme", effectiveTheme);
  setGuestEffectsStyle(settings, { selector: "html" });
};

// --------------------------- Country utilities ---------------------------
const ALL_COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Côte d’Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

// --------------------------- Local Known / Ping helpers ---------------------------
const KNOWN_KEY = "fchat:knownPartners";
const PING_PREF_KEY = "fchat:allowPings";
const ONBOARD_KEY = "fchat:onboard"; // { dob, gender, seeking }

const loadKnown = () => {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveKnown = (arr) => {
  try {
    localStorage.setItem(KNOWN_KEY, JSON.stringify(arr));
  } catch {}
};

const loadAllowPings = () => {
  try {
    const raw = localStorage.getItem(PING_PREF_KEY);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return false;
  }
};

const saveAllowPings = (val) => {
  try {
    localStorage.setItem(PING_PREF_KEY, JSON.stringify(!!val));
  } catch {}
};

const loadOnboard = () => {
  try {
    const raw = localStorage.getItem(ONBOARD_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.dob || !obj?.gender || !obj?.seeking) return null;
    return obj;
  } catch {
    return null;
  }
};

const saveOnboard = (obj) => {
  try {
    localStorage.setItem(ONBOARD_KEY, JSON.stringify(obj));
  } catch {}
};

const makeTicket = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const calcAgeFromDob = (dobStr) => {
  try {
    const d = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  } catch {
    return undefined;
  }
};

// --------------------------- Country Modal ---------------------------
function CountryModal({ open, onClose, selected, onSave }) {
  const [query, setQuery] = useState("");
  const [pick, setPick] = useState(selected || []);

  useEffect(() => {
    if (open) setPick(selected || []);
  }, [open, selected]);

  const res = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const toggle = (c) => {
    setPick((arr) =>
      arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]
    );
  };

  if (!open) return null;
  return (
    <div className="fchat-modal" onClick={onClose}>
      <div className="fchat-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="fchat-modal-head">
          <h3>Select countries</h3>
          <button className="fchat-btn fchat-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <input
          className="fchat-input fchat-modal-search"
          placeholder="Search countries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="fchat-country-grid">
          {res.map((c) => (
            <button
              key={c}
              className={`fchat-chip ${pick.includes(c) ? "is-active" : ""}`}
              onClick={() => toggle(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="fchat-modal-foot">
          <div className="fchat-chosen">
            {pick.map((c) => (
              <span
                key={c}
                className="fchat-chip is-active"
                onClick={() => toggle(c)}
              >
                {c}
              </span>
            ))}
          </div>
          <button
            className="fchat-btn fchat-btn-primary"
            onClick={() => onSave(pick)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------- Onboarding Modal ---------------------------
function OnboardingModal({ open, initial, onSave }) {
  const [dob, setDob] = useState(initial?.dob || "");
  const [gender, setGender] = useState(initial?.gender || "male");
  const [seeking, setSeeking] = useState(initial?.seeking || "any");

  if (!open) return null;
  return (
    <div className="fchat-modal" role="dialog" aria-modal>
      <div className="fchat-modal-body">
        <div className="fchat-modal-head">
          <h3>Before you start</h3>
        </div>
        <div className="fchat-field">
          <label className="fchat-label">Date of birth</label>
          <input
            type="date"
            className="fchat-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div className="fchat-grid-2">
          <div className="fchat-field">
            <label className="fchat-label">Your gender</label>
            <select
              className="fchat-select"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="fchat-field">
            <label className="fchat-label">Looking for</label>
            <select
              className="fchat-select"
              value={seeking}
              onChange={(e) => setSeeking(e.target.value)}
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="fchat-modal-foot">
          <div className="fchat-muted">
            We never show your identity. DOB is used only to derive your age for
            matching safety.
          </div>
          <button
            className="fchat-btn fchat-btn-primary"
            onClick={() => onSave({ dob, gender, seeking })}
            disabled={!dob || !gender || !seeking}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------- Socket Session ----------------------------
function Session({ interests, onEvent, setSenderRef, sessionKey, meta }) {
  const deps = useMemo(
    () => [sessionKey, JSON.stringify(interests), JSON.stringify(meta)],
    [sessionKey, interests, meta]
  );

  const { sendMessage, isReady } = useWebSocket("anon-4chat", {
    onOpen: () => {
      onEvent({ type: "status", status: "searching" });
      sendMessage({
        type: "join",
        interests,
        allowPings: meta.allowPings,
        countries: meta.countries,
        countryMode: meta.countryMode,
        waits: {
          generalSec: meta.generalWaitSec,
          interestSec: meta.interestWaitSec,
          countrySec: meta.countryWaitSec,
          maxOverallSec: meta.maxOverallSec,
        },
        self: { age: meta.age, gender: meta.gender },
        seeking: { gender: meta.seekingGender },
      });
    },
    onMessage: (data) => {
      try {
        switch (data.type) {
          case "paired":
            onEvent({ type: "status", status: "paired" });
            onEvent({
              type: "partner",
              partner: data.partner || { flair: "Stranger", pid: data?.pid },
            });
            onEvent({ type: "system", text: "Connected. Say hi!" });
            if (meta.soundOnMatch) {
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
          case "pong":
            onEvent({ type: "system", text: "Ping delivered." });
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
      ping: (ticket) => sendMessage({ type: "ping", ticket }),
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
  const [activeTab, setActiveTab] = useState("basic");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [countryModal, setCountryModal] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboard, setOnboard] = useState(loadOnboard());

  // preferences
  const [interests, setInterests] = useState(["tech", "music"]);
  const [customInterest, setCustomInterest] = useState("");
  const [blurMedia, setBlurMedia] = useState(true);
  const [safeMode, setSafeMode] = useState(false);
  const [soundOnMatch, setSoundOnMatch] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  // matching refinements
  const [countries, setCountries] = useState([]);
  const [countryMode, setCountryMode] = useState("prefer");
  const [generalWaitSec, setGeneralWaitSec] = useState(3);
  const [interestWaitSec, setInterestWaitSec] = useState(15);
  const [countryWaitSec, setCountryWaitSec] = useState(20);
  const [maxOverallSec, setMaxOverallSec] = useState(60);

  // new: pings / known
  const [allowPings, setAllowPings] = useState(loadAllowPings());
  const [known, setKnown] = useState(loadKnown());
  const [lastTicket, setLastTicket] = useState(null);

  const listRef = useRef(null);
  const typingTimeout = useRef(null);
  const senderRef = useRef({
    sendText: () => {},
    sendTyping: () => {},
    next: () => {},
    ping: () => {},
  });

  // On load for guests: hydrate + apply display settings; keep in sync
  useEffect(() => {
    if (isAuthenticated) return;
    const loadAndApply = () => {
      try {
        const raw = localStorage.getItem("displaySettings:guest");
        const s = raw
          ? { ...GUEST_DEFAULTS, ...JSON.parse(raw) }
          : { ...GUEST_DEFAULTS };
        applyGuestDisplay(s);
      } catch {
        applyGuestDisplay(defaultSettings);
      }
    };
    loadAndApply();

    const onGuestChange = (e) => {
      const s = e.detail;
      if (s) applyGuestDisplay(s);
    };
    window.addEventListener("guestDisplaySettingsChanged", onGuestChange);
    const onStorage = (e) => {
      if (e.key === "displaySettings:guest") loadAndApply();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("guestDisplaySettingsChanged", onGuestChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [isAuthenticated]);

  // On first mount, enforce onboarding
  useEffect(() => {
    if (!onboard) setOnboardOpen(true);
  }, [onboard]);

  // Persist ping pref + known list
  useEffect(() => {
    saveAllowPings(allowPings);
  }, [allowPings]);
  useEffect(() => {
    saveKnown(known);
  }, [known]);

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
          if (evt.partner) {
            const ticket = makeTicket();
            setLastTicket(ticket);
            const knownItem = {
              id:
                evt.partner?.pid ||
                "p-" + Math.random().toString(36).slice(2, 10),
              flair: evt.partner?.flair || "Stranger",
              lastSeen: Date.now(),
              ticket,
            };
            setKnown((arr) => {
              const idx = arr.findIndex((k) => k.id === knownItem.id);
              if (idx >= 0) {
                const next = [...arr];
                next[idx] = { ...knownItem };
                return next;
              }
              return [knownItem, ...arr].slice(0, 50);
            });
          }
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
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status !== "paired") return;
    pushMsg({ sender: "me", text });
    senderRef.current.sendText(text);
    setInput("");
    setTyping(false);
    senderRef.current.sendTyping(false);
  }, [input, status]);

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
      setInput(v);
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
    [status, typing]
  );

  // Controls
  const canConnect =
    !!onboard && !!onboard.dob && !!onboard.gender && !!onboard.seeking;

  const connect = () => {
    if (!canConnect) {
      setOnboardOpen(true);
      return;
    }
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

  const pingKnown = (item) => {
    pushMsg({ sender: "system", text: `Ping sent to ${item.flair}.` });
    senderRef.current.ping(item.ticket);
  };

  const age = onboard?.dob ? calcAgeFromDob(onboard.dob) : undefined;

  return (
    <div
      className={`fchat fchat-theme-dark ${
        isAuthenticated ? "fchat-no-bg" : ""
      }  ${!isEmbedded ? "" : "fchat-bordered"}`}
    >
      {connected && (
        <Session
          interests={interests}
          onEvent={onEvent}
          setSenderRef={setSenderRef}
          sessionKey={sessionKey}
          meta={{
            autoNext,
            soundOnMatch,
            allowPings,
            countries,
            countryMode,
            generalWaitSec,
            interestWaitSec,
            countryWaitSec,
            maxOverallSec,
            age,
            gender: onboard?.gender,
            seekingGender: onboard?.seeking,
          }}
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
            <small className="fchat-sub">Anonymous · Safer · Smarter</small>
          </div>
        </div>
        <div className="fchat-actions">
          <Badge status={status} />
          <button
            className="fchat-btn fchat-btn-ghost"
            onClick={() => setShowSettings((s) => !s)}
            title="Toggle settings panel"
          >
            {showSettings ? "Hide Settings" : "Settings"}
          </button>

          {/* Guest display menu (persisted to localStorage) */}
          {!isAuthenticated && (
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
                guestMode={!isAuthenticated}
                defaultsOverride={GUEST_DEFAULTS}
              />
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div
        className={`fchat-content ${!isEmbedded ? "" : "fchat-bordered"}`}
        data-collapsed={!showSettings}
      >
        {showSettings && (
          <aside
            className={`fchat-sidebar ${
              !isEmbedded ? "fchat-glass" : "fchat-bordered"
            } ${!showSettings ? "is-collapsed" : ""}`}
          >
            {/* Tabs */}
            <div className="fchat-tabs">
              <button
                className={`fchat-tab ${
                  activeTab === "basic" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("basic")}
              >
                Basic
              </button>
              <button
                className={`fchat-tab ${
                  activeTab === "advanced" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("advanced")}
              >
                Advanced
              </button>
              <button
                className={`fchat-tab ${
                  activeTab === "known" ? "is-active" : ""
                }`}
                onClick={() => setActiveTab("known")}
              >
                Known
              </button>
            </div>

            {/* BASIC */}
            {activeTab === "basic" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Quick Match</h3>
                <p className="fchat-muted">
                  Pick interests and countries. Matching respects your seeking
                  preference.
                </p>

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

                <div className="fchat-field">
                  <label className="fchat-label">Countries (optional)</label>
                  <div className="fchat-row">
                    <div className="fchat-chosen-inline">
                      {countries.length ? (
                        countries.map((c) => (
                          <span key={c} className="fchat-chip is-active">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="fchat-muted">Any</span>
                      )}
                    </div>
                    <button
                      className="fchat-btn"
                      onClick={() => setCountryModal(true)}
                    >
                      Choose
                    </button>
                  </div>
                  <div className="fchat-row">
                    <label className="fchat-label">Match mode</label>
                    <select
                      className="fchat-select"
                      value={countryMode}
                      onChange={(e) => setCountryMode(e.target.value)}
                    >
                      <option value="strict">Strict (only chosen)</option>
                      <option value="prefer">
                        Prefer (broaden if no match)
                      </option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                </div>

                <button
                  className="fchat-btn fchat-btn-primary fchat-btn-wide"
                  onClick={connect}
                >
                  Start Matching
                </button>
              </div>
            )}

            {/* ADVANCED */}
            {activeTab === "advanced" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Advanced Controls</h3>
                <p className="fchat-muted">
                  Privacy, continuity, waits & density.
                </p>

                <div className="fchat-grid-2">
                  <div className="fchat-field">
                    <label className="fchat-label">
                      General wait (seconds)
                    </label>
                    <input
                      className="fchat-input"
                      type="number"
                      min={0}
                      max={30}
                      value={generalWaitSec}
                      onChange={(e) =>
                        setGeneralWaitSec(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="fchat-field">
                    <label className="fchat-label">
                      Interest wait (seconds)
                    </label>
                    <input
                      className="fchat-input"
                      type="number"
                      min={0}
                      max={180}
                      value={interestWaitSec}
                      onChange={(e) =>
                        setInterestWaitSec(Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="fchat-grid-2">
                  <div className="fchat-field">
                    <label className="fchat-label">
                      Country wait (seconds)
                    </label>
                    <input
                      className="fchat-input"
                      type="number"
                      min={0}
                      max={180}
                      value={countryWaitSec}
                      onChange={(e) =>
                        setCountryWaitSec(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="fchat-field">
                    <label className="fchat-label">
                      Max overall wait (seconds)
                    </label>
                    <input
                      className="fchat-input"
                      type="number"
                      min={5}
                      max={600}
                      value={maxOverallSec}
                      onChange={(e) => setMaxOverallSec(Number(e.target.value))}
                    />
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
                      className={`fchat-toggle ${
                        showTimestamps ? "is-on" : ""
                      }`}
                      onClick={() => setShowTimestamps((v) => !v)}
                      aria-pressed={showTimestamps}
                    />
                  </div>
                </div>

                <div className="fchat-panel">
                  <div className="fchat-row">
                    <span>Allow pings (stay anonymous)</span>
                    <button
                      className={`fchat-toggle ${allowPings ? "is-on" : ""}`}
                      onClick={() => setAllowPings((v) => !v)}
                      aria-pressed={allowPings}
                    />
                  </div>
                  <div className="fchat-row fchat-row-note">
                    <small className="fchat-muted">
                      If a connection drops, partners you chatted with can send
                      a one‑time ping to see if you’re still around. Identity is
                      never shared.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* KNOWN */}
            {activeTab === "known" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Known People (Anonymous)</h3>
                <p className="fchat-muted">
                  You’ve crossed paths before. Ping to reconnect if they also
                  allow pings.
                </p>
                {known.length === 0 && (
                  <div className="fchat-empty fchat-known-empty">
                    No one here yet. You’ll see people once you’ve chatted.
                  </div>
                )}
                {known.length > 0 && (
                  <div className="fchat-known-list">
                    {known.map((k) => (
                      <div className="fchat-known-item" key={k.id}>
                        <div className="fchat-known-left">
                          <div className="fchat-known-avatar">🫧</div>
                          <div className="fchat-known-meta">
                            <div className="fchat-known-name">{k.flair}</div>
                            <div className="fchat-known-sub">
                              Last seen {new Date(k.lastSeen).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="fchat-known-actions">
                          <button
                            className="fchat-btn fchat-btn-ghost"
                            onClick={() => pingKnown(k)}
                            title="Send anonymous ping"
                          >
                            Ping
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="fchat-panel">
                  <div className="fchat-row">
                    <span>Clear known list</span>
                    <button
                      className="fchat-btn fchat-btn-danger"
                      onClick={() => setKnown([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              {(status === "disconnected" || status === "error") &&
                lastTicket && (
                  <button
                    className="fchat-btn fchat-btn-ghost"
                    onClick={() => senderRef.current.ping(lastTicket)}
                  >
                    Ping Last
                  </button>
                )}
            </div>

            {/* Bottom-right FAB for primary actions */}
            <div className="fchat-fab">
              {(status === "paired" ||
                status === "searching" ||
                status === "connecting") && (
                <button
                  className="fchat-fab-btn fchat-fab-danger"
                  onClick={disconnect}
                  title="Stop"
                >
                  ✕
                </button>
              )}
              {(status === "idle" ||
                status === "disconnected" ||
                status === "error") && (
                <button
                  className="fchat-fab-btn fchat-fab-primary"
                  onClick={connect}
                  title="Connect"
                >
                  ⚡
                </button>
              )}
            </div>
          </div>

          {(status === "disconnected" || status === "error") && lastTicket && (
            <div className="fchat-reconnect-banner">
              <div className="fchat-reconnect-info">Lost the last partner?</div>
              <div className="fchat-reconnect-actions">
                <button
                  className="fchat-btn fchat-btn-ghost"
                  onClick={() => senderRef.current.ping(lastTicket)}
                >
                  Ping Last Partner
                </button>
                <button className="fchat-btn" onClick={connect}>
                  Search Again
                </button>
              </div>
            </div>
          )}

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
              <div
                key={m.id}
                className={`fchat-msg fchat-${
                  m.sender === "me"
                    ? "me"
                    : m.sender === "system"
                    ? "system"
                    : "partner"
                }`}
              >
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
            {/* Next button on the LEFT of the text field */}
            <button
              className="fchat-btn fchat-btn-warning fchat-next-inline"
              onClick={next}
              disabled={!(status === "paired" || status === "searching")}
              title="Next match"
            >
              Next ▷
            </button>

            <textarea
              className="fchat-inputarea fchat-inputarea-xl"
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
              rows={3}
            />
            <div className="fchat-composer-actions">
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

      <footer className="fchat-footer">
        <div className="fchat-tip">Enter: send · Shift+Enter: newline</div>
        <div className="fchat-legal">
          Stay safe. No personal info. Report bad actors.
        </div>
      </footer>

      {/* Country Modal */}
      <CountryModal
        open={countryModal}
        selected={countries}
        onClose={() => setCountryModal(false)}
        onSave={(pick) => {
          setCountries(pick);
          setCountryModal(false);
        }}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        open={onboardOpen}
        initial={onboard || undefined}
        onSave={(obj) => {
          saveOnboard(obj);
          setOnboard(obj);
          setOnboardOpen(false);
        }}
      />
    </div>
  );
};

export default FourChat;
