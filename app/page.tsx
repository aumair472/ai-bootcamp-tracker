"use client";

import { useState, useEffect } from "react";

// 30-Day AI Bootcamp Syllabus - Each topic = 2 hours
const syllabus = [
  { day: 1, category: "Python & Stats", topics: ["Python Basics", "Python Session 02", "Stats, Pandas & Matplotlib"] },
  { day: 2, category: "Python & Stats", topics: ["Stats Assignment", "EDA Session 01", "EDA Session 02"] },
  { day: 3, category: "EDA & Math", topics: ["EDA Session 03", "EDA Case Study", "Linear Algebra with Numpy"] },
  { day: 4, category: "Machine Learning", topics: ["Machine Learning 01", "Machine Learning 02", "Machine Learning 03"] },
  { day: 5, category: "Machine Learning", topics: ["Machine Learning 04", "Machine Learning 05", "ML Case Study"] },
  { day: 6, category: "Machine Learning", topics: ["ML Assignment 01", "ML Portfolio Project Part 1"] },
  { day: 7, category: "Machine Learning", topics: ["ML Portfolio Project Part 2", "Project Review"] },
  { day: 8, category: "Deep Learning", topics: ["Deep Learning 01", "Deep Learning 02", "Deep Learning 03"] },
  { day: 9, category: "Deep Learning", topics: ["Deep Learning 04", "DL Master Session (Sagar)", "DL Project Part 1"] },
  { day: 10, category: "Deep Learning", topics: ["DL Project Part 2", "Project Review"] },
  { day: 11, category: "Computer Vision", topics: ["Computer Vision 01", "Computer Vision 02", "Computer Vision 03"] },
  { day: 12, category: "Computer Vision", topics: ["CV Master Session", "CV Project Part 1", "CV Project Part 2"] },
  { day: 13, category: "NLP", topics: ["NLP 01", "NLP 02", "NLP 03"] },
  { day: 14, category: "NLP", topics: ["NLP Project Part 1", "NLP Project Part 2"] },
  { day: 15, category: "Agentic AI", topics: ["Agentic AI 01", "Agentic AI 02", "Agentic AI 03"] },
  { day: 16, category: "Agentic AI", topics: ["Agentic Guest Session", "Agentic Project Part 1", "Agentic Project Part 2"] },
  { day: 17, category: "MLOps", topics: ["MLOps 01", "MLOps 02", "MLOps 03"] },
  { day: 18, category: "MLOps", topics: ["MLOps 04", "MLOps 05", "MLOps 06"] },
  { day: 19, category: "MLOps & Data Eng", topics: ["MLOps Q&A", "Data Engineering 01", "Data Engineering 02"] },
  { day: 20, category: "Data Eng", topics: ["Data Engineering 03", "Data Eng Practice"] },
  { day: 21, category: "Automation", topics: ["Make.com 1", "Make.com 2", "n8n Session 1"] },
  { day: 22, category: "Automation", topics: ["n8n Session 2", "n8n Session 3", "n8n Session 4"] },
  { day: 23, category: "Career Dev", topics: ["LinkedIn Profile", "Resume Building", "Data Storytelling"] },
  { day: 24, category: "Career Dev", topics: ["Freelancing 01", "Freelancing 02", "Freelancing 03"] },
  { day: 25, category: "Final Project", topics: ["Project Proposal", "Environment Setup", "Data Gathering"] },
  { day: 26, category: "Final Project", topics: ["Data Preprocessing", "Initial EDA", "Baseline Model"] },
  { day: 27, category: "Final Project", topics: ["Model Training", "Hyperparameter Tuning"] },
  { day: 28, category: "Final Project", topics: ["Model Evaluation", "Deployment Setup"] },
  { day: 29, category: "Final Project", topics: ["API Integration", "UI/App Testing"] },
  { day: 30, category: "Final Project", topics: ["Documentation", "Portfolio Write-up", "Final Submission"] }
];

const HOURS_PER_TOPIC = 2;
const OPTIONAL_TASK_HOURS = 1;
const START_DATE = "March 4, 2026";

