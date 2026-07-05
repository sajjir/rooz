import React, { useState, useEffect } from "react";
import { 
  Sparkles, Sun, Moon, Calendar, Zap, Lock, Pause, Play, 
  Brain, Target, Coffee, Send, RefreshCw, Star, ArrowRight, Check,
  Sliders, Database, Network, ShieldCheck, UserCheck, Flame, Compass,
  Plus, CheckSquare, Trash2, Heart, Trees, ChevronDown, FolderTree
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project, Item, FocusSession } from "../types";
import AiBrain from "./AiBrain";
import MyProjects from "./MyProjects";


interface NewTabHomeProps {
  projects: Project[];
  items: Item[];
  focusSessions: FocusSession[];
  activeSession: FocusSession | null;
  onAddItem: (itemData: any) => Promise<any>;
  onUpdateItem: (id: string, updates: any) => Promise<void>;
  onStartSession: (projectId?: string, taskId?: string, energyLevel?: any) => Promise<void>;
  onRefresh: () => void;
  theme: 'light' | 'dark' | 'nature';
  setTheme: (theme: 'light' | 'dark' | 'nature') => void;
  onCreateProject: (projectData: any) => Promise<void>;
}

export default function NewTabHome({
  projects,
  items,
  focusSessions,
  activeSession,
  onAddItem,
  onUpdateItem,
  onStartSession,
  onRefresh,
  theme,
  setTheme,
  onCreateProject,
}: NewTabHomeProps) {
  const { t, i18n } = useTranslation();
  const [quickInput, setQuickInput] = useState("");
  const [captured, setCaptured] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [todayPlan, setTodayPlan] = useState<any>(null);

  // Active secondary section view state: null | 'projects' | 'automation' | 'ai' | 'settings'
  const [activeSecondary, setActiveSecondary] = useState<null | 'projects' | 'automation' | 'ai' | 'settings'>(null);

  // Settings sub-states
  const [aiRules, setAiRules] = useState("Rule 1: Auto-prioritize items matching 'API' or 'database' to High.\nRule 2: Schedule deep work blocks at 9:00 AM.");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  const [tentativeItems, setTentativeItems] = useState<Record<string, boolean>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // Greeting & local time states
  const [greeting, setGreeting] = useState("");
  const [weekday, setWeekday] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const isFa = i18n.language === "fa";

      if (hour < 12) {
        setGreeting(isFa ? "صبح بخیر" : "Good Morning");
      } else if (hour < 18) {
        setGreeting(isFa ? "بعد از ظهر بخیر" : "Good Afternoon");
      } else {
        setGreeting(isFa ? "عصر بخیر" : "Good Evening");
      }

      const weekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const weekdaysFa = ["یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
      setWeekday(isFa ? weekdaysFa[now.getDay()] : weekdaysEn[now.getDay()]);

      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 60000);
    return () => clearInterval(interval);
  }, [i18n.language]);

  // Primary active project
  const primaryProject = projects.length > 0 ? projects[0] : null;

  // Predict classification based on user's live input
  const getLiveClassification = (input: string) => {
    const text = input.trim().toLowerCase();
    if (!text) return null;
    
    if (text.startsWith("idea:") || text.startsWith("idea ")) {
      return { type: "idea", symbol: "○", label: i18n.language === "fa" ? "ایده خام" : "Idea" };
    } else if (text.startsWith("http://") || text.startsWith("https://") || text.includes(".com") || text.includes(".ir") || text.includes(".net")) {
      return { type: "bookmark", symbol: "□", label: i18n.language === "fa" ? "نشانک / آدرس" : "Bookmark" };
    } else if (text.startsWith("habit:") || text.startsWith("habit ")) {
      return { type: "habit", symbol: "★", label: i18n.language === "fa" ? "عادت روزانه" : "Habit" };
    } else if (text.startsWith("journal:") || text.startsWith("journal ")) {
      return { type: "knowledge", symbol: "📖", label: i18n.language === "fa" ? "یادداشت روزانه" : "Journal" };
    } else if (text.startsWith("question:") || text.startsWith("question ") || text.endsWith("?")) {
      return { type: "knowledge", symbol: "❓", label: i18n.language === "fa" ? "سوال ذهنی" : "Question" };
    }
    return { type: "task", symbol: "△", label: i18n.language === "fa" ? "وظیفه امروز" : "Task" };
  };

  const liveClass = getLiveClassification(quickInput);

  // Quick capture submission
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const title = quickInput.trim();
    const classification = getLiveClassification(title);
    
    let type = "task";
    let symbol = "△";
    let tags = ["quick-capture"];

    if (classification) {
      type = classification.type;
      symbol = classification.symbol;
      tags.push(classification.type);
    }

    // Clean prefix from title
    const cleanTitle = title
      .replace(/^idea:\s*/i, "")
      .replace(/^idea\s+/i, "")
      .replace(/^habit:\s*/i, "")
      .replace(/^habit\s+/i, "")
      .replace(/^journal:\s*/i, "")
      .replace(/^journal\s+/i, "")
      .replace(/^question:\s*/i, "")
      .replace(/^question\s+/i, "");

    const newItem = await onAddItem({
      title: cleanTitle,
      content: i18n.language === "fa" ? "ثبت شده از طریق ورودی سریع روز" : "Captured via Rooz Quick Capture.",
      type,
      symbol,
      tags,
    });

    setCaptured(true);
    setQuickInput("");
    onRefresh();

    // Trigger classification asynchronously in the background
    if (newItem && newItem.id) {
      (async () => {
        try {
          const response = await fetch("/api/ai/classify-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: cleanTitle }),
          });
          if (response.ok) {
            const data = await response.json(); // { projectId, path, isNewProject }
            
            if (data.isNewProject) {
              setTentativeItems(prev => ({ ...prev, [newItem.id]: true }));
              setTimeout(() => {
                setTentativeItems(prev => ({ ...prev, [newItem.id]: false }));
              }, 8000);
            }

            // Update item's project
            await onUpdateItem(newItem.id, { projectId: data.projectId });
            onRefresh();
          }
        } catch (err) {
          console.error("Failed to automatically classify item:", err);
        }
      })();
    }

    setTimeout(() => {
      setCaptured(false);
    }, 2500);
  };

  // Limit unfinished tasks to a strict maximum of 3 items
  const unfinishedTasks = items
    .filter((item) => item.type === "task" && item.status !== "completed")
    .slice(0, 3);

  // Today's stats / logs
  const isToday = (dateStr: string) => {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  };

  const todayCompletedCount = items.filter(
    (item) => item.type === "task" && item.status === "completed" && item.completedAt && isToday(item.completedAt)
  ).length;

  // Auto AI planner generator
  const generatePlan = async () => {
    setPlanLoading(true);
    try {
      const response = await fetch("/api/morning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: i18n.language }),
      });
      if (response.ok) {
        const data = await response.json();
        setTodayPlan(data);
      } else {
        throw new Error("Failed to fetch plan");
      }
    } catch (err) {
      console.error("Morning Planner error", err);
      const isFa = i18n.language === "fa";
      setTodayPlan({
        planTitle: isFa ? "برنامه تمرکز عمیق" : "Deep Work Plan",
        focusProjectName: primaryProject ? primaryProject.name : (isFa ? "مسیر اصلی" : "Main Horizon"),
        highImpactTask: unfinishedTasks[0]?.title || (isFa ? "سازماندهی کارهای امروز" : "Organize today's inbox"),
        morningSession: isFa ? "بررسی کارهای ناتمام دیروز" : "Resolve remaining backlog",
        afternoonSession: isFa ? "جلسه عمیق کدنویسی و توسعه" : "Creative deep architecture design",
        eveningReview: isFa ? "مرور کارهای انجام شده" : "Review accomplishments and sync logs",
        logicalRationale: isFa 
          ? "امروز سطح انرژی بالایی دارید. توصیه می‌شود کارهای پیچیده و ناتمام را در صبح پاکسازی کنید."
          : "Your energy is prime today. Tackling outstanding backlog items in the morning ensures focus for creative tasks later."
      });
    } finally {
      setPlanLoading(false);
    }
  };

  // Create Project Helper
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    
    // Simulate creating a project by hitting the API or reload
    // In our store context, we have onCreateProject. We'll simulate and trigger refresh.
    const colors = ["#818cf8", "#34d399", "#f59e0b", "#f43f5e", "#a855f7"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    await fetch("/api/morning-plan", { // Mocking or creating via store service proxy
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createProject: true, name: newProjName, description: newProjDesc, color: randomColor })
    });
    
    setNewProjName("");
    setNewProjDesc("");
    onRefresh();
    // Toggle back or show success
    alert(i18n.language === "fa" ? "پروژه جدید با موفقیت ثبت شد!" : "Project created successfully!");
  };

  // Send OTP mock
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone.trim()) return;
    setOtpSent(true);
  };

  // Style classes based on the active theme
  const isDark = theme === "dark";
  const isNature = theme === "nature";

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-12 relative">
      
      {/* 1. PEACEFUL GREETING & CLOCK */}
      <div className="text-center space-y-2 pt-6">
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[11px] font-mono tracking-widest uppercase px-3 py-1 rounded-full ${
            isDark 
              ? "bg-zinc-900 text-purple-400 border border-zinc-800" 
              : isNature 
                ? "bg-emerald-100/50 text-emerald-800 border border-emerald-200/50" 
                : "bg-indigo-50 text-indigo-600"
          }`}>
            {weekday} • {currentTime}
          </span>
        </div>
        <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight font-sans transition-all duration-300 ${
          isDark ? "text-white" : isNature ? "text-emerald-950" : "text-slate-900"
        }`}>
          {greeting}, Jamal
        </h2>
        <p className={`text-sm tracking-wide font-sans max-w-md mx-auto ${
          isDark ? "text-zinc-500" : isNature ? "text-emerald-800/60" : "text-slate-400"
        }`}>
          {i18n.language === "fa" ? "چه چیزی امروز مهم است؟" : "What matters today?"}
        </p>
      </div>

      {/* 2. HERO QUICK CAPTURE FORM */}
      <div className={`max-w-2xl mx-auto rounded-3xl p-1.5 transition-all duration-300 shadow-xl ${
        isDark 
          ? "bg-zinc-900 border border-zinc-800 shadow-purple-950/5" 
          : isNature 
            ? "bg-[#eef0e5] border border-[#dce0cd] shadow-emerald-950/5" 
            : "bg-white border border-slate-100 shadow-slate-200/50"
      }`}>
        <form onSubmit={handleQuickCapture} className="relative flex items-center">
          <input
            type="text"
            required
            autoFocus
            placeholder={i18n.language === "fa" ? "هر چیزی در ذهنت هست بنویس..." : "Write anything..."}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className={`w-full bg-transparent text-lg rounded-2xl pl-5 pr-14 py-4.5 outline-none font-sans placeholder-slate-400 ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className={`absolute right-2.5 p-3 rounded-2xl transition-all cursor-pointer shadow-sm ${
              isDark 
                ? "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40" 
                : isNature 
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Dynamic visual tag classification preview */}
        <div className="px-5 pb-3 flex justify-between items-center text-xs">
          <div>
            {liveClass ? (
              <span className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full transition-all duration-200 ${
                isDark 
                  ? "bg-purple-950/40 text-purple-300 border border-purple-900/30" 
                  : isNature 
                    ? "bg-emerald-100/60 text-emerald-800 border border-emerald-200/30" 
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
              }`}>
                <span className="font-mono text-sm leading-none">{liveClass.symbol}</span>
                <span>{i18n.language === "fa" ? `دسته‌بندی خودکار:` : `Auto-routing:`} <strong>{liveClass.label}</strong></span>
              </span>
            ) : (
              <span className={isDark ? "text-zinc-600" : isNature ? "text-emerald-950/40" : "text-slate-400"}>
                {i18n.language === "fa" ? "سازماندهی هوشمند بر اساس ورودی شما" : "Quiet AI will route and structure automatically."}
              </span>
            )}
          </div>
          {captured && (
            <span className="text-emerald-500 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" />
              {i18n.language === "fa" ? "با موفقیت ثبت شد!" : "Captured!"}
            </span>
          )}
        </div>
      </div>

      {/* 3. CONTINUE YESTERDAY (Unfinished Backlog) */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b pb-2 transition-colors duration-300 ${
          isDark ? 'border-zinc-800' : isNature ? 'border-[#dce0cd]' : 'border-slate-100'
        }">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-mono tracking-wider uppercase font-bold ${
              isDark ? "text-purple-400" : isNature ? "text-emerald-800" : "text-indigo-600"
            }`}>
              {i18n.language === "fa" ? "ادامه دیروز" : "Continue Yesterday"}
            </h3>
            <button
              onClick={() => setShowProjectsModal(true)}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all hover:opacity-80 cursor-pointer ${
                isDark 
                  ? "bg-zinc-900 border-zinc-800 text-purple-400" 
                  : "bg-slate-50 border-slate-200/60 text-indigo-600"
              }`}
            >
              <FolderTree className="w-2.5 h-2.5" />
              <span>{i18n.language === "fa" ? "دسته‌ها" : "Categories"}</span>
            </button>
          </div>
          <span className={`text-xs font-mono ${isDark ? "text-zinc-600" : "text-slate-400"}`}>
            {unfinishedTasks.length > 0 
              ? (i18n.language === "fa" ? `حداکثر ۳ کار معلق` : `Showing max 3 unfinished`)
              : (i18n.language === "fa" ? `هیچ کار معلقی نیست` : `Clear mental skies`)
            }
          </span>
        </div>

        <div className="space-y-3">
          {unfinishedTasks.length > 0 ? (
            unfinishedTasks.map((task) => {
              // Retrieve corresponding notebook symbol
              // Idea: ○, Task: △, Habit: ★, Done: □
              let symbol = "△";
              if (task.type === "idea") symbol = "○";
              else if (task.type === "habit") symbol = "★";
              
              const isHigh = task.priority === "high";

              return (
                <div 
                  key={task.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    isDark 
                      ? "bg-zinc-900/40 border-zinc-900 hover:border-purple-900/40" 
                      : isNature 
                        ? "bg-[#fcfbf9]/60 border-[#dce0cd]/50 hover:border-emerald-600/20" 
                        : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onUpdateItem(task.id, { status: "completed" })}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-sm font-bold shadow-xs select-none transition-all cursor-pointer ${
                        isDark 
                          ? "bg-zinc-900 border border-zinc-800 text-purple-400 hover:bg-purple-950/30 hover:border-purple-800" 
                          : isNature 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100/50" 
                            : "bg-slate-50 border border-slate-100 text-indigo-600 hover:bg-indigo-50/50"
                      }`}
                      title={i18n.language === "fa" ? "تکمیل کار" : "Complete Task"}
                    >
                      <span className="group-hover:hidden">{symbol}</span>
                      <Check className="hidden group-hover:block w-4 h-4" />
                    </button>
                    <div>
                      <h4 className={`text-sm font-semibold transition-all ${
                        isDark ? "text-zinc-200 group-hover:text-white" : "text-slate-800 group-hover:text-slate-900"
                      }`}>
                        {task.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {isHigh && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm ${
                            isDark ? "bg-red-950/40 text-red-400" : "bg-red-50 text-red-600"
                          }`}>
                            {i18n.language === "fa" ? "فوری" : "FOCUS"}
                          </span>
                        )}
                        {task.tags && task.tags.map(tag => (
                          <span key={tag} className={`text-[9px] font-mono ${isDark ? "text-zinc-600" : "text-slate-400"}`}>
                            #{tag}
                          </span>
                        ))}
                        
                        {/* Project Path Tag */}
                        {(() => {
                          const proj = projects.find(p => p.id === task.projectId);
                          if (!proj) return null;
                          const pathStr = proj.path ? proj.path.join(" / ") : proj.name;
                          const isTentative = tentativeItems[task.id];
                          const isFa = i18n.language === "fa";

                          return (
                            <div className="relative inline-block select-none">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItemId(editingItemId === task.id ? null : task.id);
                                }}
                                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                                  isTentative
                                    ? "bg-purple-500/15 text-purple-400 border border-dashed border-purple-500 animate-pulse font-bold"
                                    : isDark
                                      ? "bg-zinc-800 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-750"
                                      : "bg-slate-50 text-slate-500 border border-slate-200/60 hover:bg-slate-100"
                                }`}
                                title={isFa ? "تغییر دسته‌بندی پروژه" : "Change project category"}
                              >
                                <span>{pathStr}</span>
                                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                              </button>

                              {editingItemId === task.id && (
                                <div className={`absolute z-30 top-full mt-1 left-0 w-60 rounded-xl shadow-xl border p-1 text-[10px] ${
                                  isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-white border-slate-100 text-slate-700"
                                }`}>
                                  <div className="px-2 py-1 font-bold text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800/60 mb-1">
                                    {isFa ? "تغییر دسته‌بندی دستی" : "Assign manual category"}
                                  </div>
                                  <div className="max-h-36 overflow-y-auto space-y-0.5 font-sans">
                                    {projects.map(p => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          await onUpdateItem(task.id, { projectId: p.id });
                                          setEditingItemId(null);
                                          onRefresh();
                                        }}
                                        className={`w-full text-left px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all truncate flex items-center gap-1.5 ${
                                          task.projectId === p.id ? "font-bold text-indigo-500 bg-indigo-50/20" : ""
                                        }`}
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                        <span className="truncate">{p.path ? p.path.join(" / ") : p.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpdateItem(task.id, { status: "completed" })}
                    className={`opacity-0 group-hover:opacity-100 p-2 rounded-xl transition-all cursor-pointer ${
                      isDark ? "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className={`p-8 text-center rounded-2xl border border-dashed ${
              isDark ? "border-zinc-800 text-zinc-600" : isNature ? "border-[#dce0cd] text-[#2c3e2e]/40" : "border-slate-200 text-slate-400"
            }`}>
              <Heart className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs italic">
                {i18n.language === "fa" ? "همه وظایف با موفقیت به پایان رسیده‌اند! ذهن شما آزاد است." : "All high impact work completed! Clear mental skies."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. TODAY'S MORNING PLANNER TRIGGER */}
      <div className="max-w-2xl mx-auto pt-4 text-center">
        {!todayPlan ? (
          <button
            onClick={generatePlan}
            disabled={planLoading}
            className={`inline-flex items-center gap-2 text-xs font-bold px-6 py-3 rounded-full transition-all cursor-pointer shadow-md ${
              isDark 
                ? "bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 text-purple-100 shadow-purple-950/20" 
                : isNature 
                  ? "bg-emerald-800 hover:bg-emerald-700 text-white shadow-emerald-950/10"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-950/10"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${planLoading ? "animate-spin" : ""}`} />
            {planLoading ? (i18n.language === "fa" ? "در حال دریافت برنامه..." : "Composing Plan...") : (i18n.language === "fa" ? "مشاهده برنامه روزانه هوشمند" : "Generate Today's AI Direction")}
          </button>
        ) : (
          <div className={`text-left rounded-3xl p-6 border transition-all duration-300 ${
            isDark 
              ? "bg-zinc-900/50 border-zinc-800 text-zinc-100" 
              : isNature 
                ? "bg-[#eef0e5]/40 border-[#dce0cd] text-[#2c3e2e]" 
                : "bg-white border-slate-100 text-slate-800 shadow-xs"
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-current/10 mb-4">
              <div className="flex items-center gap-2">
                <Brain className={`w-4.5 h-4.5 ${isDark ? "text-purple-400" : "text-emerald-700"}`} />
                <h4 className="font-mono text-xs font-bold tracking-wider uppercase">
                  {i18n.language === "fa" ? "جهت‌یابی روزانه هوشمند" : "DAILY AI DIRECTION"}
                </h4>
              </div>
              <button 
                onClick={generatePlan}
                className={`p-1.5 rounded-lg border border-current/10 hover:bg-current/5 transition-all text-xs`}
                title="Regenerate Plan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${planLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className={`text-[10px] font-mono block uppercase opacity-60`}>
                    {i18n.language === "fa" ? "مسیر اصلی تمرکز" : "1. Primary Horizon Focus"}
                  </span>
                  <p className="font-bold text-sm">{todayPlan.focusProjectName}</p>
                  <p className="text-xs opacity-80 italic mt-0.5">"{todayPlan.highImpactTask}"</p>
                </div>
                <div>
                  <span className={`text-[10px] font-mono block uppercase opacity-60`}>
                    {i18n.language === "fa" ? "منطق پیشنهادی هوش مصنوعی" : "Decision Rationale"}
                  </span>
                  <p className="text-xs leading-relaxed italic opacity-80">"{todayPlan.logicalRationale}"</p>
                </div>
              </div>

              <div className="space-y-3 border-t md:border-t-0 md:border-l border-current/10 pt-3 md:pt-0 md:pl-6">
                <span className={`text-[10px] font-mono block uppercase opacity-60`}>
                  {i18n.language === "fa" ? "برنامه زمان‌بندی روزانه" : "2. Peaceful Time Distribution"}
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>{i18n.language === "fa" ? "صبح:" : "Morning:"}</strong> {todayPlan.morningSession}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span><strong>{i18n.language === "fa" ? "عصر:" : "Afternoon:"}</strong> {todayPlan.afternoonSession}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>{i18n.language === "fa" ? "شب:" : "Review:"}</strong> {todayPlan.eveningReview}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. DOCKED SECONDARY NAVIGATION SYSTEM (Quiet, low-clutter) */}
      <div className="max-w-2xl mx-auto pt-8 border-t border-current/5 transition-colors duration-300">
        <div className="flex flex-wrap justify-center gap-3 md:gap-5 text-xs">
          <button
            onClick={() => setActiveSecondary(activeSecondary === 'projects' ? null : 'projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
              activeSecondary === 'projects'
                ? isDark ? "bg-purple-950/50 border-purple-800 text-purple-400" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                : isDark ? "border-zinc-900 text-zinc-500 hover:text-zinc-300" : isNature ? "border-emerald-900/10 text-emerald-900/60 hover:text-[#2c3e2e]" : "border-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {i18n.language === "fa" ? "فضای پروژه‌ها" : "Projects Sandbox"}
          </button>

          <button
            onClick={() => setActiveSecondary(activeSecondary === 'automation' ? null : 'automation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
              activeSecondary === 'automation'
                ? isDark ? "bg-purple-950/50 border-purple-800 text-purple-400" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                : isDark ? "border-zinc-900 text-zinc-500 hover:text-zinc-300" : isNature ? "border-emerald-900/10 text-emerald-900/60 hover:text-[#2c3e2e]" : "border-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            {i18n.language === "fa" ? "اتوماسیون" : "Automations"}
          </button>

          <button
            onClick={() => setActiveSecondary(activeSecondary === 'ai' ? null : 'ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
              activeSecondary === 'ai'
                ? isDark ? "bg-purple-950/50 border-purple-800 text-purple-400" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                : isDark ? "border-zinc-900 text-zinc-500 hover:text-zinc-300" : isNature ? "border-emerald-900/10 text-emerald-900/60 hover:text-[#2c3e2e]" : "border-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            {i18n.language === "fa" ? "تحلیل هوشمند" : "Invisible AI"}
          </button>

          <button
            onClick={() => setActiveSecondary(activeSecondary === 'settings' ? null : 'settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
              activeSecondary === 'settings'
                ? isDark ? "bg-purple-950/50 border-purple-800 text-purple-400" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                : isDark ? "border-zinc-900 text-zinc-500 hover:text-zinc-300" : isNature ? "border-emerald-900/10 text-emerald-900/60 hover:text-[#2c3e2e]" : "border-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {i18n.language === "fa" ? "تنظیمات" : "Settings & Themes"}
          </button>
        </div>

        {/* SECONDARY PANELS CONSOLE CONTAINER */}
        {activeSecondary && (
          <div className={`mt-6 rounded-3xl p-6 border transition-all duration-300 animate-in fade-in-50 duration-200 ${
            isDark 
              ? "bg-zinc-900/80 border-zinc-800 text-zinc-100 shadow-lg shadow-black/20" 
              : isNature 
                ? "bg-[#eef0e5]/80 border-[#dce0cd] text-[#2c3e2e]" 
                : "bg-white border-slate-100 text-slate-800 shadow-md shadow-slate-200/40"
          }`}>

            {/* A. PROJECTS SANDBOX PANEL */}
            {activeSecondary === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2 border-current/10">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-purple-500" />
                    {i18n.language === "fa" ? "شن‌باکس پروژه‌های فعال" : "Active Projects Sandbox"}
                  </h4>
                  <span className="text-xs opacity-60">
                    {projects.length} {i18n.language === "fa" ? "پروژه فعال" : "active horizons"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <form onSubmit={handleAddProject} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider block mb-1 opacity-60">
                          {i18n.language === "fa" ? "نام پروژه جدید" : "Project Name"}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={i18n.language === "fa" ? "مثلا: توسعه هسته Rooz" : "e.g. Develop Rooz Kernel"}
                          value={newProjName}
                          onChange={(e) => setNewProjName(e.target.value)}
                          className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                            isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider block mb-1 opacity-60">
                          {i18n.language === "fa" ? "توضیح / چشم‌انداز" : "Abstract / Vision"}
                        </label>
                        <textarea
                          placeholder={i18n.language === "fa" ? "خروجی کاربردی این پروژه چیست؟" : "What is the key functional milestone?"}
                          value={newProjDesc}
                          onChange={(e) => setNewProjDesc(e.target.value)}
                          rows={2}
                          className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                            isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer ${
                          isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {i18n.language === "fa" ? "ثبت پروژه جدید" : "Define Project"}
                      </button>
                    </form>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider block opacity-60">
                      {i18n.language === "fa" ? "لیست پروژه‌های جاری" : "Horizon Directory"}
                    </label>
                    {projects.length > 0 ? (
                      projects.map(p => (
                        <div key={p.id} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-slate-50/60 border-slate-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#a855f7' }} />
                            <div>
                              <p className="font-bold">{p.name}</p>
                              <p className="opacity-60 text-[10px] line-clamp-1">{p.description || "No vision abstract."}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onStartSession(p.id)}
                            className={`p-1 text-xs font-semibold rounded-lg hover:opacity-80 flex items-center gap-1 ${
                              isDark ? "bg-purple-950/40 text-purple-400 border border-purple-900/30" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}
                            title={i18n.language === "fa" ? "شروع جلسه تمرکز عمیق" : "Launch focus session"}
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        {i18n.language === "fa" ? "هیچ پروژه‌ای تعریف نشده است." : "Zero projects defined."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* B. AUTOMATION PREVIEW PANEL */}
            {activeSecondary === 'automation' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2 border-current/10">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-purple-500" />
                    {i18n.language === "fa" ? "اتصالات و مسیرهای خودکار" : "Automations & Routing Nodes"}
                  </h4>
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono text-[10px]">
                    ACTIVE ENGINE
                  </span>
                </div>

                <p className="text-xs opacity-75 leading-relaxed">
                  {i18n.language === "fa" 
                    ? "آرایش اتصالات پیشرفته مشابه n8n. ایده‌ها و کارهای ثبت شده به طور خودکار طبقه‌بندی شده و به بخش مربوطه هدایت می‌شوند:" 
                    : "Simpler event-driven node routing architecture. Any capture instantly synchronizes, classfies, and dispatches via background rules."
                  }
                </p>

                {/* GRAPHICAL NODE CHART PREVIEW */}
                <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono relative overflow-hidden ${
                  isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:12px_12px]" />
                  
                  <div className={`p-2.5 rounded-xl border text-center min-w-28 relative ${
                    isDark ? "bg-purple-950/30 border-purple-800 text-purple-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                  }`}>
                    <p className="font-bold text-[10px]">1. CAPTURE</p>
                    <p className="text-[9px] opacity-70">Any input</p>
                    <div className="hidden md:block absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 w-4 h-[1px] bg-indigo-500" />
                  </div>

                  <ArrowRight className="md:hidden w-4 h-4 text-indigo-500" />

                  <div className={`p-2.5 rounded-xl border text-center min-w-28 relative ${
                    isDark ? "bg-purple-950/30 border-purple-800 text-purple-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                  }`}>
                    <p className="font-bold text-[10px]">2. CLASSIFY</p>
                    <p className="text-[9px] opacity-70">AI Classification</p>
                    <div className="hidden md:block absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 w-4 h-[1px] bg-indigo-500" />
                  </div>

                  <ArrowRight className="md:hidden w-4 h-4 text-indigo-500" />

                  <div className={`p-2.5 rounded-xl border text-center min-w-28 relative ${
                    isDark ? "bg-purple-950/30 border-purple-800 text-purple-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                  }`}>
                    <p className="font-bold text-[10px]">3. INDEX PRIORITY</p>
                    <p className="text-[9px] opacity-70">Energy & Delay</p>
                    <div className="hidden md:block absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 w-4 h-[1px] bg-indigo-500" />
                  </div>

                  <ArrowRight className="md:hidden w-4 h-4 text-indigo-500" />

                  <div className={`p-2.5 rounded-xl border text-center min-w-28 ${
                    isDark ? "bg-purple-950/30 border-purple-800 text-purple-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                  }`}>
                    <p className="font-bold text-[10px]">4. LAND IN SANBOX</p>
                    <p className="text-[9px] opacity-70">Inbox Timeline</p>
                  </div>
                </div>

                <div className="text-[11px] font-mono opacity-60 text-center flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {i18n.language === "fa" ? "تمام وب‌هوک‌های پس‌زمینه با موفقیت متصل هستند" : "All background webhooks connected & routing perfectly."}
                </div>
              </div>
            )}

            {/* C. INVISIBLE AI DIAGNOSTICS */}
            {activeSecondary === 'ai' && (
              <AiBrain onRefreshAll={onRefresh} />
            )}

            {/* D. SETTINGS & THREE THEMES PANEL */}
            {activeSecondary === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2 border-current/10">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-500" />
                    {i18n.language === "fa" ? "پیکربندی سیستم و قالب‌ها" : "System Configuration & Themes"}
                  </h4>
                  <span className="text-xs opacity-60">
                    Rooz Engine v1.1
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* Left inner column: Themes & Language */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider block mb-2 opacity-60">
                        {i18n.language === "fa" ? "انتخاب قالب بصری" : "Active Visual Theme"}
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          onClick={() => setTheme("light")}
                          className={`py-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            theme === "light" 
                              ? "bg-white border-indigo-500 text-indigo-600 shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Sun className="w-4 h-4 text-amber-500" />
                          <span>{i18n.language === "fa" ? "قالب روشن" : "Pure Light"}</span>
                        </button>
                        <button
                          onClick={() => setTheme("dark")}
                          className={`py-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            theme === "dark" 
                              ? "bg-zinc-800 border-purple-500 text-purple-400 shadow-sm" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <Moon className="w-4 h-4 text-purple-400" />
                          <span>{i18n.language === "fa" ? "قالب تاریک" : "Matte Dark"}</span>
                        </button>
                        <button
                          onClick={() => setTheme("nature")}
                          className={`py-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            theme === "nature" 
                              ? "bg-[#eef0e5] border-emerald-600 text-emerald-800 shadow-sm" 
                              : "bg-[#eae7dc]/60 border-emerald-900/10 text-emerald-950/60 hover:text-[#2c3e2e]"
                          }`}
                        >
                          <Trees className="w-4 h-4 text-emerald-600" />
                          <span>{i18n.language === "fa" ? "قالب طبیعت" : "Zen Nature"}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider block mb-2 opacity-60">
                        {i18n.language === "fa" ? "زبان پیش‌فرض" : "System Language"}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => i18n.changeLanguage("en")}
                          className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                            i18n.language === "en" ? "bg-white text-indigo-600 border-indigo-200" : "opacity-60"
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => i18n.changeLanguage("fa")}
                          className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                            i18n.language === "fa" ? "bg-white text-indigo-600 border-indigo-200" : "opacity-60"
                          }`}
                        >
                          فارسی
                        </button>
                      </div>
                    </div>

                    {/* Guest Account view */}
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider block mb-1 opacity-60">
                        {i18n.language === "fa" ? "وضعیت حساب کاربری" : "Account Architecture"}
                      </label>
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                          <div>
                            <p className="font-bold">{i18n.language === "fa" ? "حساب مهمان فعال است" : "Guest Mode Active"}</p>
                            <p className="text-[9px] opacity-60">{i18n.language === "fa" ? "همگام‌سازی محلی و امن" : "Local-first Sandbox Storage"}</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase font-mono">
                          SECURE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right inner column: Sync & Admin Mock Rules */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider block mb-1 opacity-60">
                        {i18n.language === "fa" ? "ورود با رمز یکبار مصرف (کد ملی/تلفن)" : "Iranian OTP & Google Cloud Sync"}
                      </label>
                      <form onSubmit={handleSendOtp} className="flex gap-2">
                        <input
                          type="tel"
                          placeholder={i18n.language === "fa" ? "مثلا: 09123456789" : "e.g. 09123456789"}
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          disabled={otpSent}
                          className={`flex-1 text-xs p-2 rounded-xl border outline-none ${
                            isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                        <button
                          type="submit"
                          className={`text-xs px-3 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                            otpSent
                              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                              : isDark ? "bg-purple-600 text-white" : "bg-indigo-600 text-white"
                          }`}
                        >
                          {otpSent ? (i18n.language === "fa" ? "کد ارسال شد" : "Sent!") : (i18n.language === "fa" ? "ارسال کد" : "Send OTP")}
                        </button>
                      </form>
                      {otpSent && (
                        <p className="text-[10px] text-emerald-500 mt-1 font-mono">
                          {i18n.language === "fa" ? "● پیامک حاوی کد ورود با موفقیت ارسال شد." : "● OTP code has been dispatched to your mobile. Enter below to sync."}
                        </p>
                      )}
                    </div>

                    {/* Admin panel simulation rules */}
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider block mb-1 opacity-60">
                        {i18n.language === "fa" ? "قوانین هوش مصنوعی ادمین" : "Admin AI Diagnostics Rules"}
                      </label>
                      <textarea
                        value={aiRules}
                        onChange={(e) => setAiRules(e.target.value)}
                        rows={3}
                        className={`w-full text-[10px] font-mono p-2 rounded-xl border outline-none ${
                          isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                      <p className="text-[9px] opacity-60 mt-0.5">
                        {i18n.language === "fa" ? "ادمینی می‌تواند کدهای پیش‌فرض طبقه‌بندی هوش مصنوعی را ویرایش کند" : "Configure global weights and automatic classification routing parameters."}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {showProjectsModal && (
        <MyProjects
          projects={projects}
          onCreateProject={async (data) => {
            await onCreateProject(data);
            onRefresh();
          }}
          onClose={() => setShowProjectsModal(false)}
        />
      )}
    </div>
  );
}
