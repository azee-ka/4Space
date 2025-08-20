// src/pages/messages/anonChat/4chat.jsx
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
 * 4Chat — Anonymous chat (plain transcript)
 * - Clean reset on each new connection/next
 * - No system/status lines inside the transcript
 * - Transcript lines like: "Stranger: ..." / "You: ..."
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

// mm:ss formatting for live timers
const fmtMMSS = (secs) => {
  try {
    if (!Number.isFinite(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } catch {
    return "00:00";
  }
};

// ----------------------------- Partner display helpers ------------------------------
const genderToLetter = (g) => {
  if (!g) return "?";
  const s = String(g).toLowerCase();
  if (s.startsWith("m")) return "M";
  if (s.startsWith("f")) return "F";
  return "?";
};

const codeToFlag = (cc) => {
  if (!cc || !/^[A-Z]{2}$/.test(cc)) return "🏳️";
  const a = cc[0].toUpperCase();
  const b = cc[1].toUpperCase();
  const base = 0x1f1e6;
  const toRI = (ch) => base + (ch.charCodeAt(0) - 65);
  return String.fromCodePoint(toRI(a), toRI(b));
};

const extractCountryCode = (p) => {
  const raw =
    p?.countryCode ||
    p?.country_code ||
    p?.countryCode2 ||
    p?.country_code2 ||
    p?.cc ||
    p?.country ||
    p?.countryName ||
    p?.country_name ||
    p?.iso2 ||
    p?.loc?.cc;
  if (!raw) return null;
  const val = String(raw).trim();
  if (/^[A-Za-z]{2}$/.test(val)) return val.toUpperCase();
  const name = val.toLowerCase();
  const map = {
    "united states": "US",
    "united states of america": "US",
    usa: "US",
    us: "US",
    "united kingdom": "GB",
    uk: "GB",
    england: "GB",
    scotland: "GB",
    wales: "GB",
    "northern ireland": "GB",
    india: "IN",
    canada: "CA",
    australia: "AU",
    germany: "DE",
    france: "FR",
    spain: "ES",
    italy: "IT",
    netherlands: "NL",
    brazil: "BR",
    mexico: "MX",
    japan: "JP",
    "south korea": "KR",
    "republic of korea": "KR",
    korea: "KR",
    "north korea": "KP",
    china: "CN",
    russia: "RU",
    "russian federation": "RU",
    uae: "AE",
    "united arab emirates": "AE",
    "saudi arabia": "SA",
    turkey: "TR",
    "czech republic": "CZ",
    czechia: "CZ",
    vietnam: "VN",
    laos: "LA",
    myanmar: "MM",
    switzerland: "CH",
    sweden: "SE",
    norway: "NO",
    denmark: "DK",
    finland: "FI",
    ireland: "IE",
    poland: "PL",
    portugal: "PT",
    greece: "GR",
    romania: "RO",
    bulgaria: "BG",
    hungary: "HU",
    austria: "AT",
    belgium: "BE",
    "new zealand": "NZ",
    singapore: "SG",
  };
  return map[name] || null;
};

const renderPartnerHeader = (p) => {
  const g = genderToLetter(p?.gender ?? p?.g ?? p?.sex);
  const cc = extractCountryCode(p);
  const flag = codeToFlag(cc || "");
  const ccTxt = cc || "??";
  return `${g} from ${ccTxt} ${flag}`;
};

// ---------- Guest display helpers ----------
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
      h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
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
    Number.isFinite(+s.radialSizeX) ? +s.radialSizeX : defaultSettings.radialSizeX ?? 85,
    30,
    120
  );
  const syPct = clamp(
    Number.isFinite(+s.radialSizeY) ? +s.radialSizeY : defaultSettings.radialSizeY ?? 70,
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
    ${selector} { filter: brightness(${b}) contrast(${c}) saturate(${s}); }
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

// --------------------------- Country detection + age ---------------------------
const KNOWN_KEY = "fchat:knownPartners";
const PING_PREF_KEY = "fchat:allowPings";
const ONBOARD_KEY = "fchat:onboard"; // { dob, gender, seeking, accepted18, countryCode?, countryName? }
const INTERESTS_KEY = "fchat:interests";
const COUNTRIES_KEY = "fchat:countries";
const COUNTRY_MODE_KEY = "fchat:countryMode";

const loadKnown = () => {
  try { const raw = localStorage.getItem(KNOWN_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const saveKnown = (arr) => { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(arr)); } catch {} };

const loadAllowPings = () => {
  try { const raw = localStorage.getItem(PING_PREF_KEY); return raw ? JSON.parse(raw) : false; } catch { return false; }
};
const saveAllowPings = (val) => { try { localStorage.setItem(PING_PREF_KEY, JSON.stringify(!!val)); } catch {} };

const loadOnboard = () => {
  try {
    const raw = localStorage.getItem(ONBOARD_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.dob || !obj?.gender || !obj?.seeking) return obj || null;
    return obj;
  } catch { return null; }
};
const saveOnboard = (obj) => { try { localStorage.setItem(ONBOARD_KEY, JSON.stringify(obj)); } catch {} };

const loadInterests = () => {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? Array.from(new Set(arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)))
      : null;
  } catch {
    return null;
  }
};
const saveInterests = (arr) => {
  try {
    const norm = Array.from(new Set((arr || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean)));
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(norm));
  } catch {}
};

