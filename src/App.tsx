import React, { useState, useEffect } from "react";
import { 
  Brain, Clock, Bell, User, CheckSquare, Layers, Sparkles, 
  Settings, CheckCircle, Flame, ExternalLink, Moon, Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";
import FocusMode from "./components/FocusMode";
import Dashboard from "./components/Dashboard";
import NewTabHome from "./components/NewTabHome";
import { Project, Item, FocusSession, TimelineEntry, AutomationLog, IntegrationConfig, NotificationEntry } from "./types";
import { useStore } from "../packages/shared/services/StoreService";

export default function App() {
  const { t, i18n } = useTranslation();
  // Navigation tabs: 'newtab' | 'focus' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'newtab' | 'focus' | 'dashboard'>('newtab');
  const [theme, setTheme] = useState<'light' | 'dark' | 'nature'>(() => {
    return (localStorage.getItem("rooz_theme") as 'light' | 'dark' | 'nature') || "light";
  });

  useEffect(() => {
    localStorage.setItem("rooz_theme", theme);
  }, [theme]);

  const getThemeClass = () => {
    switch (theme) {
      case "dark":
        return "bg-zinc-950 text-zinc-300 dark";
      case "nature":
        return "bg-[#faf9f5] text-[#2c3e2e] nature";
      case "light":
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const getHeaderClass = () => {
    switch (theme) {
      case "dark":
        return "bg-zinc-900/90 border-b border-zinc-800/80 text-zinc-100 backdrop-blur-md";
      case "nature":
        return "bg-[#f4f3ef]/90 border-b border-[#e1e3d7] text-[#2c3e2e] backdrop-blur-md";
      case "light":
      default:
        return "bg-white/90 border-b border-slate-100 text-slate-700 backdrop-blur-md";
    }
  };

  const getNavClass = () => {
    switch (theme) {
      case "dark":
        return "bg-zinc-900/80 border border-zinc-800/80";
      case "nature":
        return "bg-[#eae7dc]/60 border border-[#e1e3d7]";
      case "light":
      default:
        return "bg-slate-100/70 border border-slate-100";
    }
  };

  const {
    loading,
    user: userGoal,
    projects,
    items,
    focusSessions,
    timeline,
    automationLogs,
    notifications,
    integrations,
    activeSession,
    init,
    addItem,
    updateItem,
    deleteItem,
    createProject,
    startFocusSession,
    endFocusSession,
    triggerAutomation,
    toggleIntegration,
    clearNotifications,
  } = useStore();

  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);

  // Sync data on mount and listen to Chrome extension storage updates
  useEffect(() => {
    init();

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      const handleStorageChange = (changes: any, areaName: string) => {
        if (areaName === "local" && changes.dbState) {
          init();
        }
      };
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, [init]);

  // Listen to custom navigation events from the extension popup
  useEffect(() => {
    const handleNavMessage = (message: any) => {
      if (message.type === "NAVIGATE_TAB" && message.tab) {
        setActiveTab(message.tab);
      }
    };
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleNavMessage);
      return () => {
        chrome.runtime.onMessage.removeListener(handleNavMessage);
      };
    }
  }, []);

  const handleAddItem = async (itemData: any) => {
    await addItem(itemData);
  };

  const handleUpdateItem = async (id: string, updates: any) => {
    await updateItem(id, updates);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
  };

  const handleCreateProject = async (projectData: any) => {
    await createProject(projectData);
  };

  const handleToggleIntegration = async (id: string) => {
    await toggleIntegration(id);
  };

  const handleTriggerAutomation = async () => {
    await triggerAutomation();
  };

  const handleStartSession = async (projectId?: string, taskId?: string, energyLevel?: any) => {
    await startFocusSession(projectId, taskId, energyLevel);
  };

  const handleEndSession = async (score: number, notes: string, energy: any) => {
    await endFocusSession(score, notes, energy);
  };

  const handleClearNotifications = async () => {
    await clearNotifications();
  };

  // Calculate daily streak or total focus minutes today
  const totalFocusMinutesToday = focusSessions
    ? focusSessions
        .filter(s => s.completed && new Date(s.startTime).toDateString() === new Date().toDateString())
        .reduce((sum, s) => sum + s.duration, 0)
    : 0;

  const goalProgressRatio = Math.min(100, Math.round((totalFocusMinutesToday / (userGoal?.dailyGoalMinutes || 90)) * 100));
  const unreadNotifications = notifications ? notifications.filter(n => !n.read) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Brain className="w-10 h-10 text-indigo-600 animate-spin" />
        <span className="font-mono text-xs text-slate-500 tracking-wider">{t("app.loading")}</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-500 ${getThemeClass()}`}>
      
      {/* GLOBAL TOP NAVIGATION */}
      <header className={`px-6 py-4 sticky top-0 z-40 transition-colors duration-500 ${getHeaderClass()}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl text-white shadow-md transition-all ${
              theme === 'dark' 
                ? "bg-purple-600 shadow-purple-900/20" 
                : theme === 'nature'
                  ? "bg-emerald-700 shadow-emerald-900/10"
                  : "bg-indigo-600 shadow-indigo-600/10"
            }`}>
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-bold text-sm tracking-tight font-sans leading-none">
                {t("app.title")}
              </h1>
              <span className={`text-[10px] font-mono tracking-wider uppercase leading-none block mt-1 ${theme === 'dark' ? 'text-zinc-500' : theme === 'nature' ? 'text-emerald-700/60' : 'text-slate-400'}`}>
                {t("app.subtitle")}
              </span>
            </div>
          </div>

          {/* Central Navigation Switchers */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl transition-all ${getNavClass()}`}>
            <button
              onClick={() => setActiveTab('newtab')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'newtab'
                  ? theme === 'dark'
                    ? "bg-zinc-800 text-purple-400 shadow-sm"
                    : theme === 'nature'
                      ? "bg-[#faf9f5] text-emerald-800 shadow-xs"
                      : "bg-white text-indigo-600 shadow-sm"
                  : theme === 'dark'
                    ? "text-zinc-500 hover:text-zinc-300"
                    : theme === 'nature'
                      ? "text-emerald-950/60 hover:text-[#2c3e2e]"
                      : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Brain className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : theme === 'nature' ? 'text-emerald-700' : 'text-indigo-500'}`} />
              {i18n.language === "fa" ? "امروز" : "Today"}
            </button>
            <button
              onClick={() => setActiveTab('focus')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'focus'
                  ? theme === 'dark'
                    ? "bg-zinc-800 text-purple-400 shadow-sm"
                    : theme === 'nature'
                      ? "bg-[#faf9f5] text-emerald-800 shadow-xs"
                      : "bg-white text-indigo-600 shadow-sm"
                  : theme === 'dark'
                    ? "text-zinc-500 hover:text-zinc-300"
                    : theme === 'nature'
                      ? "text-emerald-950/60 hover:text-[#2c3e2e]"
                      : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock className="w-4 h-4" />
              {t("app.tab_focus")}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? theme === 'dark'
                    ? "bg-zinc-800 text-purple-400 shadow-sm"
                    : theme === 'nature'
                      ? "bg-[#faf9f5] text-emerald-800 shadow-xs"
                      : "bg-white text-indigo-600 shadow-sm"
                  : theme === 'dark'
                    ? "text-zinc-500 hover:text-zinc-300"
                    : theme === 'nature'
                      ? "text-emerald-950/60 hover:text-[#2c3e2e]"
                      : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              {t("app.tab_dashboard")}
            </button>
          </nav>

          {/* User Details & Action Triggers */}
          <div className="flex items-center gap-4">
            
            {/* Goal Tracker pill */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-full py-1 pl-3 pr-4 text-xs font-medium">
              <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
              <div className="font-sans text-slate-600">
                <span className="font-semibold text-slate-900 font-mono">{t("app.focus_goal_progress", { count: totalFocusMinutesToday })}</span>
                <span className="text-slate-400"> {t("app.focus_goal_total", { count: userGoal.dailyGoalMinutes })}</span>
              </div>
              <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden shrink-0">
                <div className="bg-orange-500 h-full" style={{ width: `${goalProgressRatio}%` }} />
              </div>
            </div>

            {/* Language switcher button */}
            <div className="flex items-center gap-1 border border-slate-100 rounded-xl p-1 bg-slate-50 shrink-0">
              <button
                onClick={() => i18n.changeLanguage("en")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  i18n.language === "en" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => i18n.changeLanguage("fa")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  i18n.language === "fa" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                فا
              </button>
            </div>

            {/* Notifications panel toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 transition-all relative"
                title="Workspace Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 p-4 shadow-xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs font-semibold text-slate-800">{t("app.alerts_title")}</span>
                    {unreadNotifications.length > 0 && (
                      <button 
                        onClick={handleClearNotifications}
                        className="text-[10px] text-indigo-600 hover:underline font-mono"
                      >
                        {t("app.clear_all")}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="text-xs space-y-0.5 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                          <h5 className="font-semibold text-slate-800">{notif.title}</h5>
                          <p className="text-slate-500 leading-relaxed">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">{t("app.no_alerts")}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs">
              <span className="p-1 rounded-full bg-slate-200">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </span>
              <span className="font-semibold text-slate-800 hidden sm:inline">{userGoal.name}</span>
            </div>
          </div>

        </div>
      </header>

      {/* MOBILE TAB DRAWER (Sticky Bottom for micro screens) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl p-2 flex justify-between shadow-xl z-40">
        <button
          onClick={() => setActiveTab('newtab')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 ${
            activeTab === 'newtab' ? "text-indigo-600 bg-indigo-50/50 font-bold" : "text-slate-500"
          }`}
        >
          <Brain className="w-4 h-4" />
          {i18n.language === "fa" ? "جدید" : "New Tab"}
        </button>
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 ${
            activeTab === 'focus' ? "text-indigo-600 bg-indigo-50/50 font-bold" : "text-slate-500"
          }`}
        >
          <Clock className="w-4 h-4" />
          {t("app.tab_focus").split(" ")[0]}
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 ${
            activeTab === 'dashboard' ? "text-indigo-600 bg-indigo-50/50 font-bold" : "text-slate-500"
          }`}
        >
          <Layers className="w-4 h-4" />
          {t("app.tab_dashboard").split(" ")[0]}
        </button>
      </div>

      {/* CORE VIEW STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'newtab' && (
          <NewTabHome
            projects={projects}
            items={items}
            focusSessions={focusSessions}
            activeSession={activeSession}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onStartSession={handleStartSession}
            onRefresh={init}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {activeTab === 'focus' && (
          <FocusMode
            projects={projects}
            tasks={items.filter(i => i.type === 'task')}
            activeSession={activeSession}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onRefresh={init}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            projects={projects}
            items={items}
            timeline={timeline}
            logs={automationLogs}
            integrations={integrations}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onCreateProject={handleCreateProject}
            onToggleIntegration={handleToggleIntegration}
            onTriggerAutomation={handleTriggerAutomation}
          />
        )}
      </main>
    </div>
  );
}
