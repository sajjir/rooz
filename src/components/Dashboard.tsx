import React, { useState } from "react";
import { 
  Folder, Calendar, BookOpen, Activity, Globe, Zap, Clock, 
  Plus, Check, Trash2, Link2, PlusCircle, AlertCircle, RefreshCw,
  FolderPlus, Bell, ArrowRight, Star, History
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
  // Tabs for main content view: 'workspace' | 'projects' | 'automation' | 'integrations'
  const [subTab, setSubTab] = useState<'workspace' | 'projects' | 'automation' | 'integrations'>('workspace');
  
  // Track expanded task story elements
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});

  const toggleStory = (id: string) => {
    setExpandedStories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStoryPathSymbols = (item: Item, itemStory: any[]) => {
    const symbols = [];
    symbols.push({ symbol: "○", label: "Idea", color: "text-slate-400 bg-slate-50 border border-slate-100" });
    if (item.actualDuration > 0 || itemStory.some(s => s.description.toLowerCase().includes("focus") || s.description.toLowerCase().includes("attempt") || s.description.toLowerCase().includes("start"))) {
      symbols.push({ symbol: "△", label: "Attempt", color: "text-blue-500 bg-blue-50 border border-blue-100" });
    }
    if (item.postponedCount > 0) {
      symbols.push({ symbol: "⏸", label: "Pause", color: "text-amber-500 bg-amber-50 border border-amber-100" });
    }
    if (item.priority === "high") {
      symbols.push({ symbol: "⭐", label: "Priority", color: "text-yellow-600 bg-yellow-50 border border-yellow-100" });
    }
    if (item.status === "completed") {
      symbols.push({ symbol: "□", label: "Done", color: "text-emerald-500 bg-emerald-50 border border-emerald-100" });
    }
    return symbols;
  };
  
  // Workspace filter for items: 'all' | 'task' | 'idea' | 'bookmark' | 'habit' | 'knowledge'
  const [itemFilter, setItemFilter] = useState<'all' | ItemType>('all');

  // New Item Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<ItemType>("task");
  const [newProjectId, setNewProjectId] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newEnergy, setNewEnergy] = useState<EnergyLevel>("medium");
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newTags, setNewTags] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // New Project Form State
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projColor, setProjColor] = useState("#6366f1");
  const [showProjForm, setShowProjForm] = useState(false);
  const [addingProj, setAddingProj] = useState(false);

  const [triggeringAuto, setTriggeringAuto] = useState(false);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesFilter = itemFilter === 'all' || item.type === itemFilter;
    return matchesFilter && item.status !== 'completed' && item.status !== 'abandoned';
  });

  const completedItems = items.filter(item => item.status === 'completed');

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddingItem(true);
    try {
      await onAddItem({
        title: newTitle,
        content: newContent,
        type: newType,
        projectId: newProjectId || projects[0]?.id || "",
        priority: newPriority,
        energy: newEnergy,
        estimatedDuration: Number(newDuration),
        tags: newTags ? newTags.split(",").map(t => t.trim()) : [],
      });
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setShowItemForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingItem(false);
    }
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    setAddingProj(true);
    try {
      await onCreateProject({
        name: projName,
        description: projDesc,
        color: projColor,
        symbol: "Folder",
      });
      setProjName("");
      setProjDesc("");
      setShowProjForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingProj(false);
    }
  };

  const handleTriggerWebhook = async () => {
    setTriggeringAuto(true);
    try {
      await onTriggerAutomation();
    } catch (err) {
      console.error(err);
    } finally {
      setTriggeringAuto(false);
    }
  };

  const getItemTypeIcon = (type: ItemType) => {
    switch (type) {
      case "task": return <Zap className="w-4 h-4 text-indigo-500" />;
      case "idea": return <Star className="w-4 h-4 text-amber-500 fill-amber-100" />;
      case "bookmark": return <Link2 className="w-4 h-4 text-emerald-500" />;
      case "habit": return <Activity className="w-4 h-4 text-rose-500" />;
      case "knowledge": return <BookOpen className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Sub-Tabs Header */}
      <div className="flex border-b border-slate-100 pb-px gap-6 overflow-x-auto">
        {(["workspace", "projects", "automation", "integrations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`pb-3 text-sm font-semibold capitalize border-b-2 px-1 transition-all whitespace-nowrap ${
              subTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t(`dashboard.tab_${tab}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* MAIN COLUMN (Workspace Management) */}
        <div className="xl:col-span-8 space-y-6">
          
          {subTab === "workspace" && (
            <div className="space-y-6">
              {/* Filter controls and add item button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
                  {(["all", "task", "idea", "bookmark", "habit", "knowledge"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setItemFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                        itemFilter === filter
                          ? "bg-white text-slate-800 shadow-sm font-semibold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {t(`dashboard.filter_${filter}`)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowItemForm(!showItemForm)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  {t("dashboard.capture_item")}
                </button>
              </div>

              {/* New Item Form */}
              {showItemForm && (
                <form onSubmit={handleAddItemSubmit} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_title")}</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={t("dashboard.placeholder_title")}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_type")}</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as ItemType)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="task">{t("dashboard.type_task")}</option>
                        <option value="idea">{t("dashboard.type_idea")}</option>
                        <option value="bookmark">{t("dashboard.type_bookmark")}</option>
                        <option value="habit">{t("dashboard.type_habit")}</option>
                        <option value="knowledge">{t("dashboard.type_knowledge")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_desc")}</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder={t("dashboard.placeholder_desc")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 h-16 resize-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_proj")}</label>
                      <select
                        value={newProjectId}
                        onChange={(e) => setNewProjectId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="">{t("dashboard.general_scope")}</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_priority")}</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as Priority)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="low">{t("dashboard.priority_low")}</option>
                        <option value="medium">{t("dashboard.priority_medium")}</option>
                        <option value="high">{t("dashboard.priority_high")}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_energy")}</label>
                      <select
                        value={newEnergy}
                        onChange={(e) => setNewEnergy(e.target.value as EnergyLevel)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="low">{t("dashboard.energy_low")}</option>
                        <option value="medium">{t("dashboard.energy_medium")}</option>
                        <option value="high">{t("dashboard.energy_high")}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_duration")}</label>
                      <input
                        type="number"
                        min="0"
                        value={newDuration}
                        onChange={(e) => setNewDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.item_form_tags")}</label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder={t("dashboard.placeholder_tags")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      className="px-3.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-semibold"
                    >
                      {t("dashboard.btn_cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={addingItem}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      {addingItem ? t("dashboard.btn_saving") : t("dashboard.btn_save")}
                    </button>
                  </div>
                </form>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const linkedProj = projects.find(p => p.id === item.projectId);
                    const itemStory = timeline.filter(t => t.itemId === item.id);
                    return (
                      <div 
                        key={item.id} 
                        className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                              {getItemTypeIcon(item.type)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                                
                                {/* Metadata tags */}
                                {linkedProj && (
                                  <span 
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-md text-white font-medium uppercase tracking-wider"
                                    style={{ backgroundColor: linkedProj.color }}
                                  >
                                    {linkedProj.name.substring(0, 10)}
                                  </span>
                                )}
                                {item.priority && (
                                  <span className={`text-[9px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded-md border ${
                                    item.priority === 'high' 
                                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                      : item.priority === 'medium'
                                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                                      : 'bg-slate-50 text-slate-500 border-slate-100'
                                  }`}>
                                    {t(`dashboard.priority_${item.priority}`)}
                                  </span>
                                )}
                                {item.postponedCount > 0 && (
                                  <span className="text-[9px] font-mono text-amber-600 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {t("dashboard.postponed_count", { count: item.postponedCount })}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 max-w-xl">{item.content}</p>
                              
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap pt-1">
                                  {item.tags.map((tag, idx) => (
                                    <span key={idx} className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                            {item.type === "task" && (
                              <div className="flex items-center gap-2 mr-2">
                                {item.estimatedDuration > 0 && (
                                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {item.actualDuration ? `${item.actualDuration}m / ` : ""}{item.estimatedDuration}m
                                  </span>
                                )}
                              </div>
                            )}

                            {item.type === "bookmark" && item.content && (
                              <a 
                                href={item.content} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all"
                              >
                                <Link2 className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              onClick={() => toggleStory(item.id)}
                              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                                expandedStories[item.id]
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-semibold"
                                  : "border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                              }`}
                              title="Task Chronicle (Notebook Workflow)"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-mono font-medium hidden sm:inline">Story</span>
                            </button>

                            <button
                              onClick={() => onUpdateItem(item.id, { status: "postponed" })}
                              className="text-xs font-mono font-medium px-2 py-1 rounded border border-slate-100 text-slate-500 hover:bg-slate-50 transition-all"
                            >
                              {t("dashboard.defer")}
                            </button>

                            <button
                              onClick={() => onUpdateItem(item.id, { status: "completed" })}
                              className="bg-emerald-500 hover:bg-emerald-400 text-white p-1.5 rounded-lg shadow-sm shadow-emerald-500/10 transition-all flex items-center justify-center"
                              title="Complete Item"
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Story Path Progress Row */}
                        <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-mono text-slate-400">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold uppercase tracking-wider text-slate-500 text-[8px] mr-1">Storypath:</span>
                            {getStoryPathSymbols(item, itemStory).map((s, idx) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && <span className="text-slate-300">➔</span>}
                                <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-bold ${s.color}`} title={s.label}>
                                  <span className="text-xs leading-none font-sans">{s.symbol}</span>
                                  <span className="text-[8px] font-semibold tracking-wider uppercase hidden sm:inline">{s.label}</span>
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                          {itemStory.length > 0 && (
                            <button
                              onClick={() => toggleStory(item.id)}
                              className="text-[9px] text-indigo-500 hover:text-indigo-600 hover:underline"
                            >
                              {expandedStories[item.id] ? "Hide Story Logs" : `${itemStory.length} logged events`}
                            </button>
                          )}
                        </div>

                        {/* Expanded chronicle logs */}
                        {expandedStories[item.id] && (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/80 space-y-2 mt-1">
                            <div className="text-[9px] uppercase font-mono text-slate-500 font-bold border-b border-slate-100 pb-1 flex justify-between">
                              <span>Task Chronicle</span>
                              <span className="text-[8px] font-normal text-slate-400 font-sans">Notebook Workflow</span>
                            </div>
                            <div className="space-y-2">
                              {itemStory.length > 0 ? (
                                itemStory.map((entry) => {
                                  let sym = "○";
                                  let col = "text-slate-400";
                                  if (entry.description.toLowerCase().includes("completed") || entry.description.toLowerCase().includes("done")) {
                                    sym = "□";
                                    col = "text-emerald-500";
                                  } else if (entry.description.toLowerCase().includes("postponed") || entry.description.toLowerCase().includes("pause")) {
                                    sym = "⏸";
                                    col = "text-amber-500";
                                  } else if (entry.description.toLowerCase().includes("focus") || entry.description.toLowerCase().includes("attempt") || entry.description.toLowerCase().includes("start")) {
                                    sym = "△";
                                    col = "text-blue-500";
                                  } else if (entry.description.toLowerCase().includes("priority")) {
                                    sym = "⭐";
                                    col = "text-yellow-500";
                                  }
                                  return (
                                    <div key={entry.id} className="flex gap-2 text-xs">
                                      <span className={`${col} font-bold text-sm w-4 shrink-0 text-center leading-none font-sans`}>{sym}</span>
                                      <div className="flex-1 text-slate-600 leading-normal font-sans text-[11px]">
                                        {entry.description}
                                      </div>
                                      <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[11px] text-slate-400 italic py-1 font-sans">
                                  No timeline entries recorded. Start a deep work focus session on this task to log an attempt!
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 italic">
                    {t("dashboard.sandbox_clean")}
                  </div>
                )}
              </div>
            </div>
          )}

          {subTab === "projects" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  {t("dashboard.projects_title")}
                </h3>
                <button
                  onClick={() => setShowProjForm(!showProjForm)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <FolderPlus className="w-4 h-4" />
                  {t("dashboard.define_project")}
                </button>
              </div>

              {/* Add Project Form */}
              {showProjForm && (
                <form onSubmit={handleAddProjectSubmit} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.proj_form_name")}</label>
                      <input
                        type="text"
                        required
                        value={projName}
                        onChange={(e) => setProjName(e.target.value)}
                        placeholder={t("dashboard.placeholder_proj_name")}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.proj_form_color")}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={projColor}
                          onChange={(e) => setProjColor(e.target.value)}
                          className="w-8 h-8 rounded-lg border-0 cursor-pointer overflow-hidden p-0"
                        />
                        <input
                          type="text"
                          value={projColor}
                          onChange={(e) => setProjColor(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500 font-mono transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{t("dashboard.proj_form_desc")}</label>
                    <textarea
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      placeholder={t("dashboard.placeholder_proj_desc")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 h-16 resize-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowProjForm(false)}
                      className="px-3.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-semibold"
                    >
                      {t("dashboard.btn_cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={addingProj}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                    >
                      {addingProj ? t("dashboard.btn_initializing") : t("dashboard.btn_create_proj")}
                    </button>
                  </div>
                </form>
              )}

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => {
                  const projTasks = items.filter(t => t.projectId === proj.id);
                  const openCount = projTasks.filter(t => t.status !== 'completed').length;
                  const closedCount = projTasks.filter(t => t.status === 'completed').length;
                  const ratio = projTasks.length ? Math.round((closedCount / projTasks.length) * 100) : 0;

                  return (
                    <div 
                      key={proj.id}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full" 
                              style={{ backgroundColor: proj.color }}
                            />
                            <h4 className="font-semibold text-slate-800 text-sm">{proj.name}</h4>
                          </div>
                          <span className="text-[9px] font-mono bg-slate-50 border border-slate-100 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                            {proj.status === "active" ? t("dashboard.filter_all") : proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1 border-t border-slate-50 pt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{t("dashboard.progress_rate")}</span>
                          <span>{ratio}% ({closedCount}/{projTasks.length})</span>
                        </div>
                        <div className="w-full bg-slate-50 rounded-full h-1 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500"
                            style={{ width: `${ratio}%`, backgroundColor: proj.color }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>{t("dashboard.pending_backlog")}</span>
                          <span className="font-semibold text-slate-600">{t("dashboard.active_tasks", { count: openCount })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subTab === "automation" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    {t("dashboard.automation_title")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("dashboard.automation_subtitle")}
                  </p>
                </div>
                <button
                  onClick={handleTriggerWebhook}
                  disabled={triggeringAuto}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${triggeringAuto ? "animate-spin" : ""}`} />
                  {triggeringAuto ? t("dashboard.triggering") : t("dashboard.btn_trigger_webhook")}
                </button>
              </div>

              {/* Logs Stream */}
              <div className="bg-slate-950 rounded-2xl border border-slate-900 p-5 font-mono text-xs text-slate-300 space-y-3 max-h-[360px] overflow-y-auto">
                <div className="text-slate-600">{t("dashboard.auto_queue_placeholder")}</div>
                
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="border-b border-slate-900 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-400 font-bold">{log.actionName}</span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{log.message}</p>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>STATUS: {log.status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 italic py-8 text-center">{t("dashboard.no_auto_logs")}</div>
                )}
              </div>
            </div>
          )}

          {subTab === "integrations" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  {t("dashboard.integrations_title")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t("dashboard.integrations_subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div 
                    key={integration.id}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-indigo-50 border border-indigo-100/50">
                            <Globe className="w-4 h-4 text-indigo-500" />
                          </span>
                          <h4 className="font-semibold text-slate-800 text-sm">{integration.name}</h4>
                        </div>
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          integration.connected 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}>
                          {integration.connected ? t("dashboard.connected") : t("dashboard.disconnected")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {integration.type === "google_calendar" 
                          ? t("dashboard.integration_desc_cal")
                          : t("dashboard.integration_desc_git")}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 pt-4 mt-4 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-400">
                        {integration.lastSynced 
                          ? t("dashboard.synced_at", { time: new Date(integration.lastSynced).toLocaleTimeString() })
                          : t("dashboard.never_synced")}
                      </span>
                      <button
                        onClick={() => onToggleIntegration(integration.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          integration.connected
                            ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                            : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500"
                        }`}
                      >
                        {integration.connected ? t("dashboard.btn_disconnect") : t("dashboard.btn_connect")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN (Live Timeline Feed) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between min-h-[420px]">
            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  {t("dashboard.timeline_title")}
                </h3>
              </div>

              {/* List scroll */}
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {timeline.length > 0 ? (
                  timeline.map((entry) => (
                    <div key={entry.id} className="flex gap-3 text-xs relative pb-4 last:pb-0">
                      {/* Line connector */}
                      <div className="absolute top-4 left-1.5 bottom-0 w-px bg-slate-100" />
                      
                      {/* Circle dot */}
                      <span className={`w-3.5 h-3.5 rounded-full border-2 bg-white shrink-0 mt-0.5 z-10 ${
                        entry.type === "automation" 
                          ? "border-amber-400" 
                          : "border-indigo-400"
                      }`} />

                      <div className="space-y-1">
                        <p className="text-slate-600 font-medium leading-relaxed">
                          {entry.description}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic text-center py-12">
                    {t("dashboard.timeline_empty")}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{t("dashboard.completed_today")}</span>
              <span className="font-semibold text-slate-600">{t("dashboard.completed_count", { count: completedItems.length })}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
