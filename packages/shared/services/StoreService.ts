import { create } from "zustand";
import { DbState, Project, Item, FocusSession, TimelineEntry, AutomationLog, NotificationEntry, IntegrationConfig, UserProfile, ItemStatus, ItemType, Priority, EnergyLevel } from "../types";
import { storageService } from "./StorageService";
import { notificationService } from "./NotificationService";
import { automationService } from "./AutomationService";

export interface StoreState extends DbState {
  loading: boolean;
  activeSession: FocusSession | null;
  
  // Actions
  init: () => Promise<void>;
  addItem: (itemData: Partial<Item>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<void>;
  startFocusSession: (projectId?: string, taskId?: string, energyLevel?: EnergyLevel) => Promise<void>;
  endFocusSession: (score: number, notes: string, energy: EnergyLevel) => Promise<void>;
  triggerAutomation: () => Promise<void>;
  toggleIntegration: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  updateUserGoal: (updates: Partial<UserProfile>) => Promise<void>;
}

// Initial fallback state
const defaultDb: DbState = {
  user: {
    id: "user-1",
    name: "Jamal",
    email: "jamaladin3.14@gmail.com",
    dailyGoalMinutes: 90,
  },
  projects: [
    {
      id: "project-1",
      name: "Core Platform Architecture",
      description: "Build foundational engine, API routes, and schema models.",
      color: "#6366f1", // indigo
      symbol: "Cpu",
      status: "active",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      path: ["محصولات من", "کدنویسی", "Core Platform Architecture"],
      isAiGenerated: false,
    },
    {
      id: "project-2",
      name: "Alpha Landing Page",
      description: "Modern, aesthetic landing page showcasing the product.",
      color: "#10b981", // emerald
      symbol: "Globe",
      status: "active",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      path: ["محصولات من", "کدنویسی", "Alpha Landing Page"],
      isAiGenerated: false,
    },
    {
      id: "project-3",
      name: "Automation Sandbox",
      description: "Trigger flows, capture webhooks, and sync notifications.",
      color: "#f59e0b", // amber
      symbol: "Zap",
      status: "active",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      path: ["محصولات من", "کدنویسی", "Automation Sandbox"],
      isAiGenerated: false,
    },
    {
      id: "project-4",
      name: "AI Reasoning Core",
      description: "Design autonomous loops, context retrievers, and prompt layers.",
      color: "#f43f5e", // rose
      symbol: "Brain",
      status: "active",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      path: ["محصولات من", "کدنویسی", "AI Reasoning Core"],
      isAiGenerated: false,
    },
    // Seeded Base Categories
    {
      id: "project-seed-1",
      name: "تماس‌ها",
      description: "کارهای روزمره مربوط به تماس‌ها و پیگیری‌ها",
      color: "#3b82f6",
      symbol: "Phone",
      status: "active",
      createdAt: new Date().toISOString(),
      path: ["کارهای روزمره", "خانواده", "تماس‌ها"],
      isAiGenerated: false,
    },
    {
      id: "project-seed-2",
      name: "خریدها و قول‌ها",
      description: "خرید وسایل خانه و قول‌های خانوادگی",
      color: "#ec4899",
      symbol: "ShoppingBag",
      status: "active",
      createdAt: new Date().toISOString(),
      path: ["کارهای روزمره", "خانواده", "خریدها و قول‌ها"],
      isAiGenerated: false,
    },
    {
      id: "project-seed-3",
      name: "قرارها",
      description: "قرارهای ملاقات و برنامه‌های خانوادگی",
      color: "#f59e0b",
      symbol: "Calendar",
      status: "active",
      createdAt: new Date().toISOString(),
      path: ["کارهای روزمره", "خانواده", "قرارها"],
      isAiGenerated: false,
    },
    {
      id: "project-seed-4",
      name: "سلامتی",
      description: "ورزش، درمان و مراقبت‌های شخصی سلامت",
      color: "#10b981",
      symbol: "Heart",
      status: "active",
      createdAt: new Date().toISOString(),
      path: ["کارهای روزمره", "سلامتی"],
      isAiGenerated: false,
    },
    {
      id: "project-seed-5",
      name: "مالی",
      description: "حساب‌کتاب، درآمدها و مخارج روزمره",
      color: "#84cc16",
      symbol: "DollarSign",
      status: "active",
      createdAt: new Date().toISOString(),
      path: ["کارهای روزمره", "مالی"],
      isAiGenerated: false,
    },
    // Default Fallback Category
    {
      id: "project-seed-fallback",
      name: "نامشخص",
      description: "دسته پیش‌فرض برای آیتم‌های دسته‌بندی نشده تحت محصولات من",
      color: "#64748b",
      symbol: "HelpCircle",
      status: "active",
      createdAt: new Date().toISOString(),
      path: ["محصولات من", "نامشخص"],
      isAiGenerated: false,
    }
  ],
  items: [
    {
      id: "item-1",
      projectId: "project-1",
      title: "Define API route schema specs",
      content: "Document typed REST endpoints for all major resources.",
      type: "task",
      status: "completed",
      priority: "high",
      energy: "high",
      symbol: "FileJson",
      estimatedDuration: 60,
      actualDuration: 45,
      postponedCount: 0,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["api", "spec"],
      history: [
        {
          id: "hist-1-1",
          projectId: "project-1",
          itemId: "item-1",
          type: "log",
          description: "○ Idea: Created task spec sheets.",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-1-2",
          projectId: "project-1",
          itemId: "item-1",
          type: "log",
          description: "△ Attempt: Began API endpoints documentation.",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-1-3",
          projectId: "project-1",
          itemId: "item-1",
          type: "log",
          description: "□ Done: Finalized typed schemas.",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: "item-2",
      projectId: "project-1",
      title: "Configure Express database adapter",
      content: "Ensure state persists cleanly to the local file system with automatic seeding.",
      type: "task",
      status: "todo",
      priority: "high",
      energy: "medium",
      symbol: "Database",
      estimatedDuration: 90,
      actualDuration: 0,
      postponedCount: 4,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["db", "backend"],
      history: [
        {
          id: "hist-2-1",
          projectId: "project-1",
          itemId: "item-2",
          type: "log",
          description: "○ Idea: Setup file database strategy.",
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-2-2",
          projectId: "project-1",
          itemId: "item-2",
          type: "log",
          description: "⏸ Pause: Deferred work to tomorrow.",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-2-3",
          projectId: "project-1",
          itemId: "item-2",
          type: "log",
          description: "⏸ Pause: Shifted priority focus.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-2-4",
          projectId: "project-1",
          itemId: "item-2",
          type: "log",
          description: "⏸ Pause: Delayed due to schema refactoring requirements.",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
    },
    {
      id: "item-3",
      projectId: "project-2",
      title: "Create Tailwind display layout",
      content: "Develop responsive display panels using Inter and JetBrains Mono.",
      type: "task",
      status: "todo",
      priority: "medium",
      energy: "low",
      symbol: "Layout",
      estimatedDuration: 120,
      actualDuration: 0,
      postponedCount: 3,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["frontend", "css"],
      history: [
        {
          id: "hist-3-1",
          projectId: "project-2",
          itemId: "item-3",
          type: "log",
          description: "○ Idea: Layout draft designs.",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-3-2",
          projectId: "project-2",
          itemId: "item-3",
          type: "log",
          description: "⏸ Pause: Paused focus session due to other tasks.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-3-3",
          projectId: "project-2",
          itemId: "item-3",
          type: "log",
          description: "⏸ Pause: Shifted timeline.",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
    },
    {
      id: "item-4",
      projectId: "project-3",
      title: "Add dynamic timer clock trigger",
      content: "Implement precise countdown ticks for deep work focus states.",
      type: "task",
      status: "completed",
      priority: "high",
      energy: "high",
      symbol: "Clock",
      estimatedDuration: 45,
      actualDuration: 50,
      postponedCount: 0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["timer", "focus"],
      history: [
        {
          id: "hist-4-1",
          projectId: "project-3",
          itemId: "item-4",
          type: "log",
          description: "○ Idea: Added dynamic stopwatch requirements.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-4-2",
          projectId: "project-3",
          itemId: "item-4",
          type: "log",
          description: "△ Attempt: Launched focus session on timer loop.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "hist-4-3",
          projectId: "project-3",
          itemId: "item-4",
          type: "log",
          description: "□ Done: Integrated precise visual ticks.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
    },
    {
      id: "item-5",
      projectId: "project-4",
      title: "AI-driven self-healing database queries",
      content: "Idea: Automatically patch broken schema access lines using LLM runtime feedback.",
      type: "idea",
      status: "todo",
      priority: "medium",
      energy: "high",
      symbol: "Sparkles",
      estimatedDuration: 0,
      actualDuration: 0,
      postponedCount: 0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["ai-idea", "research"],
      history: [
        {
          id: "hist-5-1",
          projectId: "project-4",
          itemId: "item-5",
          type: "log",
          description: "○ Idea: Logged AI-driven queries concepts.",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: "item-6",
      projectId: "project-3",
      title: "Ambient audio focus synthesizer",
      content: "Idea: Modulate wave frequencies dynamically based on keystroke acceleration.",
      type: "idea",
      status: "todo",
      priority: "low",
      energy: "medium",
      symbol: "Music",
      estimatedDuration: 0,
      actualDuration: 0,
      postponedCount: 0,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["audio", "timer"],
      history: [
        {
          id: "hist-6-1",
          projectId: "project-3",
          itemId: "item-6",
          type: "log",
          description: "○ Idea: Captured keystroke audio generator idea.",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
  ],
  focusSessions: [
    {
      id: "session-1",
      projectId: "project-1",
      taskId: "item-1",
      startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 3.1 * 60 * 60 * 1000).toISOString(),
      duration: 54,
      deepWorkScore: 8,
      energyLevel: "high",
      notes: "Quiet morning. Highly focused on typing out schema definitions.",
      completed: true,
    },
    {
      id: "session-2",
      projectId: "project-3",
      taskId: "item-4",
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      deepWorkScore: 9,
      energyLevel: "high",
      notes: "Worked perfectly without checking social media. Realized timer countdown ticks code needs debouncer.",
      completed: true,
    },
  ],
  timeline: [
    {
      id: "timeline-1",
      projectId: "project-1",
      itemId: "item-1",
      type: "log",
      description: "Completed task: 'Define API route schema specs' [○ → △ → □]",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "timeline-2",
      projectId: "project-1",
      type: "log",
      description: "Focus session started: 54m on Core Platform Architecture [○ → △]",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "timeline-3",
      projectId: "project-3",
      itemId: "item-4",
      type: "log",
      description: "Completed task: 'Add dynamic timer clock trigger' [○ → △ → □]",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  automationLogs: [
    {
      id: "auto-1",
      actionName: "Calendar Sync",
      status: "success",
      message: "Synchronized 3 calendar events onto timeline.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  notifications: [
    {
      id: "notif-1",
      title: "Cognitive Engine Initialized",
      message: "The local second brain is fully online. Ready to structure and automate your workflows.",
      read: false,
      timestamp: new Date().toISOString(),
    },
  ],
  integrations: [
    {
      id: "int-1",
      name: "Google Calendar",
      type: "google_calendar",
      connected: false,
    },
    {
      id: "int-2",
      name: "GitHub Actions",
      type: "github",
      connected: false,
    },
  ],
};

export const useStore = create<StoreState>((set, get) => ({
  ...defaultDb,
  loading: true,
  activeSession: null,

  init: async () => {
    set({ loading: true });
    try {
      let state = await storageService.getDbState();
      if (!state) {
        state = defaultDb;
        await storageService.saveDbState(state);
      }
      const active = state.focusSessions?.find((s) => !s.completed) || null;
      set({
        ...state,
        activeSession: active,
        loading: false,
      });
    } catch (err) {
      console.error("Store initialization error:", err);
      set({ loading: false });
    }
  },

  addItem: async (itemData) => {
    const timestamp = new Date().toISOString();
    const itemId = "item-" + Date.now();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();

    const title = itemData.title || "New Item";
    const type = itemData.type || "task";
    const status = itemData.status || "todo";
    const priority = itemData.priority || "medium";
    const energy = itemData.energy || "medium";
    const symbol = itemData.symbol || (type === "task" ? "CheckSquare" : type === "idea" ? "Sparkles" : "FileText");
    const projectId = itemData.projectId || projects[0]?.id || "project-1";

    const newHistory: TimelineEntry = {
      id: "timeline-item-" + Date.now(),
      projectId,
      itemId,
      type: "log",
      description: `○ Idea: Added ${type} '${title}'`,
      timestamp,
    };

    const newItem: Item = {
      id: itemId,
      projectId,
      title,
      content: itemData.content || "",
      type,
      status,
      priority,
      energy,
      symbol,
      estimatedDuration: Number(itemData.estimatedDuration) || 0,
      actualDuration: 0,
      postponedCount: 0,
      dueDate: itemData.dueDate,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: Array.isArray(itemData.tags) ? itemData.tags : [],
      history: [newHistory],
    };

    const updatedItems = [...items, newItem];
    const updatedTimeline = [newHistory, ...timeline];

    const updatedState: DbState = {
      user,
      projects,
      items: updatedItems,
      focusSessions,
      timeline: updatedTimeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ items: updatedItems, timeline: updatedTimeline });
    await storageService.saveDbState(updatedState);

    // Call Automation if configured
    await automationService.trigger({
      eventName: "Task Created",
      itemId,
      itemTitle: title,
      itemType: type,
      timestamp,
    });

    return newItem;
  },

  updateItem: async (id, updates) => {
    const timestamp = new Date().toISOString();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();

    let updatedTimeline = [...timeline];
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const itemHistory = [...(item.history || [])];
        let postponedCount = item.postponedCount;

        if (updates.status === "completed" && item.status !== "completed") {
          const completionLog: TimelineEntry = {
            id: "timeline-" + Date.now(),
            projectId: item.projectId,
            itemId: item.id,
            type: "log",
            description: `□ Done: Completed task: '${item.title}'`,
            timestamp,
          };
          itemHistory.push(completionLog);
          updatedTimeline.unshift(completionLog);
          
          // Automation trigger
          automationService.trigger({
            eventName: "Task Completed",
            itemId: item.id,
            itemTitle: item.title,
            itemType: item.type,
            timestamp,
          });
        } else if (updates.status === "postponed" && item.status !== "postponed") {
          postponedCount += 1;
          const postponementLog: TimelineEntry = {
            id: "timeline-" + Date.now(),
            projectId: item.projectId,
            itemId: item.id,
            type: "log",
            description: `⏸ Pause: Deferred '${item.title}' (Deferred count: ${postponedCount})`,
            timestamp,
          };
          itemHistory.push(postponementLog);
          updatedTimeline.unshift(postponementLog);

          if (postponedCount >= 3) {
            notificationService.showBlockedTaskReminder(item.title);
          }
        }

        return {
          ...item,
          ...updates,
          postponedCount,
          updatedAt: timestamp,
          completedAt: updates.status === "completed" ? timestamp : item.completedAt,
          history: itemHistory,
        };
      }
      return item;
    });

    const active = focusSessions.find((s) => !s.completed) || null;

    const updatedState: DbState = {
      user,
      projects,
      items: updatedItems,
      focusSessions,
      timeline: updatedTimeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ items: updatedItems, timeline: updatedTimeline, activeSession: active });
    await storageService.saveDbState(updatedState);
  },

  deleteItem: async (id) => {
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();
    const updatedItems = items.filter((item) => item.id !== id);

    const updatedState: DbState = {
      user,
      projects,
      items: updatedItems,
      focusSessions,
      timeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ items: updatedItems });
    await storageService.saveDbState(updatedState);
  },

  createProject: async (projectData) => {
    const timestamp = new Date().toISOString();
    const projectId = "project-" + Date.now();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();

    const newProject: Project = {
      id: projectId,
      name: projectData.name || "Untitled Project",
      description: projectData.description || "",
      color: projectData.color || "#6366f1",
      symbol: projectData.symbol || "Folder",
      status: "active",
      createdAt: timestamp,
      path: projectData.path || [projectData.name || "Untitled Project"],
      isAiGenerated: !!projectData.isAiGenerated,
    };

    const newTimeline: TimelineEntry = {
      id: "timeline-" + Date.now(),
      projectId,
      type: "log",
      description: `Created Project: '${newProject.name}'`,
      timestamp,
    };

    const updatedProjects = [...projects, newProject];
    const updatedTimeline = [newTimeline, ...timeline];

    const updatedState: DbState = {
      user,
      projects: updatedProjects,
      items,
      focusSessions,
      timeline: updatedTimeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ projects: updatedProjects, timeline: updatedTimeline });
    await storageService.saveDbState(updatedState);
  },

  startFocusSession: async (projectId, taskId, energyLevel) => {
    const timestamp = new Date().toISOString();
    const sessionId = "session-" + Date.now();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();

    // Check if an active session is already running
    if (focusSessions.some((s) => !s.completed)) {
      return;
    }

    const newSession: FocusSession = {
      id: sessionId,
      projectId,
      taskId,
      startTime: timestamp,
      duration: 0,
      deepWorkScore: 5,
      energyLevel: energyLevel || "medium",
      completed: false,
    };

    const targetProj = projects.find((p) => p.id === projectId);
    const targetItem = items.find((i) => i.id === taskId);
    const projName = targetProj?.name || "General focus";

    const attemptLog: TimelineEntry = {
      id: "timeline-" + Date.now(),
      projectId,
      itemId: taskId,
      type: "log",
      description: `△ Attempt: Started deep focus on '${projName}'` + (targetItem ? ` for task: '${targetItem.title}'` : ""),
      timestamp,
    };

    // If task exists, push to task history
    const updatedItems = items.map((item) => {
      if (item.id === taskId) {
        return {
          ...item,
          history: [...(item.history || []), attemptLog],
        };
      }
      return item;
    });

    const updatedSessions = [...focusSessions, newSession];
    const updatedTimeline = [attemptLog, ...timeline];

    const updatedState: DbState = {
      user,
      projects,
      items: updatedItems,
      focusSessions: updatedSessions,
      timeline: updatedTimeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ focusSessions: updatedSessions, timeline: updatedTimeline, activeSession: newSession, items: updatedItems });
    await storageService.saveDbState(updatedState);
  },

  endFocusSession: async (score, notes, energy) => {
    const timestamp = new Date().toISOString();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations, activeSession } = get();

    if (!activeSession) return;

    const startTime = new Date(activeSession.startTime);
    const endTime = new Date();
    const diffMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)));

    const updatedSessions = focusSessions.map((session) => {
      if (session.id === activeSession.id) {
        return {
          ...session,
          endTime: endTime.toISOString(),
          duration: diffMinutes,
          deepWorkScore: Number(score) || 5,
          energyLevel: energy || session.energyLevel,
          notes: notes || "",
          completed: true,
        };
      }
      return session;
    });

    const finishLog: TimelineEntry = {
      id: "timeline-" + Date.now(),
      projectId: activeSession.projectId,
      itemId: activeSession.taskId,
      type: "log",
      description: `Finished Focus Session: Logged ${diffMinutes}m deep work (Score: ${score}/10).`,
      timestamp,
    };

    const updatedItems = items.map((item) => {
      if (item.id === activeSession.taskId) {
        const itemHistory = [...(item.history || [])];
        itemHistory.push(finishLog);
        return {
          ...item,
          actualDuration: (item.actualDuration || 0) + diffMinutes,
          updatedAt: timestamp,
          history: itemHistory,
        };
      }
      return item;
    });

    const updatedTimeline = [finishLog, ...timeline];

    const updatedState: DbState = {
      user,
      projects,
      items: updatedItems,
      focusSessions: updatedSessions,
      timeline: updatedTimeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ focusSessions: updatedSessions, timeline: updatedTimeline, activeSession: null, items: updatedItems });
    await storageService.saveDbState(updatedState);

    // Trigger morning / evening notifications accordingly based on duration
    if (diffMinutes >= 60) {
      notificationService.show("Deep Work Accomplished!", `Incredible! You logged a massive ${diffMinutes} minute focus session.`);
    }
  },

  triggerAutomation: async () => {
    const timestamp = new Date().toISOString();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();

    const actions = [
      "Rollover Overdue Tasks",
      "Prune Unexecuted Ideas",
      "Organize Today's Work Schedule",
      "Sync GitHub Pull Requests",
      "Calendar Event Sync",
    ];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const processedCount = Math.floor(Math.random() * 5) + 1;

    const newLog: AutomationLog = {
      id: "auto-" + Date.now(),
      actionName: randomAction,
      status: "success",
      message: `Triggered automated routine: processed ${processedCount} items.`,
      timestamp,
    };

    const newTimeline: TimelineEntry = {
      id: "timeline-" + Date.now(),
      type: "automation",
      description: `Automated agent executed: [${randomAction}] - ${newLog.message}`,
      timestamp,
    };

    const updatedLogs = [newLog, ...automationLogs];
    const updatedTimeline = [newTimeline, ...timeline];

    const updatedNotifications = [
      {
        id: "notif-" + Date.now(),
        title: "Automation Executed",
        message: `Flow [${randomAction}] executed successfully.`,
        read: false,
        timestamp,
      },
      ...notifications,
    ];

    const updatedState: DbState = {
      user,
      projects,
      items,
      focusSessions,
      timeline: updatedTimeline,
      automationLogs: updatedLogs,
      notifications: updatedNotifications,
      integrations,
    };

    set({ automationLogs: updatedLogs, timeline: updatedTimeline, notifications: updatedNotifications });
    await storageService.saveDbState(updatedState);

    notificationService.show("Automation Triggered", `Flow [${randomAction}] executed successfully.`);
  },

  toggleIntegration: async (id) => {
    const timestamp = new Date().toISOString();
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();

    let updatedLogs = [...automationLogs];
    const updatedIntegrations = integrations.map((int) => {
      if (int.id === id) {
        const nextConnected = !int.connected;
        if (nextConnected) {
          updatedLogs.unshift({
            id: "auto-" + Date.now(),
            actionName: int.name + " Handshake",
            status: "success",
            message: `Successfully connected ${int.name}.`,
            timestamp,
          });
        }
        return {
          ...int,
          connected: nextConnected,
          lastSynced: nextConnected ? timestamp : int.lastSynced,
        };
      }
      return int;
    });

    const updatedState: DbState = {
      user,
      projects,
      items,
      focusSessions,
      timeline,
      automationLogs: updatedLogs,
      notifications,
      integrations: updatedIntegrations,
    };

    set({ integrations: updatedIntegrations, automationLogs: updatedLogs });
    await storageService.saveDbState(updatedState);
  },

  clearNotifications: async () => {
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();
    const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));

    const updatedState: DbState = {
      user,
      projects,
      items,
      focusSessions,
      timeline,
      automationLogs,
      notifications: updatedNotifications,
      integrations,
    };

    set({ notifications: updatedNotifications });
    await storageService.saveDbState(updatedState);
  },

  updateUserGoal: async (updates) => {
    const { user, projects, items, focusSessions, timeline, automationLogs, notifications, integrations } = get();
    const updatedUser = { ...user, ...updates };

    const updatedState: DbState = {
      user: updatedUser,
      projects,
      items,
      focusSessions,
      timeline,
      automationLogs,
      notifications,
      integrations,
    };

    set({ user: updatedUser });
    await storageService.saveDbState(updatedState);
  },
}));
