import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Square, Clock, Brain, Activity, Volume2, VolumeX, CheckCircle2, AlertCircle, Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project, Item, FocusSession, EnergyLevel } from "../types";
import ProgressRing from "./ProgressRing";
import { motion, AnimatePresence } from "motion/react";

interface FocusModeProps {
  projects: Project[];
  tasks: Item[];
  activeSession: FocusSession | null;
  onStartSession: (projectId?: string, taskId?: string, energyLevel?: EnergyLevel) => Promise<void>;
  onEndSession: (score: number, notes: string, energy: EnergyLevel) => Promise<void>;
  onRefresh: () => void;
}

export default function FocusMode({
  projects,
  tasks,
  activeSession,
  onStartSession,
  onEndSession,
  onRefresh,
}: FocusModeProps) {
  const { t, i18n } = useTranslation();
  const isFa = i18n.language === "fa";
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [totalDuration, setTotalDuration] = useState<number>(25 * 60);
  
  // Audio state
  const [synthOn, setSynthOn] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Completion logging modal/state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [deepWorkScore, setDeepWorkScore] = useState<number>(8);
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Sync selected task with selected project
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        setSelectedProjectId(task.projectId);
      }
    }
  }, [selectedTaskId, tasks]);

  // Sync with server's active session state if running
  useEffect(() => {
    if (activeSession) {
      setIsRunning(true);
      const elapsedSeconds = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
      const defaultLimit = 25 * 60; // default to pomodoro length if we don't have custom minutes
      const remaining = defaultLimit - elapsedSeconds;
      if (remaining > 0) {
        setTimeLeft(remaining);
        setTotalDuration(defaultLimit);
      } else {
        // Count up if elapsed longer
        setTimeLeft(0);
        setTotalDuration(defaultLimit);
      }
    } else {
      setIsRunning(false);
      setTimeLeft(customMinutes * 60);
      setTotalDuration(customMinutes * 60);
    }
  }, [activeSession, customMinutes]);

  // Countdown clock tick
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isRunning) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Finished! Keep running but play sound or prompt
            if (synthOn) stopSynthesizer();
            setIsRunning(false);
            setShowLogModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isRunning, synthOn]);

  // Handle Synthesizer Sound
  const toggleSynthesizer = () => {
    if (synthOn) {
      stopSynthesizer();
    } else {
      startSynthesizer();
    }
  };

  const startSynthesizer = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Master Gain Node
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime); // Low background volume
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      // Deep focus binaural beats (subtle alpha state: 100Hz and 110Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(100, ctx.currentTime);
      osc1.connect(gainNode);
      osc1.start();
      osc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.connect(gainNode);
      osc2.start();
      osc2Ref.current = osc2;

      setSynthOn(true);
    } catch (e) {
      console.error("Web Audio not supported", e);
    }
  };

  const stopSynthesizer = () => {
    if (osc1Ref.current) {
      osc1Ref.current.stop();
      osc1Ref.current.disconnect();
    }
    if (osc2Ref.current) {
      osc2Ref.current.stop();
      osc2Ref.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    osc1Ref.current = null;
    osc2Ref.current = null;
    audioContextRef.current = null;
    setSynthOn(false);
  };

  // Cleanup synthesizer on unmount
  useEffect(() => {
    return () => {
      if (osc1Ref.current || osc2Ref.current) {
        stopSynthesizer();
      }
    };
  }, []);

  const handleStartFocus = async () => {
    setLoading(true);
    try {
      await onStartSession(
        selectedProjectId || undefined, 
        selectedTaskId || undefined, 
        energyLevel
      );
      setIsRunning(true);
      setTimeLeft(customMinutes * 60);
      setTotalDuration(customMinutes * 60);
      if (synthOn) {
        // Restart sound on user interaction
        stopSynthesizer();
        startSynthesizer();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStopFocus = () => {
    if (synthOn) stopSynthesizer();
    setIsRunning(false);
    setShowLogModal(true);
  };

  const handleSubmitLog = async () => {
    setLoading(true);
    try {
      await onEndSession(deepWorkScore, sessionNotes, energyLevel);
      setShowLogModal(false);
      setSessionNotes("");
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeProject = projects.find(p => p.id === activeSession?.projectId || p.id === selectedProjectId);
  const activeTask = tasks.find(t => t.id === activeSession?.taskId || t.id === selectedTaskId);
  const progressPercent = activeSession ? 100 : Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  // Filter tasks based on selected project
  const filteredTasks = selectedProjectId 
    ? tasks.filter(t => t.projectId === selectedProjectId && t.status !== "completed")
    : tasks.filter(t => t.status !== "completed");

  return (
    <div id="focus-section" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-800 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
            {t("focus.title")}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("focus.subtitle")}
          </p>
        </div>
        <button
          onClick={toggleSynthesizer}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-2 transition-all ${
            synthOn 
              ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" 
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {synthOn ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          {synthOn ? t("focus.alpha_waves_on") : t("focus.ambient_synth")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 ease-in-out">
        {/* Distraction-Free Focus Stage */}
        <div className={`bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[460px] transition-all duration-300 ease-in-out ${
          activeSession && !isSettingsExpanded ? "lg:col-span-3" : "lg:col-span-2"
        }`}>
          {/* Subtle Ambient Wave Effect in Background */}
          {isRunning && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <div className="absolute w-full h-full border-t border-indigo-400 rounded-full animate-[ping_4s_linear_infinite]" />
              <div className="absolute w-full h-full border-t border-indigo-400 rounded-full animate-[ping_8s_linear_infinite] delay-1000" />
            </div>
          )}

          {activeSession ? (
            <div className="absolute top-4 left-4 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400 animate-bounce" />
              {t("focus.sprint_active")}
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-slate-800/80 border border-slate-700 text-slate-400 px-3 py-1 rounded-full text-xs font-mono">
              {t("focus.standby_state")}
            </div>
          )}

          {/* Time Countdown Panel with circular ProgressRing */}
          <div className="text-center space-y-6 z-10 flex flex-col items-center justify-center w-full">
            <ProgressRing percent={progressPercent} size={260} strokeWidth={8} color="#6366f1">
              <span className="font-mono text-5xl md:text-6xl tracking-tight text-white font-medium select-none">
                {formatTime(timeLeft)}
              </span>
            </ProgressRing>

            {/* Target Label & Summary card for Immersive Mode */}
            {activeSession && !isSettingsExpanded ? (
              <div 
                onClick={() => setIsSettingsExpanded(true)}
                className="p-3.5 bg-slate-850/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl text-xs flex items-center justify-between gap-4 text-slate-400 cursor-pointer transition-all max-w-sm w-full mx-auto select-none mt-2"
                title={isFa ? "برای نمایش تنظیمات کامل کلیک کنید" : "Click to view full settings"}
              >
                <div className="flex items-center gap-2 text-left truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: activeProject?.color || '#a1a1aa' }}
                  />
                  <div className="truncate">
                    <div className="font-semibold text-slate-200 truncate">
                      {activeProject?.name || t("focus.general_freelance")}
                    </div>
                    {activeTask && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {activeTask.title}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/50 text-[10px] font-mono font-bold text-indigo-400">
                  <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                  {t(`dashboard.energy_short_${activeSession?.energyLevel || energyLevel}`)}
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                {activeProject ? (
                  <div className="flex items-center justify-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: activeProject.color }}
                    />
                    <h3 className="text-lg font-medium text-slate-200">
                      {activeProject.name}
                    </h3>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">{t("focus.no_project_targeted")}</p>
                )}
                
                {activeTask && (
                  <p className="text-indigo-400 font-mono text-xs tracking-wider uppercase">
                    {t("focus.focusing_on", { title: activeTask.title })}
                  </p>
                )}
              </div>
            )}

            {/* Timer Actions */}
            <div className="pt-2 flex justify-center gap-4">
              {!activeSession ? (
                <button
                  onClick={handleStartFocus}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  {t("focus.btn_start")}
                </button>
              ) : (
                <button
                  onClick={handleStopFocus}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-white" />
                  {t("focus.btn_end")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <AnimatePresence mode="wait">
          {(!activeSession || isSettingsExpanded) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    {t("focus.settings_title")}
                  </h3>
                  {activeSession && (
                    <button
                      onClick={() => setIsSettingsExpanded(false)}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {isFa ? "← جمع کردن" : "← Collapse"}
                    </button>
                  )}
                </div>

                {/* Project Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-500 uppercase">{t("focus.target_project")}</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedTaskId(""); // Reset task
                    }}
                    disabled={!!activeSession}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-70 transition-all"
                  >
                    <option value="">{t("focus.general_freelance")}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-500 uppercase">{t("focus.focus_task")}</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={!!activeSession}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-70 transition-all"
                  >
                    <option value="">{t("focus.no_specific_task")}</option>
                    {filteredTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Energy Level State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-500 uppercase">{t("focus.energy_level")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as EnergyLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEnergyLevel(level)}
                        className={`py-1.5 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                          energyLevel === level
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {t(`dashboard.energy_short_${level}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Timer Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-500 uppercase flex justify-between">
                    <span>{t("focus.duration")}</span>
                    <span>{t("focus.duration_mins", { count: customMinutes })}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={customMinutes}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setCustomMinutes(m);
                      if (!activeSession) {
                        setTimeLeft(m * 60);
                        setTotalDuration(m * 60);
                      }
                    }}
                    disabled={!!activeSession}
                    className="w-full accent-indigo-600 cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 text-slate-400 text-[11px] font-mono leading-relaxed space-y-1">
                <div>{t("focus.bullet_1")}</div>
                <div>{t("focus.bullet_2")}</div>
                <div>{t("focus.bullet_3")}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Log Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t("focus.modal_title")}</h3>
                <p className="text-xs text-slate-500">{t("focus.modal_subtitle")}</p>
              </div>
            </div>

            <div className="space-y-4 py-2">
              {/* Deep Work Score 1-10 */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 uppercase flex justify-between">
                  <span>{t("focus.deep_work_index")}</span>
                  <span className="font-semibold text-indigo-600">{deepWorkScore}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={deepWorkScore}
                  onChange={(e) => setDeepWorkScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{t("focus.distracted")}</span>
                  <span>{t("focus.flawless_flow")}</span>
                </div>
              </div>

              {/* Energy levels check */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 uppercase">{t("focus.post_session_energy")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as EnergyLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEnergyLevel(level)}
                      className={`py-1.5 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                        energyLevel === level
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t(`dashboard.energy_short_${level}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 uppercase">{t("focus.insights_obstacles")}</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder={t("focus.placeholder_textarea")}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-transparent rounded-xl text-sm font-medium"
              >
                {t("focus.btn_discard")}
              </button>
              <button
                onClick={handleSubmitLog}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-600/10"
              >
                {loading ? t("focus.btn_syncing") : t("focus.btn_publish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
