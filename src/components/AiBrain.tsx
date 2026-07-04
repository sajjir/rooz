import React, { useState, useEffect } from "react";
import { 
  Brain, Sparkles, TrendingUp, AlertTriangle, Play, CheckCircle, 
  Cpu, Zap, Send, Bell, ListPlus, Terminal, RefreshCw, HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AiAnalysis } from "../types";

interface AiBrainProps {
  onRefreshAll: () => void;
}

export default function AiBrain({ onRefreshAll }: AiBrainProps) {
  const { t, i18n } = useTranslation();
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  
  // Agent command bar state
  const [command, setCommand] = useState<string>("");
  const [loadingAgent, setLoadingAgent] = useState<boolean>(false);
  const [agentResponse, setAgentResponse] = useState<{
    summary: string;
    mutations: any[];
  } | null>(null);

  // Load latest analysis on mount
  useEffect(() => {
    fetchLatestInsights();
  }, []);

  const fetchLatestInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: i18n.language }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error("Failed to fetch AI insights", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoadingAgent(true);
    setAgentResponse(null);
    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: command, locale: i18n.language }),
      });
      if (res.ok) {
        const data = await res.json();
        setAgentResponse(data);
        setCommand("");
        // Instantly trigger workspace state refresh to reflect mutations!
        onRefreshAll();
      }
    } catch (err) {
      console.error("AI Agent failed to execute command", err);
    } finally {
      setLoadingAgent(false);
    }
  };

  // Simple Markdown formatter to HTML
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    const lines = md.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-md font-bold text-slate-800 mt-4 mb-2 first:mt-0 font-sans">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("#### ")) {
        return <h5 key={idx} className="text-sm font-semibold text-indigo-600 mt-3 mb-1 first:mt-0 font-mono tracking-wide">{line.replace("#### ", "")}</h5>;
      }
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-slate-600 leading-relaxed py-0.5">
            {line.substring(2)}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-1 font-sans">{line}</p>;
    });
  };

  // Preset Commands for user helper clicks
  const presets = i18n.language === "fa" ? [
    "شکستن پروژه معماری پلتفرم به چند وظیفه",
    "تبدیل ایده سینث‌سایزر تمرکز عمیق به پروژه",
    "یادآوری کن که صفحه لندینگ را تا ۲۰ دقیقه دیگر تمام کنم",
    "برنامه‌ریزی و آماده‌سازی کارهای امروز"
  ] : [
    "Break project Core Platform Architecture into tasks",
    "Convert idea Ambient focus synthesizer into project",
    "Send reminder finish the landing page in 20 minutes",
    "Prepare today's work stack",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Autonomous Agent Command Center */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-900 p-6 shadow-md flex flex-col justify-between min-h-[420px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs tracking-wider text-slate-400 uppercase">
                    {t("ai.terminal_title")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] text-slate-500">{t("ai.terminal_listening")}</span>
                </div>
              </div>

              {/* Agent Console Output */}
              <div className="space-y-3 min-h-[220px] overflow-y-auto max-h-[300px] pr-2 font-mono text-xs leading-relaxed">
                <div className="text-slate-500">
                  {t("ai.terminal_example")}
                </div>

                {loadingAgent && (
                  <div className="flex items-center gap-3 text-indigo-400 animate-pulse py-2">
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>{t("ai.terminal_executing")}</span>
                  </div>
                )}

                {agentResponse && (
                  <div className="space-y-4 pt-2">
                    {/* Summary */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-300">
                      <span className="text-indigo-400 font-bold block mb-1">▶ EXECUTION_SUMMARY:</span>
                      {agentResponse.summary}
                    </div>

                    {/* Mutations list */}
                    {agentResponse.mutations && agentResponse.mutations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-emerald-400 font-bold block mb-1">▶ STATE_MUTATIONS:</span>
                        {agentResponse.mutations.map((mut: any, index: number) => {
                          let label = "";
                          if (mut.type === "create_project") label = i18n.language === "fa" ? `پروژه ایجاد شد: "${mut.data.name}"` : `Created project: "${mut.data.name}"`;
                          if (mut.type === "create_item") label = i18n.language === "fa" ? `آیتم ایجاد شد: "${mut.data.title}" (${mut.data.type})` : `Created item: "${mut.data.title}" (${mut.data.type})`;
                          if (mut.type === "update_item") label = i18n.language === "fa" ? `آیتم با شناسه #${mut.id} ویرایش شد` : `Updated item #${mut.id} status to completed`;
                          if (mut.type === "create_notification") label = i18n.language === "fa" ? `اعلان ارسال شد: "${mut.data.title}"` : `Dispatched notification: "${mut.data.title}"`;
                          if (mut.type === "create_timeline") label = i18n.language === "fa" ? `رویداد در جدول زمانی ثبت شد: "${mut.data.description}"` : `Logged timeline entry: "${mut.data.description}"`;

                          return (
                            <div key={index} className="flex items-start gap-2 text-emerald-500">
                              <span className="text-emerald-400">✔</span>
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!agentResponse && !loadingAgent && (
                  <div className="text-slate-600 italic py-6 text-center">
                    {t("ai.terminal_ready")}
                  </div>
                )}
              </div>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSendCommand} className="pt-4 border-t border-slate-900 flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={loadingAgent}
                placeholder={t("ai.placeholder_command")}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loadingAgent || !command.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-xs transition-all disabled:opacity-50 shadow-md shadow-indigo-600/10"
              >
                <Send className="w-3.5 h-3.5" />
                {t("ai.btn_run")}
              </button>
            </form>
          </div>

          {/* Prompt Presets Quick Clicks */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> {t("ai.quick_directives")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCommand(preset)}
                  disabled={loadingAgent}
                  className="text-left text-xs bg-slate-50 border border-slate-100 hover:bg-slate-100/50 rounded-xl px-3.5 py-2.5 text-slate-600 font-sans font-medium transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: AI Insights Diagnostic Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between min-h-[420px] relative overflow-hidden">
            
            {/* Main Insights Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    {t("ai.diagnostics_title")}
                  </h3>
                </div>
                <button
                  onClick={fetchLatestInsights}
                  disabled={loadingInsights}
                  className="text-slate-400 hover:text-indigo-600 disabled:opacity-50 p-1 rounded-lg hover:bg-slate-50 transition-all"
                  title="Recalculate Workspace Insights"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingInsights ? "animate-spin text-indigo-500" : ""}`} />
                </button>
              </div>

              {loadingInsights ? (
                <div className="space-y-4 py-8 animate-pulse text-center">
                  <Brain className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 font-mono">{t("ai.diagnostics_scanning")}</p>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  {/* Performance Indicators */}
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100/50">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">{t("ai.diagnostics_metric_dw")}</span>
                      <span className="text-lg font-bold text-slate-800 font-mono">{analysis.deepWorkScore}/10</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100/50">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">{t("ai.diagnostics_metric_bo")}</span>
                      <span className={`text-xs font-bold font-mono uppercase block py-1 px-1.5 rounded-full mt-0.5 mx-auto w-fit ${
                        analysis.burnoutRisk === "low" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : analysis.burnoutRisk === "medium" 
                          ? "bg-amber-50 text-amber-600 border border-amber-100" 
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}>
                        {analysis.burnoutRisk === "low" ? t("dashboard.energy_low").split(" ")[0] : analysis.burnoutRisk === "medium" ? t("dashboard.energy_medium").split(" ")[0] : t("dashboard.energy_high").split(" ")[0]}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100/50">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">{t("ai.diagnostics_metric_cp")}</span>
                      <span className="text-lg font-bold text-slate-800 font-mono">{analysis.completionRate}%</span>
                    </div>
                  </div>

                  {/* Narrative markdown */}
                  <div className="border-t border-slate-50 pt-3 max-h-[220px] overflow-y-auto pr-1">
                    {renderMarkdown(analysis.insightsText)}
                  </div>

                  {/* Core Suggestions bullets */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="border-t border-slate-50 pt-3 space-y-2">
                      <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider">{t("ai.diagnostics_directives")}</h4>
                      <div className="space-y-1.5">
                        {analysis.suggestions.slice(0, 3).map((sug, idx) => (
                          <div key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed font-sans font-medium">
                            <span className="text-indigo-500 font-mono">▸</span>
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-12 italic">
                  {t("ai.diagnostics_empty")}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 text-slate-400 text-[10px] font-mono text-center leading-relaxed">
              {t("ai.diagnostics_footer")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
