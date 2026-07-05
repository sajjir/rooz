import React, { useState } from "react";
import * as Icons from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project } from "../types";

interface MyProjectsProps {
  projects: Project[];
  onCreateProject: (projectData: any) => Promise<void>;
  onClose: () => void;
}

export default function MyProjects({ projects, onCreateProject, onClose }: MyProjectsProps) {
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === "fa";

  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rootPath, setRootPath] = useState("محصولات من");
  const [customRoot, setCustomRoot] = useState("");
  const [subPath, setSubPath] = useState("");
  const [customSub, setCustomSub] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [selectedSymbol, setSelectedSymbol] = useState("Folder");
  const [saving, setSaving] = useState(false);

  // Preset choices
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];
  const symbols = [
    { name: "Briefcase", label: isFa ? "کیف کار" : "Briefcase" },
    { name: "Code", label: isFa ? "کدنویسی" : "Code" },
    { name: "Brain", label: isFa ? "مغز / هوش" : "Brain" },
    { name: "Zap", label: isFa ? "اتوماسیون / جرقه" : "Zap" },
    { name: "Globe", label: isFa ? "وب / جهان" : "Globe" },
    { name: "Cpu", label: isFa ? "پردازنده" : "Cpu" },
    { name: "Heart", label: isFa ? "سلامتی" : "Heart" },
    { name: "DollarSign", label: isFa ? "مالی" : "Finance" },
    { name: "ShoppingBag", label: isFa ? "خرید" : "Shopping" },
    { name: "Phone", label: isFa ? "تماس" : "Phone" },
    { name: "BookOpen", label: isFa ? "مطالعه / دانش" : "Reading" },
    { name: "Settings", label: isFa ? "تنظیمات" : "Settings" }
  ];

  // Get list of existing Roots and Subs to select from
  const existingRoots = Array.from(new Set(projects.map(p => p.path?.[0] || "").filter(Boolean)));
  const existingSubs = Array.from(new Set(projects.map(p => p.path?.[1] || "").filter(Boolean)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const finalRoot = rootPath === "custom" ? customRoot.trim() : rootPath;
      const finalSub = subPath === "custom" ? customSub.trim() : subPath;

      // Construct path: [Root, Sub (if specified), Name]
      const pathArray: string[] = [];
      if (finalRoot) pathArray.push(finalRoot);
      if (finalSub) pathArray.push(finalSub);
      pathArray.push(name.trim());

      // Limit path array length to 3
      const clampedPath = pathArray.slice(0, 3);

      await onCreateProject({
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        symbol: selectedSymbol,
        path: clampedPath,
        isAiGenerated: false
      });

      // Reset
      setName("");
      setDescription("");
      setCustomRoot("");
      setCustomSub("");
      setShowNewForm(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setSaving(false);
    }
  };

  // Build Hierarchical Tree Structure
  const tree: { [root: string]: { [sub: string]: Project[] } } = {};

  projects.forEach(p => {
    const root = p.path?.[0] || (isFa ? "متفرقه" : "Miscellaneous");
    const sub = p.path?.[1] || ""; // empty if directly under root

    if (!tree[root]) {
      tree[root] = {};
    }
    if (!tree[root][sub]) {
      tree[root][sub] = [];
    }
    tree[root][sub].push(p);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Icons.FolderTree className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">
              {isFa ? "مدیریت دسته‌ها و پروژه‌های من" : "My Categories & Projects"}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-all"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!showNewForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isFa ? "سلسله‌مراتب پروژه‌ها (تا ۳ سطح)" : "Project hierarchy (up to 3 levels)"}
                </span>
                <button
                  onClick={() => {
                    // Set default defaults based on existing values
                    if (existingRoots.length > 0 && !existingRoots.includes(rootPath)) {
                      setRootPath(existingRoots[0]);
                    }
                    setShowNewForm(true);
                  }}
                  className="flex items-center gap-1 text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-600 transition-all font-bold cursor-pointer"
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                  {isFa ? "پروژه / دسته جدید" : "New Project / Category"}
                </button>
              </div>

              {/* Tree View */}
              <div className="space-y-4 font-mono text-xs">
                {Object.keys(tree).map(rootName => (
                  <div key={rootName} className="border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-950/20">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 font-bold text-sm border-b pb-1.5 border-slate-100 dark:border-zinc-800/60">
                      <Icons.FolderOpen className="w-4 h-4 text-indigo-500" />
                      <span>{rootName}</span>
                    </div>

                    <div className="mt-2 pl-4 space-y-3 border-l border-slate-200 dark:border-zinc-800">
                      {Object.keys(tree[rootName]).map(subName => {
                        const projectList = tree[rootName][subName];
                        if (subName === "") {
                          // Directly under root
                          return (
                            <div key="direct" className="space-y-1.5">
                              {projectList.map(proj => {
                                const IconComp = (Icons as any)[proj.symbol] || Icons.Folder;
                                return (
                                  <div key={proj.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${proj.color}15`, color: proj.color }}>
                                        <IconComp className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-700 dark:text-zinc-300">{proj.name}</div>
                                        {proj.description && <div className="text-[10px] text-slate-400 mt-0.5">{proj.description}</div>}
                                      </div>
                                    </div>
                                    {proj.isAiGenerated && (
                                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full uppercase">
                                        {isFa ? "هوش مصنوعی" : "AI"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div key={subName} className="space-y-1.5">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-zinc-400 font-bold">
                              <Icons.ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              <span>{subName}</span>
                            </div>
                            <div className="pl-4 space-y-1 border-l border-dashed border-slate-200 dark:border-zinc-800">
                              {projectList.map(proj => {
                                const IconComp = (Icons as any)[proj.symbol] || Icons.Folder;
                                return (
                                  <div key={proj.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${proj.color}15`, color: proj.color }}>
                                        <IconComp className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-700 dark:text-zinc-300">{proj.name}</div>
                                        {proj.description && <div className="text-[10px] text-slate-400 mt-0.5">{proj.description}</div>}
                                      </div>
                                    </div>
                                    {proj.isAiGenerated && (
                                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full uppercase">
                                        {isFa ? "هوش مصنوعی" : "AI"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-zinc-800 mb-4">
                <span className="font-bold text-slate-700 dark:text-zinc-300">
                  {isFa ? "تعریف ساختار مسیر پروژه" : "Create Project Path Structure"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  {isFa ? "بازگشت" : "Back"}
                </button>
              </div>

              {/* Step 1: Root path element */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-bold">
                  {isFa ? "۱. دسته اصلی (Root):" : "1. Root Category:"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={rootPath}
                    onChange={(e) => setRootPath(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-sans"
                  >
                    <option value="محصولات من">{isFa ? "محصولات من" : "My Products"}</option>
                    <option value="کارهای روزمره">{isFa ? "کارهای روزمره" : "Daily Routines"}</option>
                    {existingRoots
                      .filter(r => r !== "محصولات من" && r !== "کارهای روزمره")
                      .map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))
                    }
                    <option value="custom">{isFa ? "● تعریف دسته اصلی جدید..." : "● Custom Root..."}</option>
                  </select>
                </div>
                {rootPath === "custom" && (
                  <input
                    type="text"
                    required
                    placeholder={isFa ? "مثال: یادگیری" : "e.g. Learning"}
                    value={customRoot}
                    onChange={(e) => setCustomRoot(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-sans"
                  />
                )}
              </div>

              {/* Step 2: Sub path element (optional) */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-bold">
                  {isFa ? "۲. زیردسته (اختیاری - Sub-level):" : "2. Sub-category (Optional):"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={subPath}
                    onChange={(e) => setSubPath(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-sans"
                  >
                    <option value="">{isFa ? "-- بدون زیردسته --" : "-- No sub-category --"}</option>
                    <option value="کدنویسی">{isFa ? "کدنویسی" : "Coding"}</option>
                    <option value="خانواده">{isFa ? "خانواده" : "Family"}</option>
                    <option value="سلامتی">{isFa ? "سلامتی" : "Health"}</option>
                    <option value="مالی">{isFa ? "مالی" : "Finance"}</option>
                    {existingSubs
                      .filter(s => s !== "کدنویسی" && s !== "خانواده" && s !== "سلامتی" && s !== "مالی")
                      .map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))
                    }
                    <option value="custom">{isFa ? "● تعریف زیردسته جدید..." : "● Custom Sub-level..."}</option>
                  </select>
                </div>
                {subPath === "custom" && (
                  <input
                    type="text"
                    required
                    placeholder={isFa ? "مثال: ورزشی" : "e.g. Workouts"}
                    value={customSub}
                    onChange={(e) => setCustomSub(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-sans"
                  />
                )}
              </div>

              {/* Step 3: Project Name */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-bold">
                  {isFa ? "۳. نام پروژه (Name):" : "3. Project Name:"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? "مثال: Automation Hub" : "e.g. Automation Hub"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-sans text-sm font-semibold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-bold">
                  {isFa ? "توضیحات:" : "Description:"}
                </label>
                <textarea
                  placeholder={isFa ? "توضیحی درباره فعالیت‌های این پروژه..." : "Brief summary of activities..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 font-sans min-h-[60px]"
                />
              </div>

              {/* Color Preset Selector */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-bold">
                  {isFa ? "رنگ اختصاصی پروژه:" : "Project Accent Color:"}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className="w-6 h-6 rounded-full cursor-pointer border-2 transition-all flex items-center justify-center"
                      style={{ 
                        backgroundColor: c, 
                        borderColor: selectedColor === c ? '#1e293b' : 'transparent'
                      }}
                    >
                      {selectedColor === c && <Icons.Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol/Icon selector */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 font-bold">
                  {isFa ? "نماد پروژه:" : "Project Symbol/Icon:"}
                </label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {symbols.map(sym => {
                    const SymIcon = (Icons as any)[sym.name] || Icons.Folder;
                    const isSelected = selectedSymbol === sym.name;
                    return (
                      <button
                        key={sym.name}
                        type="button"
                        onClick={() => setSelectedSymbol(sym.name)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold" 
                            : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50"
                        }`}
                      >
                        <SymIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate text-[10px]">{sym.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-500 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 cursor-pointer text-center"
                >
                  {saving ? (isFa ? "در حال ذخیره..." : "Saving...") : (isFa ? "ایجاد پروژه جدید" : "Create Project")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  {isFa ? "لغو" : "Cancel"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
