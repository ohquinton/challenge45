import { useState, useEffect } from "react";

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

function getDayLabel(dayIndex) {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekNumber(dayIndex) {
  return Math.floor(dayIndex / 7);
}

export default function App() {
  const [completions, setCompletions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("challenge45_completions") || "{}");
    } catch { return {}; }
  });
  const [selectedDay, setSelectedDay] = useState(0);
  const [view, setView] = useState("today"); // today | week | calendar

  useEffect(() => {
    try {
      localStorage.setItem("challenge45_completions", JSON.stringify(completions));
    } catch {}
  }, [completions]);

  function toggleTask(day, taskId) {
    const key = `${day}_${taskId}`;
    setCompletions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function isDayComplete(day) {
    return DAILY_TASKS.every(t => completions[`${day}_${t.id}`]);
  }

  function getDayProgress(day) {
    return DAILY_TASKS.filter(t => completions[`${day}_${t.id}`]).length;
  }

  // Calculate current streak
  let streak = 0;
  for (let i = 0; i < 45; i++) {
    if (isDayComplete(i)) streak++;
    else break;
  }

  const todayProgress = getDayProgress(selectedDay);
  const todayPercent = Math.round((todayProgress / DAILY_TASKS.length) * 100);

  const byCategory = DAILY_TASKS.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

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

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", marginBottom: 4 }}>QUINTON /</div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: "#fff", lineHeight: 1 }}>
          45 DAY
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: "#ef4444", lineHeight: 1 }}>
          HARD LOCK
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            background: streak > 0 ? "#ef4444" : "#1a1a1a",
            color: streak > 0 ? "#fff" : "#444",
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
          }}>
            🔥 {streak} DAY STREAK
          </div>
          <div style={{ fontSize: 11, color: "#555" }}>
            {45 - streak} REMAINING
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
        {["today", "week", "calendar"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1,
            padding: "8px",
            background: view === v ? "#ef4444" : "#111",
            color: view === v ? "#fff" : "#555",
            border: "1px solid " + (view === v ? "#ef4444" : "#222"),
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            cursor: "pointer",
            textTransform: "uppercase",
          }}>
            {v}
          </button>
        ))}
      </div>

      {view === "today" && (
        <>
          {/* Day Selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 10 }}>SELECT DAY</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {Array.from({ length: 45 }, (_, i) => (
                <button key={i} onClick={() => setSelectedDay(i)} style={{
                  minWidth: 40,
                  height: 40,
                  background: selectedDay === i ? "#ef4444" : isDayComplete(i) ? "#1a3a1a" : "#111",
                  color: selectedDay === i ? "#fff" : isDayComplete(i) ? "#4ade80" : "#444",
                  border: "1px solid " + (selectedDay === i ? "#ef4444" : isDayComplete(i) ? "#166534" : "#222"),
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Day Header */}
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 3 }}>DAY {selectedDay + 1}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{getDayLabel(selectedDay)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: todayPercent === 100 ? "#4ade80" : "#ef4444" }}>
                {todayPercent}%
              </div>
              <div style={{ fontSize: 10, color: "#555" }}>{todayProgress}/{DAILY_TASKS.length} DONE</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 3, background: "#1a1a1a", marginBottom: 24 }}>
            <div style={{
              height: "100%",
              width: `${todayPercent}%`,
              background: todayPercent === 100 ? "#4ade80" : "#ef4444",
              transition: "width 0.3s ease",
            }} />
          </div>

          {/* Tasks by Category */}
          {Object.entries(byCategory).map(([cat, tasks]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 9,
                letterSpacing: 4,
                color: CATEGORY_COLORS[cat],
                marginBottom: 8,
                borderLeft: `2px solid ${CATEGORY_COLORS[cat]}`,
                paddingLeft: 8,
              }}>
                {CATEGORY_LABELS[cat]}
              </div>
              {tasks.map(task => {
                const done = !!completions[`${selectedDay}_${task.id}`];
                return (
                  <div key={task.id} onClick={() => toggleTask(selectedDay, task.id)} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    marginBottom: 4,
                    background: done ? "#0d1f0d" : "#111",
                    border: `1px solid ${done ? "#166534" : "#1a1a1a"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <div style={{
                      width: 18,
                      height: 18,
                      border: `2px solid ${done ? "#4ade80" : "#333"}`,
                      background: done ? "#4ade80" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 10,
                    }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 11 }}>{task.icon}</span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: done ? "#4ade80" : "#ccc",
                      textDecoration: done ? "line-through" : "none",
                      letterSpacing: 0.5,
                    }}>
                      {task.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Weekly Snapshot */}
          <div style={{ marginTop: 24, padding: 16, border: "1px solid #f59e0b33", background: "#0d0a00" }}>
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
                  }} />
                  <span style={{ fontSize: 11, color: done ? "#4ade80" : "#666", textDecoration: done ? "line-through" : "none" }}>
                    {t.icon} {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === "week" && (() => {
        const week = getWeekNumber(selectedDay);
        const weekStart = week * 7;
        const days = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d < 45);
        return (
          <div>
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
                }}>←</button>
                <button onClick={() => { if (week < 6 && (week + 1) * 7 < 45) setSelectedDay((week + 1) * 7); }} style={{
                  padding: "6px 10px", background: "#111", border: "1px solid #222",
                  color: week < 6 ? "#ccc" : "#333", cursor: week < 6 ? "pointer" : "default", fontSize: 12,
                }}>→</button>
              </div>
            </div>

            {/* 7-day strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 24 }}>
              {days.map(dayIdx => {
                const complete = isDayComplete(dayIdx);
                const progress = getDayProgress(dayIdx);
                const isSelected = dayIdx === selectedDay;
                return (
                  <div key={dayIdx} onClick={() => { setSelectedDay(dayIdx); setView("today"); }} style={{
                    padding: "8px 4px",
                    background: isSelected ? "#ef4444" : complete ? "#0d1f0d" : "#111",
                    border: `1px solid ${isSelected ? "#ef4444" : complete ? "#166534" : "#1a1a1a"}`,
                    cursor: "pointer",
                    textAlign: "center",
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

            {/* Daily completion bars */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#555", marginBottom: 10 }}>DAILY COMPLETION</div>
              {days.map(dayIdx => {
                const progress = getDayProgress(dayIdx);
                const pct = Math.round((progress / DAILY_TASKS.length) * 100);
                const complete = isDayComplete(dayIdx);
                return (
                  <div key={dayIdx} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#555", width: 16, textAlign: "right" }}>{dayIdx + 1}</div>
                    <div style={{ flex: 1, height: 6, background: "#1a1a1a" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: complete ? "#4ade80" : pct > 0 ? "#ef4444" : "transparent",
                        transition: "width 0.3s",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: complete ? "#4ade80" : "#444", width: 28 }}>{pct}%</div>
                  </div>
                );
              })}
            </div>

            {/* Weekly-only tasks */}
            <div style={{ padding: 16, border: "1px solid #f59e0b33", background: "#0d0a00" }}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: "#f59e0b", marginBottom: 14 }}>
                WEEKLY TASKS — COMPLETE ONCE THIS WEEK
              </div>
              {WEEKLY_TASKS.map(t => {
                const done = !!completions[`w${week}_${t.id}`];
                return (
                  <div key={t.id} onClick={() => {
                    const key = `w${week}_${t.id}`;
                    setCompletions(prev => ({ ...prev, [key]: !prev[key] }));
                  }} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px", marginBottom: 6,
                    background: done ? "#0d1a00" : "#111",
                    border: `1px solid ${done ? "#166534" : "#1a1a1a"}`,
                    cursor: "pointer",
                  }}>
                    <div style={{
                      width: 20, height: 20, flexShrink: 0,
                      border: `2px solid ${done ? "#4ade80" : "#f59e0b55"}`,
                      background: done ? "#4ade80" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11,
                    }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 13 }}>{t.icon}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
                      color: done ? "#4ade80" : "#ccc",
                      textDecoration: done ? "line-through" : "none",
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
        <div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 16 }}>45 DAY OVERVIEW</div>
          {Array.from({ length: 7 }, (_, weekIdx) => (
            <div key={weekIdx} style={{ marginBottom: 20 }}>
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
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      gap: 2,
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

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {[["#4ade80", "Complete"], ["#f59e0b", "Partial"], ["#444", "Untouched"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#555" }}>
                <div style={{ width: 8, height: 8, background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 10, color: "#2a2a2a", textAlign: "center", letterSpacing: 2 }}>
        NO LAPSES. NO EXCUSES. 45 DAYS.
      </div>
    </div>
  );
}
