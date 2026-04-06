"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

// --- TYPES ---
type Session = {
  id: string;
  date: string;
  topic: string;
  duration_minutes: number;
  note: string;
};
type Settings = {
  startDate: string;
  goalHours: number;
  name: string;
  weekdayTarget: number;
  weekendTarget: number;
  showCricket: boolean;
  enableNotifications: boolean;
};
type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string;
};

// --- CONSTANTS ---
const SCHEDULE_BLOCKS = [
  { id: "sleep", label: "Sleep", icon: "🌙", start: "02:00", end: "08:30", color: "gray", type: "fixed", subtitle: "" },
  { id: "morning", label: "Morning Prep", icon: "☀️", start: "08:30", end: "10:00", color: "gray", type: "fixed", subtitle: "light review + breakfast" },
  { id: "job1", label: "Morning Job", icon: "💼", start: "10:00", end: "14:00", color: "blue", type: "fixed", subtitle: "" },
  { id: "study1", label: "Core Study #1", icon: "📚", start: "14:30", end: "16:30", color: "green", type: "study", subtitle: "" },
  { id: "cricket", label: "Cricket", icon: "🏏", start: "17:00", end: "19:00", color: "amber", type: "fixed", subtitle: "" },
  { id: "study2", label: "Study #2", icon: "📺", start: "19:00", end: "19:45", color: "green", type: "study", subtitle: "YouTube / supplementary only" },
  { id: "job2", label: "Night Job", icon: "🌙", start: "20:00", end: "02:00", color: "blue", type: "fixed", subtitle: "" },
];

const WEEK_PLAN = [
  { week: 1, title: "Foundations", dates: "Week 1", hoursTarget: 19, goals: ["Complete AtomCamp modules 1–3", "Watch YouTube playlists for each topic", "Set up GitHub repo for progress tracking"] },
  { week: 2, title: "Foundations", dates: "Week 2", hoursTarget: 19, goals: ["Complete AtomCamp modules 4–6", "Practice coding exercises daily", "Review and summarize key concepts"] },
  { week: 3, title: "Core Skills", dates: "Week 3", hoursTarget: 19, goals: ["Deep dive into main technical track", "Build first mini project", "Post week 3 progress on LinkedIn"] },
  { week: 4, title: "Core Skills", dates: "Week 4", hoursTarget: 19, goals: ["Complete advanced modules", "Refine mini project", "Join study groups or Discord"] },
  { week: 5, title: "Projects + Portfolio", dates: "Week 5", hoursTarget: 19, goals: ["Build 2 portfolio projects using course skills", "Push to GitHub with README", "Start applying to 3 remote roles per week"] },
  { week: 6, title: "Projects + Portfolio", dates: "Week 6", hoursTarget: 19, goals: ["Polish portfolio projects", "Write case studies for each project", "Reach out to 5 professionals on LinkedIn"] },
  { week: 7, title: "Interview Prep", dates: "Week 7", hoursTarget: 19, goals: ["Technical mock interviews", "System design basics", "Optimize LinkedIn + resume"] },
  { week: 8, title: "Final Push", dates: "Week 8", hoursTarget: 19, goals: ["Complete AtomCamp certification", "Apply to 5+ roles", "Follow up on all applications"] },
];

const DEFAULT_SETTINGS: Settings = {
  startDate: new Date().toISOString().split("T")[0],
  goalHours: 160,
  name: "Learner",
  weekdayTarget: 2.7,
  weekendTarget: 5,
  showCricket: true,
  enableNotifications: true,
};

const DEFAULT_STREAK: StreakData = { currentStreak: 0, longestStreak: 0, lastLoggedDate: "" };

// --- UTILITY FUNCTIONS ---
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDayLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toDateStr(d);
  });
}

function computeStreak(sessions: Session[]): StreakData {
  const today = toDateStr(new Date());
  const datesWithHours = new Set(sessions.filter((s) => s.duration_minutes > 0).map((s) => s.date));
  let current = 0;
  let longest = 0;
  let lastLogged = "";
  const check = new Date();
  check.setDate(check.getDate() - 1);
  while (current <= 365) {
    const ds = toDateStr(check);
    if (ds === today) { check.setDate(check.getDate() - 1); continue; }
    if (datesWithHours.has(ds)) {
      current++;
      if (!lastLogged) lastLogged = ds;
      if (current > longest) longest = current;
    } else break;
    check.setDate(check.getDate() - 1);
  }
  const sortedDates = Array.from(datesWithHours).sort();
  let streak = 0;
  let maxStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { streak = 1; }
    else {
      const prev = new Date(sortedDates[i - 1] + "T12:00:00");
      const curr = new Date(sortedDates[i] + "T12:00:00");
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > maxStreak) maxStreak = streak;
  }
  return { currentStreak: current, longestStreak: Math.max(longest, maxStreak), lastLoggedDate: lastLogged };
}

