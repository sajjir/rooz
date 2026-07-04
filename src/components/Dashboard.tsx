import React, { useState } from "react";
import { 
  Plus, Check, Trash2, Link2, AlertCircle, RefreshCw, 
  Star, History, Play, CheckCircle, Brain, Zap, Sparkles, 
  Sliders, Settings, LayoutGrid, ChevronRight, ChevronLeft, 
  Activity, Info, Bookmark, HelpCircle, CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project, Item, ItemType, Priority, EnergyLevel, TimelineEntry, AutomationLog, IntegrationConfig } from "../types";

interface DashboardProps {
  projects: Project[];
  items: Item[];
  timeline: TimelineEntry[];
  logs: AutomationLog[];
  integrations: IntegrationConfig[];
  onAddItem: (itemData: any) => Promise<void>;
  onUpdateItem: (id: string, updates: any) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onCreateProject: (projectData: any) => Promise<void>;
  onToggleIntegration: (id: string) => Promise<void>;
  onTriggerAutomation: () => Promise<void>;
}

export default function Dashboard({
  projects,
  items,
  timeline,
  logs,
  integrations,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onCreateProject,
  onToggleIntegration,
  onTriggerAutomation,
}: DashboardProps) {
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === "fa";

  // Sidebar visibility state
  const [showSecondaryPanel, setShowSecondaryPanel] = useState(false);

  // Quick Input states
  const [quickInput, setQuickInput] = useState("");
  const [captured, setCaptured] = useState(false);

  // Track expanded chronicles (task stories)
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});

  const toggleStory = (id: string) => {
    setExpandedStories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Predict classification based on user's live input
  const getLiveClassification = (input: string) => {
    const text = input.trim().toLowerCase();
    if (!text) return null;
    
    if (text.startsWith("idea:") || text.startsWith("idea ")) {
      return { type: "idea" as const, symbol: "○", label: isFa ? "ایده خام" : "Idea", color: "text-amber-500 bg-amber-50" };
    } else if (text.startsWith("http://") || text.startsWith("https://") || text.includes(".com") || text.includes(".ir") || text.includes(".net")) {
      return { type: "bookmark" as const, symbol: "□", label: isFa ? "نشانک" : "Bookmark", color: "text-emerald-500 bg-emerald-50" };
    } else if (text.startsWith("habit:") || text.startsWith("habit ")) {
      return { type: "habit" as const, symbol: "★", label: isFa ? "عادت" : "Habit", color: "text-purple-500 bg-purple-50" };
    } else if (text.startsWith("journal:") || text.startsWith("journal ")) {
      return { type: "knowledge" as const, symbol: "📖", label: isFa ? "یادداشت" : "Journal", color: "text-blue-500 bg-blue-50" };
    }
    return { type: "task" as const, symbol: "△", label: isFa ? "کار امروز" : "Task", color: "text-indigo-500 bg-indigo-50" };
  };

  const liveClass = getLiveClassification(quickInput);

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const title = quickInput.trim();
    const classification = getLiveClassification(title);
    
    let type = "task";
    let symbol = "△";
    let tags = ["captured"];

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
      .replace(/^journal\s+/i, "");

    await onAddItem({
      title: cleanTitle,
      content: isFa ? "ثبت شده از طریق ورودی سریع روز" : "Captured via Rooz Quick Capture.",
      type,
      symbol,
      tags,
    });

    setCaptured(true);
    setQuickInput("");
    setTimeout(() => {
      setCaptured(false);
    }, 2000);
  };

  // Find Focus Today item (high priority task)
  const focusItem = items.find(item => item.priority === "high" && item.status !== "completed" && item.status !== "abandoned");

  // In progress / active track items (other tasks, bookmarks, ideas)
  const activeTrackItems = items.filter(item => 
    item.status !== "completed" && 
    item.status !== "abandoned" && 
    item.id !== focusItem?.id
  );

  // Calculation metrics
  const completedCount = items.filter(item => item.status === "completed").length;
  const totalTasksCount = items.filter(item => item.type === "task").length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-6 relative" id="rooz-dashboard-root">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            {isFa ? "میز کار روزانه" : "Daily Operating Workspace"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isFa ? "تمرکز روی آنچه امروز اهمیت دارد." : "Focusing exclusively on what matters today."}
          </p>
        </div>

        {/* Toggle secondary panel */}
        <button
          onClick={() => setShowSecondaryPanel(!showSecondaryPanel)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            showSecondaryPanel 
              ? "bg-slate-900 text-white border-slate-900" 
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
          id="toggle-analytics-panel"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isFa ? "آمار و تنظیمات" : "Analytics & Settings"}</span>
          {showSecondaryPanel ? <ChevronRight className="w-3.5 h-3.5 ml-1" /> : <ChevronLeft className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* MAIN STAGE COLUMN */}
        <div className={`space-y-6 transition-all duration-300 ${showSecondaryPanel ? "xl:col-span-8" : "xl:col-span-12"}`}>
          
          {/* QUESTION 3: QUICK CAPTURE PANEL (○ / □) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="quick-capture-panel">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-500 font-bold">○ / □</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {isFa ? "سؤال ۳: چه ایده یا موضوعی در ذهنتان می‌گذرد؟" : "Question 3: Dump Your Mindsphere"}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {isFa ? "ثبت ایده، کار یا نشانک در لحظه" : "Quick Capture in <1 second"}
              </span>
            </div>

            <form onSubmit={handleQuickCapture} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder={
                    isFa 
                      ? "چیزی بنویسید... (پیشوند 'idea:' برای ایده‌ها، آدرس وب برای نشانک‌ها)" 
                      : "Type a thought... (prefix 'idea:' for ideas, URL for bookmarks)"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
                />
                
                {/* Captured notification */}
                {captured && (
                  <span className="absolute right-3 top-3.5 text-xs text-emerald-600 font-bold flex items-center gap-1 animate-bounce">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isFa ? "ثبت شد!" : "Captured!"}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl font-semibold text-xs flex items-center justify-center transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                {isFa ? "ثبت" : "Capture"}
              </button>
            </form>

            {/* Live classification feedback */}
            {liveClass && (
              <div className="mt-2.5 flex items-center gap-2 animate-fade-in">
                <span className="text-[10px] text-slate-400 font-mono">
                  {isFa ? "طبقه‌بندی هوشمند:" : "Live Classifier:"}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${liveClass.color}`}>
                  {liveClass.symbol} {liveClass.label}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* QUESTION 1: FOCUS TODAY (★) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[320px] relative" id="focus-today-panel">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold text-sm">★</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      {isFa ? "سؤال ۱: مهم‌ترین کار امروز چیست؟" : "Question 1: Today's Focus Horizon"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isFa ? "اولویت اول" : "Level 1 Priority"}
                  </span>
                </div>

                {focusItem ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-xs font-mono font-bold shrink-0">
                        ★
                      </span>
                      <h4 className="text-base font-bold text-slate-800 tracking-tight leading-snug">
                        {focusItem.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                      {focusItem.content || (isFa ? "توضیحاتی برای این کار ثبت نشده است." : "No additional description.")}
                    </p>

                    {focusItem.tags && focusItem.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {focusItem.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-mono text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/50">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <Star className="w-6 h-6 stroke-1" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-800">
                        {isFa ? "امروز اولویت ستاره‌داری ندارید" : "No Starred Focus For Today"}
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        {isFa ? "یک کار را از لیست «در دست اقدام» به عنوان تمرکز اصلی انتخاب کنید." : "Promote a task from the active track below to declare your primary mission."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Focus Actions */}
              {focusItem ? (
                <div className="border-t border-slate-50 pt-4 mt-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateItem(focusItem.id, { status: "postponed", postponedCount: (focusItem.postponedCount || 0) + 1 })}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-[11px] font-semibold font-mono transition-all"
                    >
                      ⏸ {isFa ? "تعویق کار" : "Defer Focus"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateItem(focusItem.id, { priority: "medium" })}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-[11px] font-semibold transition-all"
                    >
                      {isFa ? "کاهش اولویت" : "Demote"}
                    </button>
                    <button
                      onClick={() => onUpdateItem(focusItem.id, { status: "completed" })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl font-semibold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isFa ? "انجام شد" : "Done (□)"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-50 pt-4 mt-6">
                  {/* Star a task quick selection */}
                  {activeTrackItems.filter(i => i.type === "task").length > 0 ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        {isFa ? "انتخاب سریع اولویت ستاره‌دار:" : "Elevate to Primary Focus:"}
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onUpdateItem(e.target.value, { priority: "high" });
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] outline-none focus:border-indigo-500 transition-all"
                        defaultValue=""
                      >
                        <option value="">{isFa ? "-- انتخاب کار برای تمرکز امروز --" : "-- Select a task --"}</option>
                        {activeTrackItems.filter(i => i.type === "task").map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* QUESTION 2: IN PROGRESS / ACTIVE TRACK (△) */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[320px]" id="active-track-panel">
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-500 font-bold text-sm">△</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      {isFa ? "سؤال ۲: دیگر چه کارهایی در دست اقدام است؟" : "Question 2: Active Track Horizon"}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50/50 px-1.5 py-0.5 rounded-md font-bold">
                    {activeTrackItems.length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {activeTrackItems.length > 0 ? (
                    activeTrackItems.map((item) => {
                      const itemStory = timeline.filter(t => t.itemId === item.id);
                      return (
                        <div 
                          key={item.id} 
                          className="bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3 transition-all"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 text-[10px] font-mono shrink-0">
                                {item.type === "idea" ? "○" : "△"}
                              </span>
                              <h4 className="text-xs font-semibold text-slate-800 truncate">
                                {item.title}
                              </h4>
                              {item.type !== "task" && (
                                <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                                  {item.type}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {item.content}
                            </p>

                            {/* Task chronicle/story display if expanded */}
                            {expandedStories[item.id] && (
                              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 pl-1">
                                <span className="text-[9px] font-mono text-slate-400 block uppercase">
                                  {isFa ? "تاریخچه تغییرات کار:" : "Task Chronicle History:"}
                                </span>
                                {itemStory.length > 0 ? (
                                  itemStory.map((story) => (
                                    <div key={story.id} className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                      <span className="text-indigo-400">●</span>
                                      <span>{story.description}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic block">
                                    {isFa ? "تاریخچه‌ای ثبت نشده است." : "Chronicle initialized."}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick action triggers */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Chronicle toggle */}
                            <button
                              onClick={() => toggleStory(item.id)}
                              className={`p-1 rounded hover:bg-slate-200 transition-all ${expandedStories[item.id] ? "text-indigo-600 bg-indigo-50" : "text-slate-400"}`}
                              title={isFa ? "نمایش تاریخچه کار" : "View chronicle story"}
                            >
                              <History className="w-3 h-3" />
                            </button>

                            {/* Elevate to Focus */}
                            {item.type === "task" && (
                              <button
                                onClick={() => onUpdateItem(item.id, { priority: "high" })}
                                className="p-1 rounded text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-all"
                                title={isFa ? "ستاره‌دار کردن و افزودن به تمرکز" : "Promote to Focus"}
                              >
                                <Star className="w-3 h-3 stroke-1" />
                              </button>
                            )}

                            {/* Mark Completed */}
                            <button
                              onClick={() => onUpdateItem(item.id, { status: "completed" })}
                              className="p-1 rounded text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                              title={isFa ? "علامت‌گذاری به عنوان انجام شده" : "Complete item"}
                            >
                              <Check className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                              title={isFa ? "حذف" : "Delete"}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-8">
                      {isFa ? "موردی در دست اقدام نیست." : "Your track is empty."}
                    </p>
                  )}
                </div>
              </div>

              {/* Track Footer */}
              <div className="border-t border-slate-50 pt-3 mt-4 text-center">
                <span className="text-[10px] font-mono text-slate-400">
                  {isFa ? "○ ایده  |  △ وظیفه  |  □ انجام شده  |  ⏸ تعلیق" : "○ Idea  |  △ Task  |  □ Completed  |  ⏸ Defer"}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* SECONDARY PANEL (COLLAPSIBLE SIDEBAR: Stats, Settings, Integrations, Automation) */}
        {showSecondaryPanel && (
          <div className="xl:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-6 animate-fade-in" id="secondary-settings-panel">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                {isFa ? "آمار و تنظیمات کارگاه" : "Workspace Analytics & Console"}
              </h3>
              <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                v1.1
              </span>
            </div>

            {/* Performance Diagnostics */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                {isFa ? "۱. پایش کارایی" : "1. Performance Metrics"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {isFa ? "نرخ تکمیل" : "Completion Rate"}
                  </span>
                  <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
                    {completionRate}%
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {isFa ? "کارهای تمام شده" : "Completed Tasks"}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 font-mono mt-0.5 block">
                    {completedCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Automation Sandboxes */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                {isFa ? "۲. موتور خودکارسازی" : "2. Automation Engine"}
              </h4>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 space-y-3">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {isFa 
                    ? "تست اتصال وب هوک خودکار برای پایش وضعیت کدهای گیت هاب و جیرا" 
                    : "Simulate git webhooks, category classifier updates, and chronical automation syncs."
                  }
                </p>
                <button
                  onClick={onTriggerAutomation}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {isFa ? "اجرای خودکارسازی آزمایشی" : "Trigger Sandbox webhook"}
                </button>
              </div>
            </div>

            {/* Connectors & Integrations */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                {isFa ? "۳. یکپارچه‌سازی وب" : "3. Global Connectors"}
              </h4>
              <div className="space-y-2">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-800 uppercase font-mono">
                        {integration.name}
                      </h5>
                      <span className="text-[9px] text-slate-400 block">
                        {integration.type}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleIntegration(integration.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                        integration.connected 
                          ? "bg-indigo-600 text-white shadow-xs" 
                          : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                      }`}
                    >
                      {integration.connected ? "ACTIVE" : "OFF"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chronicle / Audit Logs */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                {isFa ? "۴. لاگ‌های سیستمی" : "4. Chrono System Logs"}
              </h4>
              <div className="bg-slate-900 text-slate-300 p-3 rounded-xl border border-slate-800 font-mono text-[9px] space-y-1.5 max-h-[140px] overflow-y-auto">
                <span className="text-zinc-500 block border-b border-zinc-800 pb-1">
                  -- ROOZ SYSTEM ENGINE OK --
                </span>
                {logs.length > 0 ? (
                  logs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-start gap-1">
                      <span className="text-emerald-500 shrink-0">&gt;</span>
                      <span className="leading-normal">{log.message}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-500 italic">No logs generated.</span>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
