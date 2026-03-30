import { useState, useEffect, useRef, useCallback } from "react";

const START_DATE = new Date(2026, 2, 29); // March 29

const DAILY_TASKS = [
  { id: "workout1", label: "Workout #1", category: "physical", icon: "⚡" },
  { id: "workout2", label: "Workout #2 (outside)", category: "physical", icon: "🌿" },
  { id: "water", label: "1 Gallon Water", category: "physical", icon: "💧" },
  { id: "diet", label: "Clean Diet / No Alcohol", category: "physical", icon: "🥩" },
  { id: "coding", label: "1h 20min Hands-On Coding", category: "coding", icon: "💻" },
  { id: "study", label: "40min Study / Practice", category: "coding", icon: "📐" },
  { id: "swereading", label: "15min SWE Reading", category: "coding", icon: "📖" },
  { id: "nonfiction", label: "15min Nonfiction", category: "mind", icon: "🧠" },
  { id: "screentime", label: "Limit Screen Time", category: "mind", icon: "📵" },
  { id: "nomast", label: "No PMO", category: "discipline", icon: "🔒" },
  { id: "noscroll", label: "No Mindless Scrolling", category: "discipline", icon: "🚫" },
  { id: "outofbed", label: "Out of Bed by 8:30am", category: "discipline", icon: "⏰" },
  { id: "journal", label: "Journal (5+ min)", category: "mind", icon: "✍️" },
  { id: "photo", label: "Progress Photo", category: "doc", icon: "📸" },
];

const WEEKLY_TASKS = [
  { id: "uncomfortable", label: "Do 1 thing that makes you uncomfortable", icon: "😬" },
  { id: "codereview", label: "Review what you built / coded this week", icon: "🔍" },
  { id: "network", label: "Reach out to someone in your network", icon: "🤝" },
  { id: "plan", label: "Plan the next week intentionally", icon: "📅" },
];

const CATEGORY_COLORS = {
  physical: "#ef4444",
  coding: "#3b82f6",
  mind: "#a855f7",
  discipline: "#f59e0b",
  doc: "#6b7280",
};

const CATEGORY_LABELS = {
  physical: "PHYSICAL",
  coding: "CODING",
  mind: "MIND",
  discipline: "DISCIPLINE",
  doc: "LOG",
};

