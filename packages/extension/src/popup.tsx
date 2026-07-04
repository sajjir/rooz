import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Brain, Clock, Settings, Layers, Send, Check } from "lucide-react";
import { useStore } from "../../shared/services/StoreService";
import "../../../src/index.css";

function Popup() {
  const [inputText, setInputText] = useState("");
  const [captured, setCaptured] = useState(false);
  const { init, addItem } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const title = inputText.trim();

    // Determine type based on prefix or content search
    let type: "task" | "idea" | "bookmark" | "habit" | "knowledge" = "task";
    let symbol = "Zap";
    let tags = ["quick-capture"];

    if (title.toLowerCase().startsWith("idea:") || title.toLowerCase().startsWith("idea ")) {
      type = "idea";
      symbol = "Sparkles";
      tags.push("idea");
    } else if (title.toLowerCase().startsWith("http://") || title.toLowerCase().startsWith("https://") || title.includes(".com") || title.includes(".org")) {
      type = "bookmark";
      symbol = "Link2";
      tags.push("link");
    } else if (title.toLowerCase().startsWith("habit:") || title.toLowerCase().startsWith("habit ")) {
      type = "habit";
      symbol = "Activity";
      tags.push("habit");
    }

    const cleanTitle = title
      .replace(/^idea:\s*/i, "")
      .replace(/^idea\s+/i, "")
      .replace(/^habit:\s*/i, "")
      .replace(/^habit\s+/i, "");

    try {
      await addItem({
        title: cleanTitle,
        content: "Captured via Quick Capture dashboard widget.",
        type,
        symbol,
        tags,
      });

      setCaptured(true);
      setInputText("");
      setTimeout(() => {
        setCaptured(false);
      }, 1500);
    } catch (err) {
      console.error("Quick capture save failed", err);
    }
  };

  const openSidepanelAndNavigate = (tab: "focus" | "dashboard" | "ai") => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.sidePanel.open({ tabId }, () => {
            setTimeout(() => {
              chrome.runtime.sendMessage({ type: "NAVIGATE_TAB", tab });
            }, 300);
          });
        }
      });
    } else {
      console.log(`Open sidepanel and navigate to ${tab}`);
    }
  };

  return (
    <div className="p-5 w-[320px] bg-slate-950 text-slate-100 rounded-2xl border border-slate-900/80 shadow-2xl flex flex-col gap-4 font-sans select-none">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
            <Brain className="w-4 h-4 text-indigo-200" />
          </span>
          <h2 className="text-sm font-bold tracking-wider text-slate-100 font-sans uppercase">
            Rooz
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[9px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
            One Day. One Direction.
          </span>
        </div>
      </div>

      {/* Quick Capture Input Form */}
      <form onSubmit={handleQuickCapture} className="space-y-2">
        <label className="text-[10px] font-mono text-slate-400 font-semibold uppercase block">
          Quick Capture
        </label>
        <div className="relative">
          <input
            type="text"
            required
            autoFocus
            placeholder={captured ? "Successfully captured!" : "Write anything..."}
            value={inputText}
            disabled={captured}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full bg-slate-900/80 border text-xs rounded-xl px-3.5 py-2.5 outline-none font-sans placeholder-slate-500 transition-all ${
              captured 
                ? "border-emerald-500/80 text-emerald-400 bg-emerald-950/20" 
                : "border-slate-800 focus:border-indigo-500/80 focus:bg-slate-900 text-slate-100"
            }`}
          />
          <button
            type="submit"
            disabled={captured || !inputText.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all ${
              captured ? "text-emerald-400" : ""
            }`}
          >
            {captured ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        {captured && (
          <p className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
            ● Captured to inbox timeline
          </p>
        )}
      </form>

      {/* Navigation Shortcuts Grid */}
      <div className="space-y-2 pt-1 border-t border-slate-900">
        <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider block">
          Workspace Access
        </span>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => openSidepanelAndNavigate("dashboard")}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">Open Workspace</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Ctrl+Shift+B</span>
          </button>

          <button
            onClick={() => openSidepanelAndNavigate("dashboard")}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">Settings</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Integrations</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<Popup />);
}
export default Popup;