const loadCountries = () => {
  try {
    const raw = localStorage.getItem(COUNTRIES_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : null;
  } catch {
    return null;
  }
};
const saveCountries = (arr) => {
  try {
    localStorage.setItem(COUNTRIES_KEY, JSON.stringify(arr || []));
  } catch {}
};

const loadCountryMode = () => {
  try {
    const v = localStorage.getItem(COUNTRY_MODE_KEY);
    return v || null;
  } catch {
    return null;
  }
};
const saveCountryMode = (val) => {
  try {
    localStorage.setItem(COUNTRY_MODE_KEY, String(val || "prefer"));
  } catch {}
};

const calcAgeFromDob = (dobStr) => {
  try {
    const d = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  } catch { return undefined; }
};

/**
 * IP-based country detection (client-side, no token).
 * Tries ipapi.co first, then ipwho.is as fallback.
 * Returns { code: "US", name: "United States" } or null.
 */
async function detectCountryByIP() {
  // ipapi.co
  try {
    const r = await fetch("https://ipapi.co/json/");
    if (r.ok) {
      const j = await r.json();
      if (j?.country_code) {
        return { code: String(j.country_code).toUpperCase(), name: j.country_name || "" };
      }
    }
  } catch {}
  // ipwho.is
  try {
    const r2 = await fetch("https://ipwho.is/");
    if (r2.ok) {
      const j2 = await r2.json();
      if (j2?.success && j2?.country_code) {
        return { code: String(j2.country_code).toUpperCase(), name: j2.country || "" };
      }
    }
  } catch {}
  // api.country.is (very lightweight)
  try {
    const r3 = await fetch("https://api.country.is/");
    if (r3.ok) {
      const j3 = await r3.json();
      if (j3?.country && /^[A-Za-z]{2}$/.test(j3.country)) {
        return { code: String(j3.country).toUpperCase(), name: "" };
      }
    }
  } catch {}
  return null;
}

// --------------------------- Country Modal ---------------------------
function CountryModal({ open, onClose, selected, onSave }) {
  const [query, setQuery] = useState("");
  const [pick, setPick] = useState(selected || []);

  useEffect(() => { if (open) setPick(selected || []); }, [open, selected]);

  const res = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const toggle = (c) => {
    setPick((arr) => (arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]));
  };

  if (!open) return null;
  return (
    <div className="fchat-modal" onClick={onClose}>
      <div className="fchat-modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="fchat-modal-head">
          <h3>Select countries</h3>
          <button className="fchat-btn" onClick={onClose}>Close</button>
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
              <span key={c} className="fchat-chip is-active" onClick={() => toggle(c)}>{c}</span>
            ))}
          </div>
          <button className="fchat-btn fchat-btn-primary" onClick={() => onSave(pick)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// --------------------------- Onboarding Modal (with 18+ + detected country) ---------------------------
function OnboardingModal({ open, initial, detectedCountry, onSave }) {
  const [dob, setDob] = useState(initial?.dob || "");
  const [gender, setGender] = useState(initial?.gender || "male");
  const [seeking, setSeeking] = useState(initial?.seeking || "any");
  const [accepted, setAccepted] = useState(!!initial?.accepted18);

  const age = dob ? calcAgeFromDob(dob) : undefined;
  const tooYoung = Number.isFinite(age) ? age < 18 : false;

  const cc = (detectedCountry?.code || initial?.countryCode || "");
  const cn = (detectedCountry?.name || initial?.countryName || "");

  const canContinue =
    !!dob &&
    !!gender &&
    !!seeking &&
    accepted &&
    !tooYoung;

  if (!open) return null;
  return (
    <div className="fchat-modal" role="dialog" aria-modal="true">
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
          {dob && (
            <small className="fchat-muted">
              {Number.isFinite(age) ? `We calculate your age as ${age}.` : "Enter a valid date."}
            </small>
          )}
          {tooYoung && (
            <div className="fchat-chip" style={{ background: "rgba(251,113,133,0.15)", borderColor: "rgba(251,113,133,0.35)" }}>
              Must be 18+ to use 4Chat
            </div>
          )}
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
              <option value="other">Other / Prefer not to say</option>
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


        <div className="fchat-panel fchat-consent">
          <label className="fchat-row" style={{ gap: 10, alignItems: "flex-start" }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              aria-label="I am 18+ and I accept the Terms"
            />
            <span>
              I confirm I am <strong>18+</strong> and I agree to the{" "}
              <a className="fchat-link" href="/terms" target="_blank" rel="noreferrer">Terms</a> and{" "}
              <a className="fchat-link" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </span>
          </label>
        </div>

        <div className="fchat-modal-foot">
          <div className="fchat-muted">
            We don’t store personal data beyond what’s needed for safer matching.
          </div>
          <button
            className="fchat-btn fchat-btn-primary"
            onClick={() =>
              onSave({
                ...(initial || {}),
                dob,
                gender,
                seeking,
                accepted18: accepted,
                countryCode: cc || initial?.countryCode || "",
                countryName: cn || initial?.countryName || "",
              })
            }
            disabled={!canContinue}
            title={!accepted ? "Please confirm you’re 18+ and accept Terms" : ""}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------- Countries list ---------------------------
const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica","Côte d’Ivoire","Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// Normalize partner payload from server to include gender and country when present in various shapes
function normalizePartnerFromServer(payload) {
  const p = payload?.partner || {};
  const gender = p.gender ?? p.g ?? p.sex ?? payload?.partnerGender ?? payload?.gender ?? payload?.self?.gender ?? null;
  const ccRaw = p.countryCode ?? p.cc ?? p.country_code ?? payload?.partnerCountry ?? payload?.countryCode ?? payload?.self?.countryCode ?? null;
  const cc = ccRaw ? String(ccRaw).toUpperCase() : null;
  return {
    flair: p.flair || "Stranger",
    pid: p.pid ?? payload?.pid ?? null,
    uid: p.uid ?? null,
    ...p,
    gender,
    countryCode: cc,
  };
}
// --------------------------- Socket Session ----------------------------
function Session({ interests, onEvent, setSenderRef, sessionKey, meta }) {
  // IMPORTANT: only depend on sessionKey so live setting edits don't restart the socket
  const deps = useMemo(() => [sessionKey], [sessionKey]);

  const { sendMessage, isReady } = useWebSocket("4chat", {
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
        self: {
          age: meta.age,
          gender: meta.gender,
          countryCode: meta.selfCountry?.code || undefined, // NEW: send self country to server (safe if ignored)
        },
        seeking: { gender: meta.seekingGender },
      });
      // ask server for current online count immediately
      sendMessage({ type: "stats" });
      // proactively share meta so the peer can see gender/country even if server doesn't attach it to partner
      sendMessage({ type: "meta", self: { gender: meta.gender, countryCode: meta.selfCountry?.code } });
    },
    onMessage: (data) => {
      try {
        switch (data.type) {
          case "paired":
            onEvent({ type: "status", status: "paired" });
            const merged = normalizePartnerFromServer(data);
            onEvent({ type: "partner", partner: merged });
            if (data.rtoken) onEvent({ type: "rtoken", rtoken: data.rtoken });
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
          case "left": {
            onEvent({ type: "systemLine", variant: "peer-left" });
            onEvent({ type: "typing", isTyping: false });
            onEvent({ type: "partner", partner: null });
            if (meta.autoNext) {
              onEvent({ type: "status", status: "searching" });
              sendMessage({ type: "next" });
            } else {
              onEvent({ type: "status", status: "stopped" });
            }
            break;
          }
          case "pong":
            break;
          case "ping":
            onEvent({
              type: "incomingPing",
              from: data.from || null,
              rtoken: data.rtoken || null,
            });
            break;
          case "meta":
            onEvent({ type: "partnerMeta", meta: data.self || data });
            break;
          case "presence":
            if (typeof data.online === "number") {
              onEvent({ type: "presence", online: data.online });
            }
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
    const api = {
      sendText: (text) => sendMessage({ type: "message", text }),
      sendTyping: (isTyping) => sendMessage({ type: "typing", isTyping }),
      next: () => sendMessage({ type: "next" }),
      ping: (target) => {
        if (!target) return;
        if (typeof target === "string") {
          sendMessage({ type: "ping", ticket: target });
        } else {
          sendMessage({ type: "ping", ...target });
        }
      },
    };
    setSenderRef(api);
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

  const [onlineCount, setOnlineCount] = useState(null);
  const [retryUntil, setRetryUntil] = useState(null);

  // NEW: live searching timer
  const [searchStartMs, setSearchStartMs] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

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
  const [stopConfirm, setStopConfirm] = useState(false);
  const stopTimerRef = useRef(null);

  // preferences
  const [interests, setInterests] = useState(() => loadInterests() || []); // optional
  const [customInterest, setCustomInterest] = useState("");
  const [blurMedia, setBlurMedia] = useState(true);
  const [safeMode, setSafeMode] = useState(false);
  const [soundOnMatch, setSoundOnMatch] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  // matching refinements
  const [countries, setCountries] = useState(() => loadCountries() || []);
  const [countryMode, setCountryMode] = useState(() => loadCountryMode() || "prefer");
  const [generalWaitSec, setGeneralWaitSec] = useState(3);
  const [interestWaitSec, setInterestWaitSec] = useState(15);
  const [countryWaitSec, setCountryWaitSec] = useState(20);
  const [maxOverallSec, setMaxOverallSec] = useState(60);

  // pings / known
  const [allowPings, setAllowPings] = useState(loadAllowPings());
  const [known, setKnown] = useState(loadKnown());
  const [lastPingTarget, setLastPingTarget] = useState(null);
  const [currentRToken, setCurrentRToken] = useState(null);
  const [deepLinkRToken, setDeepLinkRToken] = useState(null);

  // Profile form state (editable without cutting current chat)
  const [profDob, setProfDob] = useState(onboard?.dob || "");
  const [profGender, setProfGender] = useState(onboard?.gender || "male");
  const [profSeeking, setProfSeeking] = useState(onboard?.seeking || "any");

  useEffect(() => {
    setProfDob(onboard?.dob || "");
    setProfGender(onboard?.gender || "male");
    setProfSeeking(onboard?.seeking || "any");
  }, [onboard]);

  // Criteria snapshot used by the ongoing session so edits won't cut the chat
  const [sessionCriteria, setSessionCriteria] = useState(null);

  // NEW: detected self country (used in join payload)
  const [selfCountry, setSelfCountry] = useState(
    onboard?.countryCode ? { code: onboard.countryCode, name: onboard.countryName || "" } : null
  );

  // deep link rtoken
  useEffect(() => {
    try {
      const params = new URLSearchParams(
        location.search || window.location.search || ""
      );
      const r = params.get("rtoken");
      if (r) {
        setDeepLinkRToken(r);
        setLastPingTarget((prev) => prev || { rtoken: r });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listRef = useRef(null);
  const typingTimeout = useRef(null);
  const senderRef = useRef({
    sendText: () => {},
    sendTyping: () => {},
    next: () => {},
    ping: () => {},
  });
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  }, []);

  // Guest display
  useEffect(() => {
    if (isAuthenticated) return;
    const loadAndApply = () => {
      try {
        const raw = localStorage.getItem("displaySettings:guest");
        const s = raw ? { ...GUEST_DEFAULTS, ...JSON.parse(raw) } : { ...GUEST_DEFAULTS };
        applyGuestDisplay(s);
      } catch { applyGuestDisplay(defaultSettings); }
    };
    loadAndApply();
    const onGuestChange = (e) => { const s = e.detail; if (s) applyGuestDisplay(s); };
    window.addEventListener("guestDisplaySettingsChanged", onGuestChange);
    const onStorage = (e) => { if (e.key === "displaySettings:guest") loadAndApply(); };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("guestDisplaySettingsChanged", onGuestChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [isAuthenticated]);

  // enforce onboarding (open if missing OR not accepted 18+)
  useEffect(() => {
    if (!onboard || !onboard?.accepted18) setOnboardOpen(true);
  }, [onboard]);

  // persist ping pref + known list + preferences
  useEffect(() => { saveAllowPings(allowPings); }, [allowPings]);
  useEffect(() => { saveKnown(known); }, [known]);
  useEffect(() => { saveInterests(interests); }, [interests]);
  useEffect(() => { saveCountries(countries); }, [countries]);
  useEffect(() => { saveCountryMode(countryMode); }, [countryMode]);

  // NEW: Detect country on first load if not present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (onboard?.countryCode) return; // already have one
        const res = await detectCountryByIP();
        if (!mounted || !res) return;
        setSelfCountry(res);
        setOnboard((prev) => {
          const next = { ...(prev || {}), countryCode: res.code, countryName: res.name };
          saveOnboard(next);
          return next;
        });
      } catch {}
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-retry window (unchanged)
  useEffect(() => {
    if (!connected) return;
    if (
      (status === "disconnected" || status === "error") &&
      retryUntil &&
      Date.now() < retryUntil
    ) {
      const t = setTimeout(() => {
        setStatus("connecting");
        setSessionKey((k) => k + 1);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [status, connected, retryUntil]);

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
          if (evt.status === "paired") {
            setMessages([]);
            setIsPartnerTyping(false);
          }
          break;
        case "presence":
          setOnlineCount(evt.online);
          break;
        case "partner":
          setPartner(evt.partner);
          if (evt.partner) {
            const knownId =
              evt.partner?.uid ||
              evt.partner?.pid ||
              "p-" + Math.random().toString(36).slice(2, 10);
            const knownItem = {
              id: knownId,
              flair: evt.partner?.flair || "Stranger",
              lastSeen: Date.now(),
              uid: evt.partner?.uid || null,
              pid: evt.partner?.pid || null,
              rtoken: null,
            };
            setKnown((arr) => {
              const idx = arr.findIndex((k) => k.id === knownItem.id);
              if (idx >= 0) {
                const next = [...arr];
                next[idx] = { ...next[idx], ...knownItem };
                return next;
              }
              return [knownItem, ...arr].slice(0, 50);
            });
            if (isAuthenticated && evt.partner?.uid) {
              setLastPingTarget((prev) => ({ ...(prev || {}), toUid: evt.partner.uid }));
            } else if (evt.partner?.pid) {
              setLastPingTarget((prev) => ({ ...(prev || {}), toPid: evt.partner.pid }));
            }
          }
          break;
        case "rtoken":
          setCurrentRToken(evt.rtoken);
          setLastPingTarget((prev) => ({ ...(prev || {}), rtoken: evt.rtoken }));
          setKnown((arr) => {
            if (!arr.length) return arr;
            const next = [...arr];
            if (!next[0].rtoken) next[0].rtoken = evt.rtoken;
            return next;
          });
          break;
        case "incomingPing":
          setKnown((arr) => {
            const id =
              evt.from?.uid ||
              evt.rtoken ||
              evt.from?.pid ||
              "p-" + Math.random().toString(36).slice(2, 10);
            const idx = arr.findIndex((k) => k.id === id);
            const item = {
              id,
              flair: "Stranger",
              lastSeen: Date.now(),
              uid: evt.from?.uid || null,
              pid: evt.from?.pid || null,
              rtoken: evt.rtoken || null,
            };
            if (idx >= 0) {
              const next = [...arr];
              next[idx] = { ...next[idx], ...item };
              return next;
            }
            return [item, ...arr].slice(0, 50);
          });
          if (isAuthenticated && evt.from?.uid) {
            setLastPingTarget({ toUid: evt.from.uid });
          } else if (evt.rtoken) {
            setLastPingTarget({ rtoken: evt.rtoken });
          } else if (evt.from?.pid) {
            setLastPingTarget({ toPid: evt.from.pid });
          }
          break;
        case "partnerMeta":
          setPartner((prev) => {
            const meta = evt.meta || {};
            if (!prev) return { ...meta };
            return {
              ...prev,
              ...meta,
              gender: meta.gender ?? prev.gender,
              countryCode: meta.countryCode ? String(meta.countryCode).toUpperCase() : prev.countryCode,
            };
          });
          break;
        case "systemLine":
          if (evt.variant === "peer-left") {
            pushMsg({ kind: "system", text: "Stranger disconnected", icon: "❌" });
            setIsPartnerTyping(false);
          }
          break;
        case "typing":
          setIsPartnerTyping(!!evt.isTyping);
          break;
        case "message":
          pushMsg({ sender: evt.sender, text: evt.text });
          break;
        case "system":
          break;
        case "ready":
          if (evt.ready && status === "connecting") setStatus("searching");
          break;
        default:
          break;
      }
    },
    [pushMsg, status, isAuthenticated]
  );

  useEffect(() => { scrollToBottom(true); }, [messages, scrollToBottom]);
  useEffect(() => { if (isPartnerTyping) scrollToBottom(true); }, [isPartnerTyping, scrollToBottom]);

  // reset confirm UI when leaving paired, and clear timer
  useEffect(() => {
    if (status !== "paired") setStopConfirm(false);
    return () => { if (stopTimerRef.current) clearTimeout(stopTimerRef.current); };
  }, [status]);

  // Focus the composer when paired
  useEffect(() => {
    if (status === "paired" && inputRef.current) {
      try {
        inputRef.current.focus({ preventScroll: true });
      } catch {
        inputRef.current.focus();
      }
    }
  }, [status]);

  // Live timer while connecting/searching
  useEffect(() => {
    let id;
    if (status === "searching" || status === "connecting") {
      setSearchStartMs((v) => v ?? Date.now());
      id = setInterval(() => setNowTick(Date.now()), 1000);
    } else {
      setSearchStartMs(null);
    }
    return () => { if (id) clearInterval(id); };
  }, [status]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || status !== "paired") return;
    pushMsg({ sender: "me", text });
    senderRef.current.sendText(text);
    setInput("");
    setTyping(false);
    senderRef.current?.sendTyping(false);
  }, [input, status, pushMsg]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const onInput = useCallback((e) => {
    const v = e.target.value;
    setInput(v);
    if (status === "paired" && !typing) {
      setTyping(true);
      senderRef.current?.sendTyping(true);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      if (status === "paired") senderRef.current?.sendTyping(false);
    }, 1500);
  }, [status, typing]);

  // Controls
  const canConnect =
    !!onboard &&
    !!onboard.dob &&
    !!onboard.gender &&
    !!onboard.seeking &&
    !!onboard.accepted18 &&
    (Number.isFinite(calcAgeFromDob(onboard.dob)) ? calcAgeFromDob(onboard.dob) >= 18 : false);

  const connect = () => {
    if (!canConnect) {
      setOnboardOpen(true);
      return;
    }
    // Freeze current editable preferences for this entire session
    const snap = {
      interests: [...interests],
      meta: {
        autoNext,
        soundOnMatch,
        allowPings,
        countries: [...countries],
        countryMode,
        generalWaitSec,
        interestWaitSec,
        countryWaitSec,
        maxOverallSec,
        age,
        gender: onboard?.gender,
        seekingGender: onboard?.seeking,
        selfCountry,
      },
    };
    setSessionCriteria(snap);

    // Start a new session; keep transcript until paired again
    setPartner(null);
    setIsPartnerTyping(false);
    setStatus("connecting");
    setConnected(true);
    setSessionKey((k) => k + 1);
    setRetryUntil(Date.now() + 12000);
  };

  const disconnect = () => {
    try { senderRef.current?.sendTyping(false); } catch {}
    pushMsg({ kind: "system", text: "You disconnected", icon: "❌" });
    setConnected(false);
    setStatus("stopped");
  };

  const next = () => {
    if (status === "paired" || status === "searching") {
      setMessages([]);
      setIsPartnerTyping(false);
      setPartner(null);
      setStatus("searching");
      senderRef.current.next();
    }
  };

  const handleStopClick = useCallback(() => {
    if (!stopConfirm) {
      setStopConfirm(true);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => setStopConfirm(false), 2200);
      return;
    }
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    setStopConfirm(false);
    disconnect();
  }, [stopConfirm]);

  const age = onboard?.dob ? calcAgeFromDob(onboard.dob) : undefined;
  // Profile editor derived values
  const profAge = profDob ? calcAgeFromDob(profDob) : undefined;
  const profTooYoung = Number.isFinite(profAge) ? profAge < 18 : false;
  const canChat = status === "paired";
  const setSenderRef = (fn) => { senderRef.current = fn ? fn : senderRef.current; };

  const addCustomInterest = () => {
    const tag = customInterest.trim().toLowerCase();
    if (!tag) return;
    if (!interests.includes(tag)) setInterests((p) => [...p, tag]);
    setCustomInterest("");
  };

  const toggleChip = (tag) => {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  // Save Profile without interrupting current chat
  const saveProfile = useCallback(() => {
    if (!profDob) return; // require a DOB
    if (profTooYoung) return; // must be 18+
    const next = {
      ...(onboard || {}),
      dob: profDob,
      gender: profGender,
      seeking: profSeeking,
      // preserve acceptance once given
      accepted18: (onboard?.accepted18 ?? true),
    };
    saveOnboard(next);
    setOnboard(next);
  }, [profDob, profGender, profSeeking, profTooYoung, onboard]);

  const pingKnown = (item) => {
    const payload =
      (isAuthenticated && item.uid && { toUid: item.uid }) ||
      (item.rtoken && { rtoken: item.rtoken }) ||
      (item.pid && { toPid: item.pid }) ||
      (item.ticket && { ticket: item.ticket }) ||
      null;
    if (!payload) return;
    senderRef.current.ping(payload);
  };

  // Header title showing gender + country code + flag
  const headerTitle = useMemo(() => {
    if (status === "paired") return renderPartnerHeader(partner || {});
    if (status === "searching" || status === "connecting") return "Waiting…";
    if (status === "stopped" && partner) return renderPartnerHeader(partner || {});
    return partner ? renderPartnerHeader(partner || {}) : "Waiting…";
  }, [status, partner]);

  // Use *active* (frozen) criteria while connected; live prefs otherwise
  const activeCountries = useMemo(
    () => (connected && sessionCriteria ? sessionCriteria.meta.countries : countries),
    [connected, sessionCriteria, countries]
  );
  const activeCountryMode = useMemo(
    () => (connected && sessionCriteria ? sessionCriteria.meta.countryMode : countryMode),
    [connected, sessionCriteria, countryMode]
  );

  // --- Live time + labels for searching view ---
  const elapsedSecs = useMemo(
    () => (searchStartMs ? Math.max(0, Math.floor((nowTick - searchStartMs) / 1000)) : 0),
    [nowTick, searchStartMs]
  );

  const seekingLabel = useMemo(() => {
    const g = (connected && sessionCriteria ? sessionCriteria.meta.seekingGender : onboard?.seeking) || "any";
    return g === "any" ? "Any gender" : g.charAt(0).toUpperCase() + g.slice(1);
  }, [connected, sessionCriteria, onboard]);

  const sessionCountryWaitSec =
    connected && sessionCriteria ? (sessionCriteria.meta.countryWaitSec ?? 20) : countryWaitSec;

  const countryRelaxRemaining = useMemo(() => {
    if (!(status === "searching" || status === "connecting")) return null;
    if (activeCountryMode !== "prefer") return null;
    if (!activeCountries.length) return null;
    const remain = Math.max(0, sessionCountryWaitSec - elapsedSecs);
    return remain > 0 ? remain : 0;
  }, [status, activeCountryMode, activeCountries, sessionCountryWaitSec, elapsedSecs]);

  const searchSubline = useMemo(() => {
    if (status === "searching" || status === "connecting") {
      const loc = activeCountries.length ? `in ${activeCountries.join(", ")}` : "worldwide";
      return `Seeking: ${seekingLabel} · ${loc} · T+${fmtMMSS(elapsedSecs)}`;
    }
    return null;
  }, [status, activeCountries, seekingLabel, elapsedSecs]);

  return (
    <div
      className={`fchat fchat-theme-dark ${isAuthenticated ? "fchat-no-bg" : ""} ${!isEmbedded ? "" : "fchat-bordered"}`}
    >
      {connected && sessionCriteria && (
        <Session
          interests={sessionCriteria.interests}
          onEvent={onEvent}
          setSenderRef={setSenderRef}
          sessionKey={sessionKey}
          meta={sessionCriteria.meta}
        />
      )}

      {/* Header */}
      <header className={`fchat-header ${!isEmbedded ? "fchat-glass" : "fchat-bordered"}`}>
        <div className="fchat-brand">
          <div className="fchat-logo">4</div>
          <div className="fchat-titles">
            <h1 className="fchat-h1">4Chat</h1>
            <small className="fchat-sub">Anonymous · Safer · Smarter</small>
          </div>
        </div>
        <div className="fchat-actions">
          <Badge status={status} />
          <span
            className="fchat-online-chip"
            title={onlineCount == null ? "Online users" : `${onlineCount} online`}
            aria-live="polite"
          >
            {onlineCount == null ? "…" : onlineCount}+ online
          </span>

          <button
            className="fchat-btn"
            onClick={() => setShowSettings((s) => !s)}
            title="Toggle settings panel"
          >
            {showSettings ? "Hide Settings" : "Settings"}
          </button>

          {!isAuthenticated && (
            <div className="display-settings-menu" onClick={(e) => e.stopPropagation()}>
              <DisplayMenu
                toggleContent={<button aria-label="Display settings"><ControlCenterIcon /></button>}
                guestMode={!isAuthenticated}
                defaultsOverride={GUEST_DEFAULTS}
              />
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className={`fchat-content  ${!isEmbedded ? "" : "fchat-bordered"}`} data-collapsed={!showSettings}>
        {showSettings && (
          <aside className={`fchat-sidebar ${!isEmbedded ? "fchat-glass" : "fchat-bordered"}`}>
            {/* Tabs */}
            <div className="fchat-tabs">
              <button className={`fchat-tab ${activeTab === "basic" ? "is-active" : ""}`} onClick={() => setActiveTab("basic")}>Basic</button>
              <button className={`fchat-tab ${activeTab === "advanced" ? "is-active" : ""}`} onClick={() => setActiveTab("advanced")}>Advanced</button>
              <button className={`fchat-tab ${activeTab === "known" ? "is-active" : ""}`} onClick={() => setActiveTab("known")}>Known</button>
              <button className={`fchat-tab ${activeTab === "profile" ? "is-active" : ""}`} onClick={() => setActiveTab("profile")}>Profile</button>
            </div>

            {/* BASIC */}
            {activeTab === "basic" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Quick Match</h3>
                <p className="fchat-muted">
                  Pick interests and countries. Matching respects your seeking preference.
                </p>

                <div className="fchat-field">
                  <label className="fchat-label">Quick Interests</label>
                  <div className="fchat-chips">
                    {["tech","crypto","gaming","ai","music","art","movies","travel","fitness","memes","startups","books"].map((tag) => (
                      <button
                        key={tag}
                        className={`fchat-chip ${interests.includes(tag) ? "is-active" : ""}`}
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
                    <button className="fchat-btn" onClick={addCustomInterest}>Add</button>
                  </div>
                </div>

                <div className="fchat-field">
                  <label className="fchat-label">Countries (optional)</label>
                  <div className="fchat-row">
                    <div className="fchat-chosen-inline">
                      {countries.length ? countries.map((c) => (
                        <span key={c} className="fchat-chip is-active">{c}</span>
                      )) : <span className="fchat-muted">Any</span>}
                    </div>
                    <button className="fchat-btn" onClick={() => setCountryModal(true)}>Choose</button>
                  </div>
                  <div className="fchat-row">
                    <label className="fchat-label">Match mode</label>
                    <select className="fchat-select" value={countryMode} onChange={(e) => setCountryMode(e.target.value)}>
                      <option value="strict">Strict (only chosen)</option>
                      <option value="prefer">Prefer (broaden if no match)</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                </div>

                <button className="fchat-btn fchat-btn-primary fchat-btn-wide" onClick={connect}>Start Matching</button>
              </div>
            )}

            {/* ADVANCED */}
            {activeTab === "advanced" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Advanced Controls</h3>
                <p className="fchat-muted">Privacy, continuity, waits & density.</p>

                <div className="fchat-grid-2">
                  <div className="fchat-field">
                    <label className="fchat-label">General wait (seconds)</label>
                    <input className="fchat-input" type="number" min={0} max={30} value={generalWaitSec} onChange={(e) => setGeneralWaitSec(Number(e.target.value))} />
                  </div>
                  <div className="fchat-field">
                    <label className="fchat-label">Interest wait (seconds)</label>
                    <input className="fchat-input" type="number" min={0} max={180} value={interestWaitSec} onChange={(e) => setInterestWaitSec(Number(e.target.value))} />
                  </div>
                </div>

                <div className="fchat-grid-2">
                  <div className="fchat-field">
                    <label className="fchat-label">Country wait (seconds)</label>
                    <input className="fchat-input" type="number" min={0} max={180} value={countryWaitSec} onChange={(e) => setCountryWaitSec(Number(e.target.value))} />
                  </div>
                  <div className="fchat-field">
                    <label className="fchat-label">Max overall wait (seconds)</label>
                    <input className="fchat-input" type="number" min={5} max={600} value={maxOverallSec} onChange={(e) => setMaxOverallSec(Number(e.target.value))} />
                  </div>
                </div>

                <div className="fchat-panel">
                  <div className="fchat-row">
                    <span>Blur media</span>
                    <button className={`fchat-toggle ${blurMedia ? "is-on" : ""}`} onClick={() => setBlurMedia((v) => !v)} aria-pressed={blurMedia} />
                  </div>
                  <div className="fchat-row">
                    <span>Safe mode</span>
                    <button className={`fchat-toggle ${safeMode ? "is-on" : ""}`} onClick={() => setSafeMode((v) => !v)} aria-pressed={safeMode} />
                  </div>
                  <div className="fchat-row">
                    <span>Sound on match</span>
                    <button className={`fchat-toggle ${soundOnMatch ? "is-on" : ""}`} onClick={() => setSoundOnMatch((v) => !v)} aria-pressed={soundOnMatch} />
                  </div>
                  <div className="fchat-row">
                    <span>Auto-next on disconnect</span>
                    <button className={`fchat-toggle ${autoNext ? "is-on" : ""}`} onClick={() => setAutoNext((v) => !v)} aria-pressed={autoNext} />
                  </div>
                  <div className="fchat-row">
                    <span>Compact messages</span>
                    <button className={`fchat-toggle ${compact ? "is-on" : ""}`} onClick={() => setCompact((v) => !v)} aria-pressed={compact} />
                  </div>
                  <div className="fchat-row">
                    <span>Show timestamps</span>
                    <button className={`fchat-toggle ${showTimestamps ? "is-on" : ""}`} onClick={() => setShowTimestamps((v) => !v)} aria-pressed={showTimestamps} />
                  </div>
                </div>

                <div className="fchat-panel">
                  <div className="fchat-row">
                    <span>Allow pings (stay anonymous)</span>
                    <button className={`fchat-toggle ${allowPings ? "is-on" : ""}`} onClick={() => setAllowPings((v) => !v)} aria-pressed={allowPings} />
                  </div>
                  <div className="fchat-row fchat-row-note">
                    <small className="fchat-muted">
                      If a connection drops, partners you chatted with can send a one-time ping to see if you’re still around.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* KNOWN */}
            {activeTab === "known" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Known People (Anonymous)</h3>
                <p className="fchat-muted">You’ve crossed paths before. Ping to reconnect if they also allow pings.</p>
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
                            <div className="fchat-known-sub">Last seen {new Date(k.lastSeen).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="fchat-known-actions">
                          <button className="fchat-btn" onClick={() => pingKnown(k)} title="Send anonymous ping">Ping</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="fchat-panel">
                  <div className="fchat-row">
                    <span>Clear known list</span>
                    <button className="fchat-btn fchat-btn-danger" onClick={() => setKnown([])}>Clear</button>
                  </div>
                </div>
              </div>
            )}
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="fchat-tabpanel">
                <h3 className="fchat-h3">Profile</h3>
                <p className="fchat-muted">These values are used for matching and won’t interrupt an ongoing chat. Changes apply to the next search.</p>

                <div className="fchat-grid-2">
                  <div className="fchat-field">
                    <label className="fchat-label">Your gender</label>
                    <select
                      className="fchat-select"
                      value={profGender}
                      onChange={(e) => setProfGender(e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>
                  <div className="fchat-field">
                    <label className="fchat-label">Looking for</label>
                    <select
                      className="fchat-select"
                      value={profSeeking}
                      onChange={(e) => setProfSeeking(e.target.value)}
                    >
                      <option value="any">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="fchat-field">
                  <label className="fchat-label">Date of birth</label>
                  <input
                    type="date"
                    className="fchat-input"
                    value={profDob}
                    onChange={(e) => setProfDob(e.target.value)}
                  />
                  {profDob && (
                    <small className="fchat-muted">
                      {Number.isFinite(profAge) ? `We calculate your age as ${profAge}.` : "Enter a valid date."}
                    </small>
                  )}
                  {profTooYoung && (
                    <div className="fchat-chip" style={{ background: "rgba(251,113,133,0.15)", borderColor: "rgba(251,113,133,0.35)" }}>
                      Must be 18+ to use 4Chat
                    </div>
                  )}
                </div>

                <div className="fchat-modal-foot" style={{ paddingTop: 8 }}>
                  <button
                    className="fchat-btn fchat-btn-primary"
                    onClick={saveProfile}
                    disabled={!profDob || profTooYoung}
                  >
                    Save Profile
                  </button>
                  {status === "paired" && (
                    <small className="fchat-muted" style={{ marginLeft: 10 }}>Saved. Will apply next time you connect.</small>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        <main className={`fchat-chat ${!isEmbedded ? "fchat-glass" : "fchat-bordered"} ${compact ? "is-compact" : ""}`}>
          <div className="fchat-chat-head">
            <div className="fchat-avatar" aria-hidden><span>🌀</span></div>
            <div className="fchat-who">
              <div className="fchat-name">{headerTitle}</div>

              <div className="fchat-sub" aria-live="polite">
                {(status === "searching" || status === "connecting")
                  ? (searchSubline || "Searching…")
                  : (interests.length > 0 ? <>Interests: {interests.join(", ")} </> : null)}
              </div>

              {(status === "searching" || status === "connecting") && activeCountries.length > 0 && (
                <div className="fchat-chosen-inline" aria-live="polite">
                  {activeCountries.map((c) => (
                    <span key={c} className="fchat-chip is-active">{c}</span>
                  ))}
                  <span className="fchat-chip">
                    {activeCountryMode === "strict" ? "Strict" : activeCountryMode === "prefer" ? "Prefer" : "Any"}
                  </span>
                  {activeCountryMode === "prefer" && countryRelaxRemaining !== null && countryRelaxRemaining > 0 && (
                    <span
                      className="fchat-chip"
                      title="Time remaining before broadening beyond your selected countries"
                    >
                      Relax in {fmtMMSS(countryRelaxRemaining)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom-right FAB for primary actions */}
            <div className="fchat-fab" style={{ marginLeft: "auto" }}>
              {(status === "paired" || status === "searching" || status === "connecting") && (
                <button
                  className="fchat-fab-btn fchat-fab-danger"
                  onClick={handleStopClick}
                  title={stopConfirm ? "Click again to confirm stop" : "Stop"}
                >
                  {stopConfirm ? "Sure?" : "✕"}
                </button>
              )}
              {(status === "idle" || status === "disconnected" || status === "error" || status === "stopped") && (
                <button className="fchat-fab-btn fchat-fab-primary" onClick={connect} title="Connect">⚡</button>
              )}
            </div>
          </div>

          {/* Transcript */}
          <div className="fchat-chat-log" ref={listRef}>
            {messages.length === 0 &&
              (status === "idle" || status === "disconnected" || status === "error") && (
                <div className="fchat-empty">
                  <div className="fchat-empty-big">Find your stranger.</div>
                  <div className="fchat-muted">
                    Click <strong>Connect</strong> to start. Deal more kindly. Stay anonymous.
                  </div>
                </div>
              )}

            {messages.map((m) => {
              if (m.kind === "system") {
                return (
                  <div key={m.id} className="fchat-line is-system">
                    <span className="fchat-system-icon">{m.icon || "ℹ"}</span>
                    <span className="fchat-text">{m.text}</span>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`fchat-line ${m.sender === "me" ? "is-me" : "is-stranger"}`}>
                  <span className="fchat-speaker">{m.sender === "me" ? "You" : "Stranger"}:</span>
                  <span className="fchat-text">{m.text}</span>
                  {showTimestamps && <time className="fchat-time">{fmtTime(m.ts)}</time>}
                </div>
              );
            })}

            {isPartnerTyping && (
              <div className="fchat-typing">
                <span className="fchat-typing-dot" />
                <span className="fchat-typing-dot" />
                <span className="fchat-typing-dot" />
              </div>
            )}
          </div>

          <div className={`fchat-composer ${canChat ? "" : "is-disabled"}`}>
            {/* Left action: Stop when paired, Next (Connect) when not */}
            {status === "paired" ? (
              <button
                className="fchat-btn fchat-btn-warning fchat-next-inline"
                onClick={handleStopClick}
                title={stopConfirm ? "Click again to confirm" : "Stop chat"}
              >
                {stopConfirm ? "Sure?" : "Stop ✕"}
              </button>
            ) : (
              <button
                className="fchat-btn fchat-btn-warning fchat-next-inline"
                onClick={connect}
                disabled={status === "connecting"}
                title="Next match"
              >
                Next ▷
              </button>
            )}

            <textarea
              ref={inputRef}
              className="fchat-inputarea fchat-inputarea-xl"
              placeholder={
                canChat
                  ? "Type a message…"
                  : status === "searching"
                  ? "Matching you with a stranger…"
                  : status === "connecting"
                  ? "Connecting…"
                  : status === "stopped"
                  ? "Press Next to find another match"
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
        <div className="fchat-legal">Stay safe. No personal info. Report bad actors.</div>
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
        initial={onboard || {}}
        detectedCountry={selfCountry}
        onSave={(obj) => {
          saveOnboard(obj);
          setOnboard(obj);
          setOnboardOpen(false);
          if (obj?.countryCode) setSelfCountry({ code: obj.countryCode, name: obj.countryName || "" });
        }}
      />
    </div>
  );
};

const Badge = ({ status }) => {
  const map = {
    idle: { label: "Idle", dot: "var(--fchat-muted)" },
    connecting: { label: "Connecting", dot: "var(--fchat-amber)" },
    searching: { label: "Searching…", dot: "var(--fchat-cyan)" },
    paired: { label: "Connected", dot: "var(--fchat-lime)" },
    disconnected: { label: "Disconnected", dot: "var(--fchat-muted)" },
    error: { label: "Error", dot: "var(--fchat-rose)" },
    stopped: { label: "Stopped", dot: "var(--fchat-rose)" },
  };
  const cfg = map[status] || map.idle;
  return (
    <span className="fchat-status-badge">
      <span className="fchat-status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

export default FourChat;