// --- MAIN COMPONENT ---
export default function Home() {
  const [activeTab, setActiveTab] = useState<"today" | "tracker" | "weekly" | "plan">("today");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTopic, setLogTopic] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logNote, setLogNote] = useState("");
  const [settingsDraft, setSettingsDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progressAnimated, setProgressAnimated] = useState(false);
  const [swRunning, setSwRunning] = useState(false);
  const [swSeconds, setSwSeconds] = useState(0);
  const swInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem("atomcamp_sessions");
      if (s) setSessions(JSON.parse(s));
      const st = localStorage.getItem("atomcamp_settings");
      if (st) setSettings(JSON.parse(st));
      const sk = localStorage.getItem("atomcamp_streak");
      if (sk) setStreak(JSON.parse(sk));
      const cw = localStorage.getItem("atomcamp_completed_weeks");
      if (cw) setCompletedWeeks(JSON.parse(cw));
    } catch { /* ignore parse errors */ }
    setTimeout(() => setProgressAnimated(true), 200);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (swRunning) {
      swInterval.current = setInterval(() => setSwSeconds((s) => s + 1), 1000);
    } else {
      if (swInterval.current) clearInterval(swInterval.current);
    }
    return () => { if (swInterval.current) clearInterval(swInterval.current); };
  }, [swRunning]);

  useEffect(() => {
    if (!mounted || !settings.enableNotifications) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const schedule = [
      { h: 14, m: 25, msg: "📚 Study block starts in 5 minutes" },
      { h: 19, m: 0, msg: "📺 Quick YouTube session — 45 mins" },
      { h: 23, m: 59, msg: "📊 Don't forget to log today's study hours" },
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    schedule.forEach(({ h, m, msg }) => {
      const target = new Date();
      target.setHours(h, m, 0, 0);
      const diff = target.getTime() - Date.now();
      if (diff > 0) {
        timers.push(setTimeout(() => {
          if (Notification.permission === "granted") new Notification(msg);
        }, diff));
      }
    });
    if (Notification.permission === "default") Notification.requestPermission();
    return () => timers.forEach(clearTimeout);
  }, [mounted, settings.enableNotifications]);

  const saveSessions = useCallback((s: Session[]) => {
    setSessions(s);
    localStorage.setItem("atomcamp_sessions", JSON.stringify(s));
    const sk = computeStreak(s);
    setStreak(sk);
    localStorage.setItem("atomcamp_streak", JSON.stringify(sk));
  }, []);

  const saveSettings = useCallback((s: Settings) => {
    setSettings(s);
    localStorage.setItem("atomcamp_settings", JSON.stringify(s));
  }, []);

  const totalMinutes = useMemo(() => sessions.reduce((a, s) => a + s.duration_minutes, 0), [sessions]);
  const totalHours = totalMinutes / 60;

  const startDate = useMemo(() => {
    try { return new Date(settings.startDate + "T00:00:00"); } catch { return new Date(); }
  }, [settings.startDate]);

  const daysSinceStart = useMemo(() => {
    const now2 = new Date(); now2.setHours(0, 0, 0, 0);
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((now2.getTime() - start.getTime()) / 86400000));
  }, [startDate]);

  const daysRemaining = Math.max(0, 60 - daysSinceStart);
  const remainingHours = Math.max(0, settings.goalHours - totalHours);
  const dailyAvgNeeded = daysRemaining > 0 ? remainingHours / daysRemaining : 0;
  const expectedHours = (60 - daysRemaining) * (settings.goalHours / 60);
  const progressPct = Math.min(100, (totalHours / settings.goalHours) * 100);

  const motivationalStatus = useMemo(() => {
    if (streak.currentStreak >= 3) return `🔥 On fire! ${streak.currentStreak} days streak`;
    if (totalHours >= expectedHours + 5) return "🏆 Ahead of schedule!";
    if (totalHours >= expectedHours) return "✅ On track — keep going";
    if (totalHours >= expectedHours - 5) return "⚠️ Slightly behind — log 1 more hour today";
    return "🚨 Behind schedule — catch up this weekend";
  }, [streak.currentStreak, totalHours, expectedHours]);

  const currentBlock = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return SCHEDULE_BLOCKS.find((b) => {
      const start = timeToMinutes(b.start);
      const end = timeToMinutes(b.end);
      if (end < start) return nowMin >= start || nowMin < end;
      return nowMin >= start && nowMin < end;
    });
  }, [now]);

  const nextStudyBlock = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const studyBlocks = SCHEDULE_BLOCKS.filter((b) => b.type === "study");
    for (const b of studyBlocks) {
      const start = timeToMinutes(b.start);
      if (start > nowMin) return { block: b, minsUntil: start - nowMin };
    }
    return null;
  }, [now]);

  const handleLogSubmit = useCallback(() => {
    const mins = parseInt(logDuration, 10);
    if (!logTopic.trim() || isNaN(mins) || mins <= 0) return;
    const newSession: Session = {
      id: Date.now().toString(),
      date: toDateStr(now),
      topic: logTopic.trim(),
      duration_minutes: mins,
      note: logNote.trim(),
    };
    saveSessions([...sessions, newSession]);
    setShowLogModal(false);
    setLogTopic(""); setLogDuration(""); setLogNote("");
    setSwSeconds(0); setSwRunning(false);
  }, [logTopic, logDuration, logNote, now, sessions, saveSessions]);

  const openLogModal = useCallback((topic = "", minutes = "") => {
    setLogTopic(topic); setLogDuration(minutes); setLogNote("");
    setShowLogModal(true);
  }, []);

  const handleStopLog = useCallback(() => {
    setSwRunning(false);
    openLogModal(currentBlock?.label ?? "Study Session", Math.round(swSeconds / 60).toString());
  }, [swSeconds, currentBlock, openLogModal]);

  const deleteSession = useCallback((id: string) => {
    saveSessions(sessions.filter((s) => s.id !== id));
  }, [sessions, saveSessions]);

  const toggleWeekComplete = useCallback((week: number) => {
    const updated = completedWeeks.includes(week)
      ? completedWeeks.filter((w) => w !== week)
      : [...completedWeeks, week];
    setCompletedWeeks(updated);
    localStorage.setItem("atomcamp_completed_weeks", JSON.stringify(updated));
  }, [completedWeeks]);

  const weeklyChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = toDateStr(d);
      const dayHours = sessions.filter((s) => s.date === dateStr).reduce((a, s) => a + s.duration_minutes, 0) / 60;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const target = isWeekend ? settings.weekendTarget : settings.weekdayTarget;
      return { day: getDayLabel(dateStr), hours: Math.round(dayHours * 10) / 10, target, met: dayHours >= target };
    });
  }, [sessions, settings]);

  const weekDates = useMemo(() => getWeekDates(), []);

  const weekCurrent = useMemo(() => {
    const diff = (Date.now() - startDate.getTime()) / 86400000;
    return Math.min(8, Math.max(1, Math.floor(diff / 7) + 1));
  }, [startDate]);

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading…</div>;

  const blocksToShow = settings.showCricket ? SCHEDULE_BLOCKS : SCHEDULE_BLOCKS.filter((b) => b.id !== "cricket");

  const colorBorder: Record<string, string> = {
    gray: "border-gray-600 bg-gray-800/60",
    blue: "border-blue-700 bg-blue-900/40",
    green: "border-green-600 bg-green-900/40",
    amber: "border-amber-600 bg-amber-900/40",
  };
  const colorText: Record<string, string> = {
    gray: "text-gray-300", blue: "text-blue-300", green: "text-green-300", amber: "text-amber-300",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col max-w-2xl mx-auto">
      <header className="sticky top-0 z-40 bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-400">⚡ AtomCamp Tracker</h1>
            <p className="text-xs text-gray-400 mt-0.5">{motivationalStatus}</p>
          </div>
          <button onClick={() => { setSettingsDraft(settings); setShowSettings(true); }} className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xl">⚙️</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === "today" && (
          <div className="space-y-4">
            <div className="text-center text-2xl font-mono text-green-400 font-bold">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>

            {currentBlock?.type === "study" ? (
              <div className="bg-green-900/30 border border-green-600 rounded-xl p-4 text-center space-y-2">
                <div className="text-green-300 font-semibold">📚 Study session active: {currentBlock.label}</div>
                <div className="text-3xl font-mono font-bold text-green-400">
                  {String(Math.floor(swSeconds / 3600)).padStart(2, "0")}:
                  {String(Math.floor((swSeconds % 3600) / 60)).padStart(2, "0")}:
                  {String(swSeconds % 60).padStart(2, "0")}
                </div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setSwRunning(!swRunning)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${swRunning ? "bg-amber-600 hover:bg-amber-500" : "bg-green-600 hover:bg-green-500"}`}>
                    {swRunning ? "⏸ Pause" : "▶ Start"}
                  </button>
                  <button onClick={handleStopLog} className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-700 hover:bg-red-600">⏹ Stop & Log</button>
                </div>
              </div>
            ) : nextStudyBlock ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
                <span className="text-gray-400 text-sm">Next study block in </span>
                <span className="text-green-400 font-semibold">{formatDuration(nextStudyBlock.minsUntil)}</span>
                <span className="text-gray-400 text-sm"> — {nextStudyBlock.block.label}</span>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center text-gray-400 text-sm">No more study blocks today — great work! 🌙</div>
            )}

            <div className="space-y-2">
              {blocksToShow.map((block) => {
                const isActive = currentBlock?.id === block.id;
                const activeCls = isActive && block.type === "study"
                  ? "border-green-400 shadow-green-500/30 shadow-lg"
                  : isActive ? "border-yellow-400 shadow-yellow-400/20 shadow-md" : "";
                return (
                  <div key={block.id} className={`rounded-xl border p-3 flex items-start gap-3 ${colorBorder[block.color] ?? colorBorder.gray} ${activeCls}`}>
                    <div className="text-2xl flex-shrink-0 mt-0.5">{block.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${colorText[block.color] ?? "text-gray-300"}`}>{block.label}</span>
                        {isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">Active</span>}
                        <span className="ml-auto text-xs text-gray-500 bg-gray-900/60 px-2 py-0.5 rounded-full whitespace-nowrap">{block.start}–{block.end}</span>
                      </div>
                      {block.subtitle && <p className="text-xs text-gray-500 mt-0.5">{block.subtitle}</p>}
                      <div className="text-xs text-gray-500 mt-1">{(() => {
                        const s = timeToMinutes(block.start);
                        const e = timeToMinutes(block.end);
                        return formatDuration(e < s ? (24 * 60 - s + e) : (e - s));
                      })()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => openLogModal()} className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 font-semibold text-white text-sm">+ Log Manual Session</button>
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Logged", value: `${totalHours.toFixed(1)}h`, sub: `/ ${settings.goalHours}h goal` },
                { label: "Remaining", value: `${remainingHours.toFixed(1)}h`, sub: "to go" },
                { label: "Days Left", value: `${daysRemaining}`, sub: "of 60 days" },
                { label: "Daily Avg Needed", value: `${dailyAvgNeeded.toFixed(1)}h/day`, sub: "to stay on track" },
              ].map((c) => (
                <div key={c.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">{c.label}</div>
                  <div className="text-xl font-bold text-white">{c.value}</div>
                  <div className="text-xs text-gray-500">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Overall Progress</span>
                <span className="font-semibold text-white">{progressPct.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${progressPct >= 70 ? "bg-green-500" : progressPct >= 30 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: progressAnimated ? `${progressPct}%` : "0%" }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{totalHours.toFixed(1)}h logged of {settings.goalHours}h</div>
            </div>

            <div className={`rounded-xl p-4 border ${totalHours >= expectedHours ? "bg-green-900/30 border-green-700" : "bg-red-900/30 border-red-700"}`}>
              {totalHours >= expectedHours ? (
                <p className="text-green-300 text-sm font-semibold">✅ Great pace! You have {(totalHours - expectedHours).toFixed(1)}h buffer</p>
              ) : (
                <p className="text-red-300 text-sm font-semibold">⚠️ Catch up: log {(expectedHours - totalHours).toFixed(1)} more hours today</p>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-sm font-semibold text-gray-300 mb-3">Last 7 Days</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} labelStyle={{ color: "#d1d5db" }} itemStyle={{ color: "#d1d5db" }} />
                    <ReferenceLine y={settings.weekdayTarget} stroke="#6b7280" strokeDasharray="4 4" />
                    <ReferenceLine y={settings.weekendTarget} stroke="#6b7280" strokeDasharray="4 4" />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                      {weeklyChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.met ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-300">Session Log</span>
                <button onClick={() => openLogModal()} className="text-xs px-3 py-1 rounded-lg bg-green-700 hover:bg-green-600 text-white">+ Add</button>
              </div>
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No sessions logged yet. Start tracking! 🚀</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-900/60">
                      <tr>
                        {["Date", "Topic", "Duration", "Note", ""].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-gray-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...sessions].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
                        <tr key={s.id} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{s.date}</td>
                          <td className="px-3 py-2 text-gray-200 max-w-[120px] truncate">{s.topic}</td>
                          <td className="px-3 py-2 text-green-400 whitespace-nowrap">{formatDuration(s.duration_minutes)}</td>
                          <td className="px-3 py-2 text-gray-400 max-w-[100px] truncate">{s.note || "—"}</td>
                          <td className="px-3 py-2"><button onClick={() => deleteSession(s.id)} className="text-red-500 hover:text-red-400">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "weekly" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">🔥 {streak.currentStreak}</div>
                <div className="text-xs text-gray-400 mt-1">Current Streak (days)</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">🏆 {streak.longestStreak}</div>
                <div className="text-xs text-gray-400 mt-1">Longest Streak (days)</div>
              </div>
            </div>

            {(() => {
              const weekHours = weekDates.reduce((acc, d) => acc + sessions.filter((s) => s.date === d).reduce((a, s) => a + s.duration_minutes, 0) / 60, 0);
              const weekTarget = 19;
              const pct = Math.min(100, (weekHours / weekTarget) * 100);
              return (
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">This week</span>
                    <span className="font-semibold">{weekHours.toFixed(1)}h / {weekTarget}h</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((dateStr) => {
                const dayHours = sessions.filter((s) => s.date === dateStr).reduce((a, s) => a + s.duration_minutes, 0) / 60;
                const d = new Date(dateStr + "T12:00:00");
                const isToday = dateStr === toDateStr(new Date());
                const isPast = new Date(dateStr + "T23:59:59") < new Date() && !isToday;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const target = isWeekend ? settings.weekendTarget : settings.weekdayTarget;
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = d.getDate();
                const monthAbbr = d.toLocaleDateString("en-US", { month: "short" });
                let badge = ""; let borderCls = "border-gray-700";
                if (isToday) { badge = "🔵"; borderCls = "border-blue-500"; }
                else if (!isPast) { badge = "⬜"; }
                else if (dayHours >= target) { badge = "✅"; borderCls = "border-green-600"; }
                else if (dayHours > 0) { badge = "⚠️"; borderCls = "border-amber-600"; }
                else { badge = "❌"; borderCls = "border-red-700"; }
                const dayTopics = sessions.filter((s) => s.date === dateStr).map((s) => s.topic);
                return (
                  <div key={dateStr} className={`bg-gray-800 rounded-xl border p-1.5 flex flex-col items-center text-center ${borderCls}`}>
                    <div className="text-xs font-semibold text-gray-400">{dayName}</div>
                    <div className="text-[10px] text-gray-500">{dayNum} {monthAbbr}</div>
                    <div className="text-base font-bold text-white my-0.5">{dayHours.toFixed(1)}</div>
                    <div className="text-[10px] text-gray-500">{target}h</div>
                    <div className="text-sm mt-0.5">{badge}</div>
                    {dayTopics.slice(0, 1).map((t, i) => (
                      <div key={i} className="text-[8px] text-green-400 bg-green-900/30 rounded px-0.5 mt-0.5 truncate w-full">{t}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">8-Week Roadmap · Started {settings.startDate}</div>
            {WEEK_PLAN.map((w) => {
              const isCurrentWeek = w.week === weekCurrent;
              const isCompleted = completedWeeks.includes(w.week) || w.week < weekCurrent;
              const weekStart = new Date(startDate.getTime());
              weekStart.setDate(startDate.getDate() + (w.week - 1) * 7);
              const weekEnd = new Date(weekStart.getTime());
              weekEnd.setDate(weekStart.getDate() + 6);
              const dateRange = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
              const weekHours = sessions.filter((s) => {
                const d = new Date(s.date + "T12:00:00");
                return d >= weekStart && d <= weekEnd;
              }).reduce((a, s) => a + s.duration_minutes, 0) / 60;
              return (
                <div key={w.week} className={`rounded-xl border p-4 space-y-3 ${isCurrentWeek ? "border-green-500 bg-green-900/20" : isCompleted ? "border-gray-600 bg-gray-800/40" : "border-gray-700 bg-gray-800/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Week {w.week}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCurrentWeek ? "bg-green-600 text-white" : isCompleted ? "bg-gray-600 text-gray-300" : "bg-gray-700 text-gray-400"}`}>
                          {isCurrentWeek ? "Current" : isCompleted ? "Completed" : "Upcoming"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5">{w.title} · {dateRange}</div>
                    </div>
                    <button onClick={() => toggleWeekComplete(w.week)} className={`text-xs px-2 py-1 rounded-lg border transition-colors flex-shrink-0 ${completedWeeks.includes(w.week) ? "bg-green-700 border-green-600 text-white" : "border-gray-600 text-gray-400 hover:border-green-600"}`}>
                      {completedWeeks.includes(w.week) ? "✓ Done" : "Mark done"}
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {w.goals.map((g, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-gray-500 mt-0.5">•</span>{g}</li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Target: {w.hoursTarget}h</span>
                    {isCurrentWeek && <span className="text-green-400">{weekHours.toFixed(1)}h logged this week</span>}
                  </div>
                  {isCurrentWeek && (
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${Math.min(100, (weekHours / w.hoursTarget) * 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-gray-900 border-t border-gray-800 flex z-40">
        {([["today", "📅", "Today"], ["tracker", "📊", "Tracker"], ["weekly", "📆", "Weekly"], ["plan", "🗺️", "Plan"]] as const).map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${activeTab === tab ? "text-green-400" : "text-gray-500 hover:text-gray-300"}`}>
            <span className="text-xl mb-0.5">{icon}</span>{label}
          </button>
        ))}
      </nav>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowSettings(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl w-full max-w-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">⚙️ Settings</h2>
            <div className="space-y-3">
              {([
                { label: "Your Name", key: "name", type: "text" },
                { label: "Start Date", key: "startDate", type: "date" },
                { label: "Goal Hours (total)", key: "goalHours", type: "number" },
                { label: "Weekday Target (h)", key: "weekdayTarget", type: "number" },
                { label: "Weekend Target (h)", key: "weekendTarget", type: "number" },
              ] as { label: string; key: keyof Settings; type: string }[]).map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={String(settingsDraft[key])}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              ))}
              {([
                { label: "Show Cricket Block", key: "showCricket" },
                { label: "Enable Notifications", key: "enableNotifications" },
              ] as { label: string; key: keyof Settings }[]).map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{label}</span>
                  <button onClick={() => setSettingsDraft({ ...settingsDraft, [key]: !settingsDraft[key] })} className={`w-12 h-6 rounded-full transition-colors relative ${settingsDraft[key] ? "bg-green-600" : "bg-gray-700"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settingsDraft[key] ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { saveSettings(settingsDraft); setShowSettings(false); }} className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 rounded-xl font-semibold text-sm">Save</button>
              <button onClick={() => setShowSettings(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-sm">Cancel</button>
            </div>
            <div className="border-t border-gray-700 pt-3">
              {!resetConfirm ? (
                <button onClick={() => setResetConfirm(true)} className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-medium">🗑 Reset All Data</button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-400 text-center">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      localStorage.removeItem("atomcamp_sessions");
                      localStorage.removeItem("atomcamp_settings");
                      localStorage.removeItem("atomcamp_streak");
                      localStorage.removeItem("atomcamp_completed_weeks");
                      setSessions([]); setSettings(DEFAULT_SETTINGS); setStreak(DEFAULT_STREAK); setCompletedWeeks([]);
                      setShowSettings(false); setResetConfirm(false);
                    }} className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-semibold">Yes, Reset</button>
                    <button onClick={() => setResetConfirm(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowLogModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl w-full max-w-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">📝 Log Study Session</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Topic *</label>
                <input type="text" value={logTopic} onChange={(e) => setLogTopic(e.target.value)} placeholder="e.g. Python Basics, Linear Algebra…" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Duration (minutes) *</label>
                <input type="number" value={logDuration} onChange={(e) => setLogDuration(e.target.value)} placeholder="e.g. 90" min={1} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Note (optional)</label>
                <input type="text" value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="Any notes or reflections…" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogSubmit} className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 rounded-xl font-semibold text-sm">Save Session</button>
              <button onClick={() => { setShowLogModal(false); setLogTopic(""); setLogDuration(""); setLogNote(""); }} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