// --- CSS Animations ---
const ANIM_STYLES = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0px transparent; }
  50% { box-shadow: 0 0 12px #ef444466; }
}
@keyframes streakFire {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes progressGlow {
  0% { box-shadow: 0 0 4px #4ade8044; }
  50% { box-shadow: 0 0 12px #4ade8088; }
  100% { box-shadow: 0 0 4px #4ade8044; }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes overlayImgScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes barFill {
  from { width: 0%; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes completeBurst {
  0% { box-shadow: 0 0 0 0 #4ade8066; }
  70% { box-shadow: 0 0 0 10px #4ade8000; }
  100% { box-shadow: 0 0 0 0 #4ade8000; }
}
@keyframes tileFlip {
  0% { transform: rotateY(90deg); opacity: 0; }
  100% { transform: rotateY(0deg); opacity: 1; }
}
@keyframes pinDotFill {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
@keyframes pinShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-12px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(6px); }
}
@keyframes lockPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
@keyframes btnPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.9); background: #222; }
  100% { transform: scale(1); }
}
`;

// --- Helpers ---
function getDayLabel(dayIndex) {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekNumber(dayIndex) {
  return Math.floor(dayIndex / 7);
}

function getCurrentDayIndex() {
  const now = new Date();
  const diff = Math.floor((now - START_DATE) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(diff, 44));
}

// --- API helper ---
function createApi(token, onUnauth) {
  return async function api(path, options = {}) {
    const res = await fetch(path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (res.status === 401) {
      onUnauth();
      return null;
    }
    return res.json();
  };
}

// =============================================
// PIN LOCK SCREEN
// =============================================
function PinScreen({ mode, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const maxLen = 6;

  const handleDigit = (d) => {
    if (pin.length >= maxLen || loading) return;
    const next = pin + d;
    setPin(next);
    setError("");

    // Auto-submit at 6 digits (or 4+ for setup confirmation)
    if (next.length === maxLen) {
      submit(next);
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPin(p => p.slice(0, -1));
    setError("");
  };

  const submit = async (p) => {
    setLoading(true);
    try {
      const endpoint = mode === "setup" ? "/api/setup" : "/api/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: p }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("challenge45_token", data.token);
        onSuccess(data.token);
      } else {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setPin("");
        setError(data.error || "Failed");
      }
    } catch {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPin("");
      setError("Connection error");
    }
    setLoading(false);
  };

  const dots = Array.from({ length: maxLen }, (_, i) => i < pin.length);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e5e5e5",
      fontFamily: "'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      userSelect: "none",
    }}>
      <style>{ANIM_STYLES}</style>

      {/* Lock icon / branding */}
      <div style={{ animation: "fadeSlideDown 0.5s ease", textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: "lockPulse 3s ease infinite" }}>🔒</div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", marginBottom: 4 }}>QUINTON /</div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, color: "#fff", lineHeight: 1 }}>
          45 DAY
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, color: "#ef4444", lineHeight: 1 }}>
          HARD LOCK
        </div>
      </div>

      {/* Mode label */}
      <div style={{
        fontSize: 10, letterSpacing: 4, color: "#555", marginBottom: 24,
        animation: "fadeSlideUp 0.4s ease 0.1s both",
      }}>
        {mode === "setup" ? "SET YOUR PIN" : "ENTER PIN"}
      </div>

      {/* PIN dots */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 12,
        animation: shaking ? "pinShake 0.4s ease" : "fadeSlideUp 0.4s ease 0.15s both",
      }}>
        {dots.map((filled, i) => (
          <div key={i} style={{
            width: 16, height: 16,
            borderRadius: "50%",
            border: `2px solid ${filled ? "#ef4444" : "#333"}`,
            background: filled ? "#ef4444" : "transparent",
            transition: "all 0.15s ease",
            animation: filled ? "pinDotFill 0.25s ease" : "none",
          }} />
        ))}
      </div>

      {/* Error */}
      <div style={{
        height: 20, fontSize: 10, color: "#ef4444", letterSpacing: 2,
        marginBottom: 24, opacity: error ? 1 : 0, transition: "opacity 0.2s",
      }}>
        {error.toUpperCase()}
      </div>

      {/* Number pad */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 72px)",
        gap: 12,
        animation: "fadeSlideUp 0.4s ease 0.2s both",
      }}>
        {[1,2,3,4,5,6,7,8,9,null,0,"del"].map((key, i) => {
          if (key === null) return <div key={i} />;
          const isDel = key === "del";
          return (
            <button
              key={i}
              onClick={() => isDel ? handleDelete() : handleDigit(String(key))}
              style={{
                width: 72, height: 72,
                borderRadius: "50%",
                border: `1px solid ${isDel ? "#333" : "#222"}`,
                background: isDel ? "transparent" : "#111",
                color: isDel ? "#555" : "#fff",
                fontSize: isDel ? 18 : 24,
                fontWeight: 700,
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                WebkitTapHighlightColor: "transparent",
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = "scale(0.9)";
                e.currentTarget.style.background = isDel ? "#111" : "#222";
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = isDel ? "transparent" : "#111";
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = isDel ? "transparent" : "#111";
              }}
            >
              {isDel ? "⌫" : key}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {mode === "setup" && (
        <div style={{
          marginTop: 32, fontSize: 10, color: "#333", textAlign: "center",
          letterSpacing: 1, maxWidth: 240, lineHeight: 1.6,
          animation: "fadeSlideUp 0.4s ease 0.3s both",
        }}>
          CHOOSE A 6-DIGIT PIN TO LOCK YOUR CHALLENGE
        </div>
      )}

      {loading && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: 2, background: "#ef4444",
          animation: "shimmer 1s linear infinite",
          backgroundImage: "linear-gradient(90deg, #ef4444, #ff6b6b, #ef4444)",
          backgroundSize: "200% 100%",
        }} />
      )}
    </div>
  );
}

// =============================================
// MAIN APP
// =============================================
export default function App() {
  const [appState, setAppState] = useState("loading"); // loading | setup | login | app
  const [token, setToken] = useState(() => localStorage.getItem("challenge45_token"));
  const [completions, setCompletions] = useState({});
  const [selectedDay, setSelectedDay] = useState(() => getCurrentDayIndex());
  const [view, setView] = useState("today");
  const [photoForDay, setPhotoForDay] = useState(null);
  const [vaultPhotos, setVaultPhotos] = useState([]);
  const [vaultPreview, setVaultPreview] = useState(null);
  const [justChecked, setJustChecked] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef(null);
  const daySelectorRef = useRef(null);
  const syncTimer = useRef(null);

  const apiRef = useRef(null);

  // Build API helper whenever token changes
  useEffect(() => {
    apiRef.current = createApi(token, () => {
      setToken(null);
      localStorage.removeItem("challenge45_token");
      setAppState("login");
    });
  }, [token]);

  const api = useCallback((...args) => apiRef.current?.(...args), []);

  // --- Boot: check server status ---
  useEffect(() => {
    fetch("/api/status")
      .then(r => r.json())
      .then(data => {
        if (!data.setup) {
          setAppState("setup");
        } else if (!token) {
          setAppState("login");
        } else {
          // Token exists, try loading data
          loadData(token);
        }
      })
      .catch(() => {
        // Server not reachable — fallback to offline mode with localStorage
        try {
          const saved = JSON.parse(localStorage.getItem("challenge45_completions") || "{}");
          setCompletions(saved);
        } catch {}
        setAppState("app");
      });
  }, []);

  async function loadData(t) {
    const localApi = createApi(t, () => {
      setToken(null);
      localStorage.removeItem("challenge45_token");
      setAppState("login");
    });

    try {
      const [comp, photos] = await Promise.all([
        localApi("/api/completions"),
        localApi("/api/photos"),
      ]);

      if (comp === null) return; // unauthed, redirect handled

      setCompletions(comp || {});
      // Cache locally for offline fallback
      localStorage.setItem("challenge45_completions", JSON.stringify(comp || {}));

      if (photos) {
        setVaultPhotos(photos.map(p => ({ day: p.day, dataUrl: p.data_url, timestamp: p.timestamp })));
        const current = photos.find(p => p.day === getCurrentDayIndex());
        if (current) setPhotoForDay(current.data_url);
      }

      setAppState("app");
    } catch {
      // Offline fallback
      try {
        const saved = JSON.parse(localStorage.getItem("challenge45_completions") || "{}");
        setCompletions(saved);
      } catch {}
      setAppState("app");
    }
  }

  function handleAuthSuccess(newToken) {
    setToken(newToken);
    loadData(newToken);
  }

  // --- Sync completions to server (debounced) ---
  function syncCompletions(newCompletions) {
    // Save locally immediately
    localStorage.setItem("challenge45_completions", JSON.stringify(newCompletions));

    // Debounce server sync
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncing(true);
      try {
        await api("/api/completions", {
          method: "POST",
          body: { completions: newCompletions },
        });
      } catch {}
      setSyncing(false);
    }, 400);
  }

  // Load photo for selected day
  useEffect(() => {
    if (appState !== "app") return;
    // Check vault cache first
    const cached = vaultPhotos.find(p => p.day === selectedDay);
    if (cached) {
      setPhotoForDay(cached.dataUrl);
    } else if (token) {
      api(`/api/photos/${selectedDay}`).then(p => {
        setPhotoForDay(p?.data_url || null);
      }).catch(() => setPhotoForDay(null));
    } else {
      setPhotoForDay(null);
    }
  }, [selectedDay, appState]);

  // Load vault photos when entering vault view
  useEffect(() => {
    if (view === "vault" && token) {
      api("/api/photos").then(photos => {
        if (photos) {
          setVaultPhotos(photos.map(p => ({ day: p.day, dataUrl: p.data_url, timestamp: p.timestamp })));
        }
      }).catch(() => {});
    }
  }, [view]);

  // Auto-scroll day selector
  useEffect(() => {
    if (daySelectorRef.current && appState === "app") {
      const btn = daySelectorRef.current.children[selectedDay];
      if (btn) btn.scrollIntoView({ inline: "center", behavior: "instant" });
    }
  }, [appState]);

  function toggleTask(day, taskId) {
    const key = `${day}_${taskId}`;
    const wasChecked = !!completions[key];
    const newCompletions = { ...completions, [key]: !wasChecked };
    setCompletions(newCompletions);
    syncCompletions(newCompletions);

    if (!wasChecked) {
      setJustChecked(key);
      setTimeout(() => setJustChecked(null), 500);
    }
  }

  function isDayComplete(day) {
    return DAILY_TASKS.every(t => completions[`${day}_${t.id}`]);
  }

  function getDayProgress(day) {
    return DAILY_TASKS.filter(t => completions[`${day}_${t.id}`]).length;
  }

  const handlePhotoCapture = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        // Save to server
        api(`/api/photos/${selectedDay}`, {
          method: "POST",
          body: { dataUrl },
        }).then(() => {
          setPhotoForDay(dataUrl);
          // Update vault cache
          setVaultPhotos(prev => {
            const filtered = prev.filter(p => p.day !== selectedDay);
            return [...filtered, { day: selectedDay, dataUrl, timestamp: Date.now() }];
          });
          // Auto-check the photo task
          const key = `${selectedDay}_photo`;
          const newCompletions = { ...completions, [key]: true };
          setCompletions(newCompletions);
          syncCompletions(newCompletions);
          setJustChecked(`${selectedDay}_photo`);
          setTimeout(() => setJustChecked(null), 500);
        }).catch(() => {});
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [selectedDay, completions, api]);

  const handleDeletePhoto = useCallback(async (day) => {
    try {
      await api(`/api/photos/${day}`, { method: "DELETE" });
    } catch {}
    if (day === selectedDay) setPhotoForDay(null);
    setVaultPhotos(prev => prev.filter(p => p.day !== day));
    const key = `${day}_photo`;
    const newCompletions = { ...completions, [key]: false };
    setCompletions(newCompletions);
    syncCompletions(newCompletions);
  }, [selectedDay, completions, api]);

  // --- Loading screen ---
  if (appState === "loading") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace",
      }}>
        <style>{ANIM_STYLES}</style>
        <div style={{ textAlign: "center", animation: "fadeSlideUp 0.4s ease" }}>
          <div style={{ fontSize: 32, marginBottom: 16, animation: "lockPulse 2s ease infinite" }}>🔒</div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#555" }}>LOADING...</div>
        </div>
      </div>
    );
  }

  // --- PIN screens ---
  if (appState === "setup") {
    return <PinScreen mode="setup" onSuccess={handleAuthSuccess} />;
  }
  if (appState === "login") {
    return <PinScreen mode="login" onSuccess={handleAuthSuccess} />;
  }

  // --- Main app ---
  let streak = 0;
  for (let i = 0; i < 45; i++) {
    if (isDayComplete(i)) streak++;
    else break;
  }

  const totalCompleted = Array.from({ length: 45 }, (_, i) => i).filter(isDayComplete).length;
  const todayProgress = getDayProgress(selectedDay);
  const todayPercent = Math.round((todayProgress / DAILY_TASKS.length) * 100);
  const dayJustCompleted = todayPercent === 100;

  const byCategory = DAILY_TASKS.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  let taskFlatIdx = 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e5e5e5",
      fontFamily: "'Courier New', monospace",
      padding: "24px 16px",
      maxWidth: 520,
      margin: "0 auto",
    }}>
      <style>{ANIM_STYLES}</style>

      {/* Sync indicator */}
      {syncing && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          height: 2,
          backgroundImage: "linear-gradient(90deg, #ef4444, #ff6b6b, #ef4444)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1s linear infinite",
        }} />
      )}

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        style={{ display: "none" }}
      />

      {/* Header */}
      <div style={{ marginBottom: 28, animation: "fadeSlideDown 0.4s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", marginBottom: 4 }}>QUINTON /</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: "#fff", lineHeight: 1 }}>
              45 DAY
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: "#ef4444", lineHeight: 1 }}>
              HARD LOCK
            </div>
          </div>
          {/* Logout */}
          <button onClick={() => {
            localStorage.removeItem("challenge45_token");
            setToken(null);
            setAppState("login");
          }} style={{
            background: "transparent", border: "1px solid #222", color: "#333",
            fontSize: 9, letterSpacing: 2, padding: "4px 10px", cursor: "pointer",
            fontFamily: "'Courier New', monospace", marginTop: 4,
          }}>
            🔒 LOCK
          </button>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            background: streak > 0 ? "#ef4444" : "#1a1a1a",
            color: streak > 0 ? "#fff" : "#444",
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            animation: streak > 0 ? "streakFire 2s ease infinite" : "none",
          }}>
            🔥 {streak} DAY STREAK
          </div>
          <div style={{ fontSize: 11, color: "#555" }}>
            {totalCompleted}/45 COMPLETE
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
        {["today", "week", "calendar", "vault"].map((v, i) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1,
            padding: "8px",
            background: view === v ? (v === "vault" ? "#6b7280" : "#ef4444") : "#111",
            color: view === v ? "#fff" : "#555",
            border: "1px solid " + (view === v ? (v === "vault" ? "#6b7280" : "#ef4444") : "#222"),
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            cursor: "pointer",
            textTransform: "uppercase",
            transition: "all 0.25s ease",
            animation: `fadeSlideUp 0.3s ease ${i * 0.05}s both`,
          }}>
            {v === "vault" ? "📸 vault" : v}
          </button>
        ))}
      </div>

      {view === "today" && (
        <div key={`today-${selectedDay}`}>
          {/* Day Selector */}
          <div style={{ marginBottom: 20, animation: "fadeSlideUp 0.3s ease" }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 10 }}>SELECT DAY</div>
            <div ref={daySelectorRef} style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {Array.from({ length: 45 }, (_, i) => {
                const isCurrent = i === getCurrentDayIndex();
                const complete = isDayComplete(i);
                return (
                  <button key={i} onClick={() => setSelectedDay(i)} style={{
                    minWidth: 40,
                    height: 40,
                    background: selectedDay === i ? "#ef4444" : complete ? "#1a3a1a" : "#111",
                    color: selectedDay === i ? "#fff" : complete ? "#4ade80" : "#444",
                    border: isCurrent && selectedDay !== i
                      ? "2px solid #ef444488"
                      : "1px solid " + (selectedDay === i ? "#ef4444" : complete ? "#166534" : "#222"),
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    animation: selectedDay === i ? "glowPulse 2s ease infinite" : "none",
                  }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Header */}
          <div style={{
            marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            animation: "fadeSlideUp 0.35s ease",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 3 }}>DAY {selectedDay + 1}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{getDayLabel(selectedDay)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 24, fontWeight: 900,
                color: dayJustCompleted ? "#4ade80" : "#ef4444",
                animation: dayJustCompleted ? "progressGlow 1.5s ease infinite" : "none",
                transition: "color 0.3s ease",
              }}>
                {todayPercent}%
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>{todayProgress}/{DAILY_TASKS.length} DONE</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 3, background: "#1a1a1a", marginBottom: 24, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${todayPercent}%`,
              background: dayJustCompleted
                ? "linear-gradient(90deg, #4ade80, #22d3ee, #4ade80)"
                : "#ef4444",
              backgroundSize: dayJustCompleted ? "200% 100%" : "auto",
              animation: dayJustCompleted ? "shimmer 2s linear infinite" : "barFill 0.6s ease",
              transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }} />
          </div>

          {/* Tasks by Category */}
          {Object.entries(byCategory).map(([cat, tasks]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 9, letterSpacing: 4,
                color: CATEGORY_COLORS[cat], marginBottom: 8,
                borderLeft: `2px solid ${CATEGORY_COLORS[cat]}`,
                paddingLeft: 8, animation: "fadeSlideUp 0.3s ease",
              }}>
                {CATEGORY_LABELS[cat]}
              </div>
              {tasks.map(task => {
                const done = !!completions[`${selectedDay}_${task.id}`];
                const isPhotoTask = task.id === "photo";
                const taskKey = `${selectedDay}_${task.id}`;
                const wasJustChecked = justChecked === taskKey;
                const idx = taskFlatIdx++;
                return (
                  <div key={task.id} onClick={() => {
                    if (isPhotoTask && !done) {
                      fileInputRef.current?.click();
                    } else {
                      toggleTask(selectedDay, task.id);
                    }
                  }} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", marginBottom: 4,
                    background: done ? "#0d1f0d" : "#111",
                    border: `1px solid ${done ? "#166534" : "#1a1a1a"}`,
                    cursor: "pointer", transition: "all 0.25s ease",
                    animation: `fadeSlideUp 0.3s ease ${idx * 0.03}s both${wasJustChecked ? ", completeBurst 0.5s ease" : ""}`,
                  }}>
                    <div style={{
                      width: 18, height: 18,
                      border: `2px solid ${done ? "#4ade80" : "#333"}`,
                      background: done ? "#4ade80" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 10, transition: "all 0.2s ease",
                      animation: wasJustChecked ? "checkPop 0.35s ease" : "none",
                      borderRadius: done ? 2 : 0,
                    }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{
                      fontSize: 11, transition: "transform 0.2s ease",
                      transform: wasJustChecked ? "scale(1.3)" : "scale(1)",
                    }}>{task.icon}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, flex: 1,
                      color: done ? "#4ade80" : "#ccc",
                      textDecoration: done ? "line-through" : "none",
                      letterSpacing: 0.5, transition: "color 0.2s ease",
                    }}>
                      {task.label}
                    </span>
                    {isPhotoTask && done && photoForDay && (
                      <span style={{ fontSize: 9, letterSpacing: 1, color: "#4ade80", animation: "popIn 0.3s ease" }}>
                        SAVED
                      </span>
                    )}
                    {isPhotoTask && (
                      <span
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        style={{
                          fontSize: 9, letterSpacing: 1, color: "#6b7280",
                          border: "1px solid #333", padding: "2px 8px", cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {done ? "RETAKE" : "SNAP"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* 100% completion celebration */}
          {dayJustCompleted && (
            <div style={{
              textAlign: "center", padding: "16px", marginBottom: 16,
              border: "1px solid #4ade8044",
              background: "linear-gradient(135deg, #0d1f0d, #0a1a0a)",
              animation: "popIn 0.5s ease, progressGlow 2s ease infinite",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🔥</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#4ade80", letterSpacing: 3 }}>
                DAY {selectedDay + 1} LOCKED IN
              </div>
              <div style={{ fontSize: 10, color: "#166534", marginTop: 4 }}>ALL TASKS COMPLETE</div>
            </div>
          )}

          {/* Weekly Snapshot */}
          <div style={{
            marginTop: 24, padding: 16, border: "1px solid #f59e0b33", background: "#0d0a00",
            animation: "fadeSlideUp 0.4s ease 0.2s both",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#f59e0b" }}>WEEK {getWeekNumber(selectedDay) + 1} TASKS</div>
              <button onClick={() => setView("week")} style={{
                fontSize: 9, letterSpacing: 2, color: "#f59e0b", background: "transparent",
                border: "1px solid #f59e0b44", padding: "3px 8px", cursor: "pointer",
              }}>VIEW →</button>
            </div>
            {WEEKLY_TASKS.map(t => {
              const week = getWeekNumber(selectedDay);
              const done = !!completions[`w${week}_${t.id}`];
              return (
                <div key={t.id} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <div style={{
                    width: 10, height: 10, flexShrink: 0,
                    border: `1px solid ${done ? "#4ade80" : "#333"}`,
                    background: done ? "#4ade80" : "transparent",
                    transition: "all 0.2s ease",
                  }} />
                  <span style={{ fontSize: 11, color: done ? "#4ade80" : "#666", textDecoration: done ? "line-through" : "none" }}>
                    {t.icon} {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (() => {
        const week = getWeekNumber(selectedDay);
        const weekStart = week * 7;
        const days = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d < 45);
        return (
          <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: 4, color: "#555" }}>WEEK {week + 1} OF 7</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
                  {getDayLabel(weekStart)} — {getDayLabel(Math.min(weekStart + 6, 44))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { if (week > 0) setSelectedDay((week - 1) * 7); }} style={{
                  padding: "6px 10px", background: "#111", border: "1px solid #222",
                  color: week > 0 ? "#ccc" : "#333", cursor: week > 0 ? "pointer" : "default", fontSize: 12,
                  transition: "all 0.2s ease",
                }}>←</button>
                <button onClick={() => { if (week < 6 && (week + 1) * 7 < 45) setSelectedDay((week + 1) * 7); }} style={{
                  padding: "6px 10px", background: "#111", border: "1px solid #222",
                  color: week < 6 ? "#ccc" : "#333", cursor: week < 6 ? "pointer" : "default", fontSize: 12,
                  transition: "all 0.2s ease",
                }}>→</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 24 }}>
              {days.map((dayIdx, i) => {
                const complete = isDayComplete(dayIdx);
                const progress = getDayProgress(dayIdx);
                const isSelected = dayIdx === selectedDay;
                return (
                  <div key={dayIdx} onClick={() => { setSelectedDay(dayIdx); setView("today"); }} style={{
                    padding: "8px 4px",
                    background: isSelected ? "#ef4444" : complete ? "#0d1f0d" : "#111",
                    border: `1px solid ${isSelected ? "#ef4444" : complete ? "#166534" : "#1a1a1a"}`,
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s ease",
                    animation: `popIn 0.3s ease ${i * 0.05}s both`,
                  }}>
                    <div style={{ fontSize: 9, color: isSelected ? "#fff" : "#555", marginBottom: 4, letterSpacing: 1 }}>
                      {getDayLabel(dayIdx).split(" ")[0].toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: isSelected ? "#fff" : complete ? "#4ade80" : "#ccc" }}>
                      {dayIdx + 1}
                    </div>
                    <div style={{ fontSize: 8, color: isSelected ? "#ffaaaa" : complete ? "#166534" : "#333", marginTop: 4 }}>
                      {complete ? "✓" : `${progress}/${DAILY_TASKS.length}`}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#555", marginBottom: 10 }}>DAILY COMPLETION</div>
              {days.map((dayIdx, i) => {
                const progress = getDayProgress(dayIdx);
                const pct = Math.round((progress / DAILY_TASKS.length) * 100);
                const complete = isDayComplete(dayIdx);
                return (
                  <div key={dayIdx} style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                    animation: `slideInRight 0.3s ease ${i * 0.05}s both`,
                  }}>
                    <div style={{ fontSize: 10, color: "#555", width: 16, textAlign: "right" }}>{dayIdx + 1}</div>
                    <div style={{ flex: 1, height: 6, background: "#1a1a1a", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: complete ? "#4ade80" : pct > 0 ? "#ef4444" : "transparent",
                        animation: "barFill 0.8s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: complete ? "#4ade80" : "#444", width: 28 }}>{pct}%</div>
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: 16, border: "1px solid #f59e0b33", background: "#0d0a00",
              animation: "fadeSlideUp 0.4s ease 0.2s both",
            }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#f59e0b", marginBottom: 14 }}>
                WEEKLY TASKS — COMPLETE ONCE THIS WEEK
              </div>
              {WEEKLY_TASKS.map((t, i) => {
                const done = !!completions[`w${week}_${t.id}`];
                return (
                  <div key={t.id} onClick={() => {
                    const key = `w${week}_${t.id}`;
                    const newComp = { ...completions, [key]: !done };
                    setCompletions(newComp);
                    syncCompletions(newComp);
                  }} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px", marginBottom: 6,
                    background: done ? "#0d1a00" : "#111",
                    border: `1px solid ${done ? "#166534" : "#1a1a1a"}`,
                    cursor: "pointer", transition: "all 0.2s ease",
                    animation: `fadeSlideUp 0.3s ease ${0.3 + i * 0.05}s both`,
                  }}>
                    <div style={{
                      width: 20, height: 20, flexShrink: 0,
                      border: `2px solid ${done ? "#4ade80" : "#f59e0b55"}`,
                      background: done ? "#4ade80" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, transition: "all 0.2s ease",
                    }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 13 }}>{t.icon}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
                      color: done ? "#4ade80" : "#ccc",
                      textDecoration: done ? "line-through" : "none",
                      transition: "all 0.2s ease",
                    }}>
                      {t.label}
                    </span>
                  </div>
                );
              })}
              <div style={{ marginTop: 10, fontSize: 10, color: "#333" }}>
                {WEEKLY_TASKS.filter(t => completions[`w${week}_${t.id}`]).length}/{WEEKLY_TASKS.length} DONE THIS WEEK
              </div>
            </div>
          </div>
        );
      })()}

      {view === "calendar" && (
        <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 16 }}>45 DAY OVERVIEW</div>
          {Array.from({ length: 7 }, (_, weekIdx) => (
            <div key={weekIdx} style={{
              marginBottom: 20, animation: `fadeSlideUp 0.3s ease ${weekIdx * 0.06}s both`,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#444", marginBottom: 8 }}>WEEK {weekIdx + 1}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: 7 }, (_, dayOfWeek) => {
                  const dayIdx = weekIdx * 7 + dayOfWeek;
                  if (dayIdx >= 45) return <div key={dayOfWeek} />;
                  const complete = isDayComplete(dayIdx);
                  const progress = getDayProgress(dayIdx);
                  const partial = progress > 0 && !complete;
                  return (
                    <div key={dayOfWeek} onClick={() => { setSelectedDay(dayIdx); setView("today"); }} style={{
                      aspectRatio: "1",
                      background: complete ? "#0d1f0d" : partial ? "#1a0f00" : "#111",
                      border: `1px solid ${complete ? "#166534" : partial ? "#78350f" : "#1a1a1a"}`,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      cursor: "pointer", gap: 2, transition: "all 0.2s ease",
                      animation: `tileFlip 0.4s ease ${(weekIdx * 7 + dayOfWeek) * 0.02}s both`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: complete ? "#4ade80" : partial ? "#f59e0b" : "#444" }}>
                        {dayIdx + 1}
                      </div>
                      <div style={{ fontSize: 8, color: complete ? "#166534" : "#333" }}>
                        {complete ? "✓" : `${progress}/${DAILY_TASKS.length}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 16, marginTop: 8, animation: "fadeSlideUp 0.4s ease 0.4s both" }}>
            {[["#4ade80", "Complete"], ["#f59e0b", "Partial"], ["#444", "Untouched"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#555" }}>
                <div style={{ width: 8, height: 8, background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHOTO VAULT VIEW */}
      {view === "vault" && (
        <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: 3, marginBottom: 16 }}>
            PROGRESS PHOTO VAULT
          </div>

          {vaultPhotos.length === 0 ? (
            <div style={{
              padding: 40, textAlign: "center",
              border: "1px dashed #333", background: "#111",
              animation: "popIn 0.4s ease",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>NO PHOTOS YET</div>
              <div style={{ fontSize: 10, color: "#333" }}>
                Tap "Progress Photo" on any day to capture
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#444", marginBottom: 16, letterSpacing: 2 }}>
                {vaultPhotos.length} PHOTO{vaultPhotos.length !== 1 ? "S" : ""} CAPTURED
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                {vaultPhotos
                  .sort((a, b) => a.day - b.day)
                  .map((photo, i) => (
                    <div key={photo.day} onClick={() => setVaultPreview(photo.day)} style={{
                      position: "relative", cursor: "pointer",
                      aspectRatio: "1", overflow: "hidden",
                      border: "1px solid #222",
                      animation: `popIn 0.3s ease ${i * 0.05}s both`,
                    }}>
                      <img src={photo.dataUrl} alt={`Day ${photo.day + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "linear-gradient(transparent, #000a)",
                        padding: "12px 6px 4px",
                        fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 2,
                      }}>
                        DAY {photo.day + 1}
                      </div>
                    </div>
                  ))}
              </div>
              {vaultPhotos.length >= 2 && (
                <div style={{
                  marginTop: 16, padding: 12, border: "1px solid #222", background: "#111",
                  fontSize: 10, color: "#444", textAlign: "center", letterSpacing: 1,
                  animation: "fadeSlideUp 0.4s ease 0.3s both",
                }}>
                  TAP ANY PHOTO TO VIEW FULL SIZE
                </div>
              )}
            </>
          )}

          {vaultPreview !== null && (() => {
            const photo = vaultPhotos.find(p => p.day === vaultPreview);
            if (!photo) return null;
            return (
              <div onClick={() => setVaultPreview(null)} style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "#000e", zIndex: 100,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 16, animation: "overlayFadeIn 0.25s ease",
              }}>
                <div style={{
                  fontSize: 11, letterSpacing: 4, color: "#fff",
                  marginBottom: 12, fontWeight: 700,
                  animation: "fadeSlideDown 0.3s ease 0.1s both",
                }}>
                  DAY {photo.day + 1} — {getDayLabel(photo.day).toUpperCase()}
                </div>
                <img src={photo.dataUrl} alt={`Day ${photo.day + 1}`}
                  style={{
                    maxWidth: "100%", maxHeight: "70vh",
                    objectFit: "contain", border: "2px solid #333",
                    animation: "overlayImgScale 0.35s ease",
                  }} />
                <div style={{ display: "flex", gap: 12, marginTop: 16, animation: "fadeSlideUp 0.3s ease 0.15s both" }}>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete Day ${photo.day + 1} photo?`)) {
                      handleDeletePhoto(photo.day);
                      setVaultPreview(null);
                    }
                  }} style={{
                    fontSize: 10, letterSpacing: 2, padding: "6px 16px",
                    background: "#1a0000", border: "1px solid #ef444488",
                    color: "#ef4444", cursor: "pointer",
                  }}>DELETE</button>
                  <button onClick={(e) => { e.stopPropagation(); setVaultPreview(null); }} style={{
                    fontSize: 10, letterSpacing: 2, padding: "6px 16px",
                    background: "#111", border: "1px solid #333",
                    color: "#ccc", cursor: "pointer",
                  }}>CLOSE</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 10, color: "#2a2a2a", textAlign: "center", letterSpacing: 2 }}>
        NO LAPSES. NO EXCUSES. 45 DAYS.
      </div>
    </div>
  );
}