export default function Home() {
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [notificationShown, setNotificationShown] = useState(false);

  // Calculate total sessions across all days (excluding optional tasks)
  const totalSessions = syllabus.reduce((sum, day) => sum + day.topics.length, 0);
  const completedMainSessions = completedSessions.filter(id => !id.endsWith('-optional'));
  const completedSessionCount = completedMainSessions.length;
  const progressPercentage = Math.round((completedSessionCount / totalSessions) * 100);
  
  // Calculate optional task progress
  const completedOptionalCount = completedSessions.filter(id => id.endsWith('-optional')).length;
  
  // Calculate total hours
  const totalHours = totalSessions * HOURS_PER_TOPIC;
  const completedHours = completedSessionCount * HOURS_PER_TOPIC;
  const remainingHours = totalHours - completedHours;
  
  // Calculate completed days (for stats)
  const completedDaysCount = syllabus.filter(day => 
    day.topics.every((_, idx) => completedSessions.includes(`${day.day}-${idx}`))
  ).length;

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bootcampSessionProgress");
    if (saved) setCompletedSessions(JSON.parse(saved));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("bootcampSessionProgress", JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Daily notification on app open
  useEffect(() => {
    if (!notificationShown && "Notification" in window && Notification.permission === "granted") {
      // Find first incomplete session
      const incompleteDays = syllabus.filter(day => 
        day.topics.some((_, idx) => !completedSessions.includes(`${day.day}-${idx}`))
      );
      
      if (incompleteDays.length > 0) {
        const todayDay = incompleteDays[0];
        const remainingSessions = todayDay.topics.filter((_, idx) => 
          !completedSessions.includes(`${todayDay.day}-${idx}`)
        ).length;
        const hours = remainingSessions * HOURS_PER_TOPIC;
        new Notification("AI Bootcamp Reminder", {
          body: `You need to put in ${hours} hours today! Let's go! 🚀`,
          icon: "/icon.png"
        });
      }
      setNotificationShown(true);
    }
  }, [completedSessions, notificationShown]);

  // Request Notification Permission
  const enableNotifications = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Notifications Enabled!", {
            body: "You'll now receive daily reminders. Time to crush this bootcamp! 💪"
          });
        }
      });
    }
  };

  const toggleSession = (sessionId: string) => {
    setCompletedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              30-Day AI Bootcamp Sprint
            </h1>
            <p className="text-gray-400">Master AI/ML in 30 days. Every topic = 2 hours. Stay consistent.</p>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500">
              <span className="text-sm font-semibold text-white">🚀 Sprint Starts:</span>
              <span className="text-sm font-bold text-white">{START_DATE}</span>
            </div>
          </div>
          <button 
            onClick={enableNotifications}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/50"
          >
            🔔 Enable Reminders
          </button>
        </header>

        {/* Stats Dashboard */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Progress */}
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-400 mb-1">{progressPercentage}%</div>
              <div className="text-sm text-gray-400">Progress</div>
            </div>
            
            {/* Days Completed */}
            <div className="text-center border-l border-r border-gray-700">
              <div className="text-5xl font-bold text-green-400 mb-1">{completedDaysCount}/{syllabus.length}</div>
              <div className="text-sm text-gray-400">Days Completed</div>
            </div>
            
            {/* Hours Remaining */}
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-400 mb-1">{remainingHours}</div>
              <div className="text-sm text-gray-400">Hours Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-400">OVERALL PROGRESS</span>
              <span className="text-xs text-gray-500">{completedSessionCount}/{totalSessions} sessions • {completedHours}h / {totalHours}h</span>
            </div>
            <div className="w-full bg-gray-950 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            {completedOptionalCount > 0 && (
              <div className="mt-2 text-xs text-amber-400 flex items-center gap-2">
                <span>⭐ Bonus:</span>
                <span className="font-semibold">{completedOptionalCount}/30 optional sessions completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Battle Plan */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500 rounded-2xl p-6 mb-8 shadow-2xl shadow-purple-500/20">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              ⚡ Daily Battle Plan
            </h2>
            <p className="text-gray-400 text-sm">Your exact hour-by-hour schedule to crush this bootcamp</p>
          </div>
          
          <div className="space-y-3">
            {/* Sleep */}
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/30">
                🌙
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-blue-400 font-semibold">02:30 AM - 09:00 AM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">6.5 hrs</span>
                </div>
                <h3 className="text-gray-200 font-medium mt-1">Sleep & Recover</h3>
              </div>
            </div>

            {/* Study Block 1 */}
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-2xl border border-green-500/30">
                🧠
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-green-400 font-semibold">09:30 AM - 11:00 AM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">1.5 hrs</span>
                </div>
                <h3 className="text-gray-200 font-medium mt-1">Study Block 1</h3>
                <p className="text-xs text-gray-500 mt-1">Peak focus - tackle hardest concepts</p>
              </div>
            </div>

            {/* Real Estate Shift */}
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-2xl border border-amber-500/30">
                🏢
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-amber-400 font-semibold">11:00 AM - 02:00 PM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">3 hrs</span>
                </div>
                <h3 className="text-gray-200 font-medium mt-1">Real Estate Shift</h3>
              </div>
            </div>

            {/* Study Block 2 */}
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl border border-emerald-500/30">
                💻
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-emerald-400 font-semibold">03:00 PM - 05:30 PM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">2.5 hrs</span>
                </div>
                <h3 className="text-gray-200 font-medium mt-1">Study Block 2</h3>
                <p className="text-xs text-gray-500 mt-1">Deep work session - your longest block</p>
              </div>
            </div>

            {/* Study Block 3 */}
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl border border-cyan-500/30">
                📊
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-cyan-400 font-semibold">07:30 PM - 09:30 PM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">2 hrs</span>
                </div>
                <h3 className="text-gray-200 font-medium mt-1">Study Block 3</h3>
                <p className="text-xs text-gray-500 mt-1">Evening review & practice projects</p>
              </div>
            </div>

            {/* Marketing Agency Shift */}
            <div className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl border border-purple-500/30">
                🚀
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-purple-400 font-semibold">10:00 PM - 02:00 AM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">4 hrs</span>
                </div>
                <h3 className="text-gray-200 font-medium mt-1">Marketing Agency Shift</h3>
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Study Time</span>
              <span className="font-bold text-purple-400">6 hours/day</span>
            </div>
          </div>
        </div>

        {/* Daily View */}
        <div className="space-y-3">
          {syllabus.map((item) => {
            const dayHours = item.topics.length * HOURS_PER_TOPIC;
            const allSessionsComplete = item.topics.every((_, idx) => 
              completedSessions.includes(`${item.day}-${idx}`)
            );

            return (
              <div
                key={item.day}
                className="group relative rounded-xl border transition-all duration-300 overflow-hidden bg-gray-900 border-gray-700 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <div className="p-5">
                  {/* Day Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="font-mono text-sm font-bold text-indigo-400">
                      Day {item.day.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 font-medium">
                      {item.category}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-orange-500/20 text-orange-400">
                      ⏱️ {dayHours} Hours
                    </span>
                    {allSessionsComplete && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-500/20 text-green-400 flex items-center gap-1">
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  {/* Session List */}
                  <div className="space-y-2">
                    {item.topics.map((topic, idx) => {
                      const sessionId = `${item.day}-${idx}`;
                      const isCompleted = completedSessions.includes(sessionId);

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                            isCompleted 
                              ? "bg-gray-800/50" 
                              : "bg-gray-800/30 hover:bg-gray-800/60"
                          }`}
                        >
                          {/* Session Checkbox */}
                          <button
                            onClick={() => toggleSession(sessionId)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                              ${isCompleted 
                                ? "bg-green-600 border-green-600" 
                                : "border-gray-600 hover:border-green-500 hover:bg-gray-700"
                              }
                            `}
                          >
                            {isCompleted && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* Session Content */}
                          <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                            <span className={`text-sm transition-all duration-200 ${
                              isCompleted 
                                ? "line-through text-gray-500 opacity-50" 
                                : "text-gray-200"
                            }`}>
                              {topic}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              isCompleted 
                                ? "bg-gray-700 text-gray-600" 
                                : "bg-orange-500/20 text-orange-400"
                            }`}>
                              ⏱️ 2 hrs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Optional Daily Task */}
                    {(() => {
                      const optionalId = `${item.day}-optional`;
                      const isOptionalCompleted = completedSessions.includes(optionalId);
                      
                      return (
                        <div
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                            isOptionalCompleted 
                              ? "bg-amber-900/20 border-amber-800/50" 
                              : "bg-amber-900/10 border-amber-700/30 hover:bg-amber-900/20 hover:border-amber-600/50"
                          }`}
                        >
                          {/* Optional Checkbox */}
                          <button
                            onClick={() => toggleSession(optionalId)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                              ${isOptionalCompleted 
                                ? "bg-amber-600 border-amber-600" 
                                : "border-amber-600/50 hover:border-amber-500 hover:bg-amber-900/30"
                              }
                            `}
                          >
                            {isOptionalCompleted && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          {/* Optional Content */}
                          <div className="flex-1 flex items-center justify-between gap-3 min-w-0 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm transition-all duration-200 ${
                                isOptionalCompleted 
                                  ? "line-through text-gray-500 opacity-50" 
                                  : "text-amber-200"
                              }`}>
                                Krish Naik ML Hindi Challenge
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                                Optional
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              isOptionalCompleted 
                                ? "bg-amber-900/40 text-gray-600" 
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              ⏱️ 1 hr
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Completed overlay effect */}
                {allSessionsComplete && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Built with Next.js, React, and Tailwind CSS</p>
          <p className="mt-1">Track your progress. Stay consistent. Achieve mastery.</p>
        </div>

      </div>
    </div>
  );
}