import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Initialize Gemini SDK lazily to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Default Seed Data
const defaultDb = {
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
    },
    {
      id: "project-2",
      name: "Alpha Landing Page",
      description: "Modern, aesthetic landing page showcasing the product.",
      color: "#10b981", // emerald
      symbol: "Globe",
      status: "active",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "project-3",
      name: "Automation Sandbox",
      description: "Trigger flows, capture webhooks, and sync notifications.",
      color: "#f59e0b", // amber
      symbol: "Zap",
      status: "active",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "project-4",
      name: "AI Reasoning Core",
      description: "Design autonomous loops, context retrievers, and prompt layers.",
      color: "#f43f5e", // rose
      symbol: "Brain",
      status: "active",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
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
      postponedCount: 4, // Repeatedly postponed
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["db", "backend"],
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
      postponedCount: 3, // Repeatedly postponed
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["frontend", "css"],
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
    },
    {
      id: "item-7",
      projectId: "project-1",
      title: "Linear Command Bar Specifications",
      content: "Documentation and keyboard shortcuts patterns for premium workspace builders.",
      type: "knowledge",
      status: "todo",
      priority: "low",
      energy: "low",
      symbol: "BookOpen",
      estimatedDuration: 0,
      actualDuration: 0,
      postponedCount: 0,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["reference", "ui"],
    },
    {
      id: "item-8",
      projectId: "project-1",
      title: "Perform 15m end-of-day mind clear",
      content: "Daily habit: Log remaining tasks, write down ideas, and clear active tabs.",
      type: "habit",
      status: "todo",
      priority: "medium",
      energy: "low",
      symbol: "Activity",
      estimatedDuration: 15,
      actualDuration: 0,
      postponedCount: 0,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["habit", "review"],
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
    {
      id: "session-3",
      projectId: "project-1",
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 4.2 * 60 * 60 * 1000).toISOString(),
      duration: 48,
      deepWorkScore: 4, // Low deep work score
      energyLevel: "low", // Distracted and fatigued
      notes: "Felt very fatigued and distracted. Closed session early due to mental blocks.",
      completed: true,
    },
  ],
  timeline: [
    {
      id: "timeline-1",
      projectId: "project-1",
      itemId: "item-1",
      type: "log",
      description: "Completed task: 'Define API route schema specs'",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "timeline-2",
      projectId: "project-1",
      type: "log",
      description: "Focus session started: 54m on Core Platform Architecture",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "timeline-3",
      projectId: "project-3",
      itemId: "item-4",
      type: "log",
      description: "Completed task: 'Add dynamic timer clock trigger'",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "timeline-4",
      projectId: "project-1",
      type: "automation",
      description: "Triggered Auto-Organizer webhook for incoming tasks.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    {
      id: "auto-2",
      actionName: "EOD Task Rollover",
      status: "success",
      message: "Moved 2 unfinished high-priority tasks to tomorrow's stack.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
  aiAnalyses: [] as any[],
};

// Database read/write helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read database file, using in-memory default", error);
    return defaultDb;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write to database file", error);
  }
}

// REST API Endpoints

// GET entire DB state (or key entities) for client sync
app.get("/api/db", (req, res) => {
  const db = readDb();
  res.json(db);
});

// POST /api/morning-plan - AI / Fallback Morning Planner Engine
app.post("/api/morning-plan", async (req, res) => {
  const locale = req.body.locale || "en";
  const isFa = locale === "fa";
  const db = readDb();
  const aiClient = getGeminiClient();

  const unfinished = db.items.filter((i: any) => i.type === "task" && i.status !== "completed");
  const primaryProject = db.projects.length > 0 ? db.projects[0] : null;

  if (aiClient) {
    try {
      const history = db.focusSessions ? db.focusSessions.slice(-5) : [];
      const prompt = `You are the core Morning Planner AI of a personal Second Brain workspace.
Generate a structured, highly personalized daily focus plan for the user based on their workspace snapshot.

Active primary project: ${JSON.stringify(primaryProject)}
Unfinished tasks: ${JSON.stringify(unfinished)}
Recent focus session history: ${JSON.stringify(history)}
User Goal: ${JSON.stringify(db.user || { dailyGoalMinutes: 90 })}

Respond strictly with a JSON object conforming to this schema (no wrapping, no markdown block quotes, do NOT include \`\`\`json or similar wrappers):
{
  "planTitle": "A short 2-3 word focus mood or title for today",
  "focusProjectName": "Name of the 1 primary project to focus on",
  "highImpactTask": "The most important unfinished task that will have the biggest impact today",
  "morningSession": "The specific task or area to work on during high-energy morning time",
  "afternoonSession": "The specific task or area for the afternoon",
  "eveningReview": "Low-energy tasks or review area",
  "logicalRationale": "A short, motivating 1-2 sentence explanation of WHY this plan was built, mentioning specific tasks, their priorities, energy needs, blocked status (if high postponedCount), or recent history."
}

IMPORTANT: The user's active interface language is ${isFa ? "Persian (Farsi)" : "English"}. You MUST write all the text values of this JSON object (planTitle, focusProjectName, highImpactTask, morningSession, afternoonSession, eveningReview, logicalRationale) in ${isFa ? "Persian (Farsi)" : "English"}.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    } catch (err) {
      console.error("Gemini failed to generate morning plan, falling back", err);
    }
  }

  // Fallback dynamic local generation based on real DB values
  const highImpact = unfinished.length > 0 ? unfinished[0] : null;
  const blockedTask = unfinished.find((i: any) => i.postponedCount >= 3);
  const plan = {
    planTitle: isFa ? "برنامه تمرکز عمیق" : "Deep Work Horizon",
    focusProjectName: primaryProject ? primaryProject.name : (isFa ? "پروژه فعال" : "Active Project Horizon"),
    highImpactTask: highImpact ? highImpact.title : (isFa ? "پاکسازی پیام‌های ورودی" : "Clear inbox items"),
    morningSession: blockedTask 
      ? (isFa ? `رفع مسدودیت از کار: ${blockedTask.title}` : `Solve blocked task: ${blockedTask.title}`)
      : (highImpact ? (isFa ? `تمرکز روی: ${highImpact.title}` : `Focus on: ${highImpact.title}`) : (isFa ? "بررسی کارهای ورودی" : "Audit inbox backlog")),
    afternoonSession: unfinished.length > 1 
      ? (isFa ? `پیگیری وظیفه: ${unfinished[1].title}` : `Pursue task: ${unfinished[1].title}`)
      : (isFa ? "تمرکز روی اهداف میان‌مدت پروژه" : "Focus on mid-term horizon goals"),
    eveningReview: isFa ? "مرور روزانه، ثبت زمان‌های تمرکز عمیق و سازماندهی مجدد وظایف" : "Daily review, logging deep focus sprints, and rescheduling deferred items",
    logicalRationale: isFa
      ? `امروز تمرکز روی پروژه «${primaryProject ? primaryProject.name : "اصلی"}» خواهد بود. ${blockedTask ? `کار «${blockedTask.title}» به تعویق افتاده و مسدود است، توصیه می‌شود صبح اول به آن بپردازید.` : "کار روی وظایف با اولویت بالا بهترین مسیر پیش روی شماست."}`
      : `Today's horizon highlights "${primaryProject ? primaryProject.name : "your main project"}". ${blockedTask ? `Since "${blockedTask.title}" has been postponed, solving this blocker is prioritized for your AM block.` : "Structuring your active task stack will keep your cognitive load minimal."}`
  };

  res.json(plan);
});

// Update daily user goals
app.put("/api/user", (req, res) => {
  const db = readDb();
  db.user = { ...db.user, ...req.body };
  writeDb(db);
  res.json(db.user);
});

// PROJECTS CRUD
app.get("/api/projects", (req, res) => {
  const db = readDb();
  res.json(db.projects);
});

app.post("/api/projects", (req, res) => {
  const db = readDb();
  const newProject = {
    id: "project-" + Date.now(),
    name: req.body.name || "Untitled Project",
    description: req.body.description || "",
    color: req.body.color || "#6366f1",
    symbol: req.body.symbol || "Folder",
    status: req.body.status || "active",
    createdAt: new Date().toISOString(),
  };
  db.projects.push(newProject);
  
  // Create timeline entry for project creation
  db.timeline.unshift({
    id: "timeline-" + Date.now(),
    projectId: newProject.id,
    type: "log",
    description: `Created new project: '${newProject.name}'`,
    timestamp: new Date().toISOString(),
  });

  writeDb(db);
  res.status(201).json(newProject);
});

app.put("/api/projects/:id", (req, res) => {
  const db = readDb();
  const index = db.projects.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.projects[index] = { ...db.projects[index], ...req.body };
    writeDb(db);
    res.json(db.projects[index]);
  } else {
    res.status(404).json({ error: "Project not found" });
  }
});

app.delete("/api/projects/:id", (req, res) => {
  const db = readDb();
  db.projects = db.projects.filter((p: any) => p.id !== req.params.id);
  // Optional: archive associated items
  db.items = db.items.map((item: any) => {
    if (item.projectId === req.params.id && item.type === "task") {
      return { ...item, status: "abandoned" };
    }
    return item;
  });
  writeDb(db);
  res.json({ success: true });
});

// ITEMS CRUD (Tasks, Ideas, Bookmarks, Habits, Knowledge)
app.get("/api/items", (req, res) => {
  const db = readDb();
  res.json(db.items);
});

app.post("/api/items", (req, res) => {
  const db = readDb();
  const newItem = {
    id: "item-" + Date.now(),
    projectId: req.body.projectId || db.projects[0]?.id || "",
    title: req.body.title || "New Item",
    content: req.body.content || "",
    type: req.body.type || "task",
    status: req.body.status || "todo",
    priority: req.body.priority || "medium",
    energy: req.body.energy || "medium",
    symbol: req.body.symbol || "FileText",
    estimatedDuration: Number(req.body.estimatedDuration) || 0,
    actualDuration: 0,
    postponedCount: 0,
    dueDate: req.body.dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: req.body.tags || [],
  };
  db.items.push(newItem);

  // Add to timeline
  db.timeline.unshift({
    id: "timeline-" + Date.now(),
    projectId: newItem.projectId,
    itemId: newItem.id,
    type: "log",
    description: `Added ${newItem.type}: '${newItem.title}'`,
    timestamp: new Date().toISOString(),
  });

  writeDb(db);
  res.status(201).json(newItem);
});

app.put("/api/items/:id", (req, res) => {
  const db = readDb();
  const index = db.items.findIndex((item: any) => item.id === req.params.id);
  if (index !== -1) {
    const oldItem = db.items[index];
    const updated = {
      ...oldItem,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    // Log completion or postponements
    if (updated.status === "completed" && oldItem.status !== "completed") {
      updated.completedAt = new Date().toISOString();
      db.timeline.unshift({
        id: "timeline-" + Date.now(),
        projectId: updated.projectId,
        itemId: updated.id,
        type: "log",
        description: `Completed task: '${updated.title}'`,
        timestamp: new Date().toISOString(),
      });
    } else if (updated.status === "postponed" && oldItem.status !== "postponed") {
      updated.postponedCount = (oldItem.postponedCount || 0) + 1;
      db.timeline.unshift({
        id: "timeline-" + Date.now(),
        projectId: updated.projectId,
        itemId: updated.id,
        type: "log",
        description: `Postponed: '${updated.title}' (Total: ${updated.postponedCount} times)`,
        timestamp: new Date().toISOString(),
      });
    }

    db.items[index] = updated;
    writeDb(db);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

app.delete("/api/items/:id", (req, res) => {
  const db = readDb();
  db.items = db.items.filter((item: any) => item.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// FOCUS SESSIONS API
app.get("/api/focus", (req, res) => {
  const db = readDb();
  res.json(db.focusSessions);
});

app.post("/api/focus/start", (req, res) => {
  const db = readDb();
  const activeSession = db.focusSessions.find((s: any) => !s.completed);
  if (activeSession) {
    return res.status(400).json({ error: "An active focus session is already running." });
  }

  const newSession = {
    id: "session-" + Date.now(),
    projectId: req.body.projectId,
    taskId: req.body.taskId,
    startTime: new Date().toISOString(),
    duration: 0,
    deepWorkScore: 5,
    energyLevel: req.body.energyLevel || "medium",
    notes: "",
    completed: false,
  };

  db.focusSessions.push(newSession);

  const projName = db.projects.find((p: any) => p.id === req.body.projectId)?.name || "General focus";
  db.timeline.unshift({
    id: "timeline-" + Date.now(),
    projectId: req.body.projectId,
    type: "log",
    description: `Started Deep Work Focus Session on: ${projName}`,
    timestamp: new Date().toISOString(),
  });

  writeDb(db);
  res.status(201).json(newSession);
});

app.post("/api/focus/end", (req, res) => {
  const db = readDb();
  const sessionIndex = db.focusSessions.findIndex((s: any) => !s.completed);
  if (sessionIndex === -1) {
    return res.status(400).json({ error: "No active focus session found." });
  }

  const session = db.focusSessions[sessionIndex];
  const endTime = new Date();
  const startTime = new Date(session.startTime);
  const diffMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)));

  const completedSession = {
    ...session,
    endTime: endTime.toISOString(),
    duration: diffMinutes,
    deepWorkScore: Number(req.body.deepWorkScore) || 5,
    energyLevel: req.body.energyLevel || session.energyLevel,
    notes: req.body.notes || "",
    completed: true,
  };

  db.focusSessions[sessionIndex] = completedSession;

  // Add timeline event
  db.timeline.unshift({
    id: "timeline-" + Date.now(),
    projectId: session.projectId,
    type: "log",
    description: `Finished Deep Work session: logged ${diffMinutes} focused minutes (Deep Work Score: ${completedSession.deepWorkScore}/10).`,
    timestamp: new Date().toISOString(),
  });

  // If there's an associated task, add actual duration
  if (session.taskId) {
    const itemIndex = db.items.findIndex((item: any) => item.id === session.taskId);
    if (itemIndex !== -1) {
      db.items[itemIndex].actualDuration = (db.items[itemIndex].actualDuration || 0) + diffMinutes;
      db.items[itemIndex].updatedAt = new Date().toISOString();
    }
  }

  writeDb(db);
  res.json(completedSession);
});

// TIMELINE API
app.get("/api/timeline", (req, res) => {
  const db = readDb();
  res.json(db.timeline);
});

// NOTIFICATIONS & INTEGRATIONS
app.get("/api/notifications", (req, res) => {
  const db = readDb();
  res.json(db.notifications);
});

app.post("/api/notifications/read", (req, res) => {
  const db = readDb();
  db.notifications = db.notifications.map((n: any) => ({ ...n, read: true }));
  writeDb(db);
  res.json(db.notifications);
});

app.get("/api/integrations", (req, res) => {
  const db = readDb();
  res.json(db.integrations);
});

app.post("/api/integrations/toggle/:id", (req, res) => {
  const db = readDb();
  const idx = db.integrations.findIndex((i: any) => i.id === req.params.id);
  if (idx !== -1) {
    db.integrations[idx].connected = !db.integrations[idx].connected;
    if (db.integrations[idx].connected) {
      db.integrations[idx].lastSynced = new Date().toISOString();
      // Generate integration log
      db.automationLogs.unshift({
        id: "auto-" + Date.now(),
        actionName: db.integrations[idx].name + " Handshake",
        status: "success",
        message: `Successfully established communication link with ${db.integrations[idx].name}.`,
        timestamp: new Date().toISOString(),
      });
    }
    writeDb(db);
    res.json(db.integrations[idx]);
  } else {
    res.status(404).json({ error: "Integration not found" });
  }
});

// AUTOMATION WEBHOOK SIMULATOR / EXECUTION
app.post("/api/automation/trigger", (req, res) => {
  const db = readDb();
  const actions = [
    "Rollover Overdue Tasks",
    "Prune Unexecuted Ideas",
    "Organize Today's Work Schedule",
    "Sync GitHub Pull Requests",
    "Calendar Event Sync",
  ];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];

  // Create automation log
  const newLog = {
    id: "auto-" + Date.now(),
    actionName: randomAction,
    status: "success" as const,
    message: `Triggered automated routine successfully: processed ${Math.floor(Math.random() * 5) + 1} entities.`,
    timestamp: new Date().toISOString(),
  };

  db.automationLogs.unshift(newLog);

  // Post timeline entry
  db.timeline.unshift({
    id: "timeline-" + Date.now(),
    type: "automation",
    description: `Automated agent executed: [${randomAction}] - ${newLog.message}`,
    timestamp: new Date().toISOString(),
  });

  // Create notification
  db.notifications.unshift({
    id: "notif-" + Date.now(),
    title: `Automation Executed`,
    message: `Flow [${randomAction}] executed successfully. Click to review detailed logs.`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  writeDb(db);
  res.json({ log: newLog, timeline: db.timeline[0] });
});

// AI INSIGHTS ENDPOINT (using @google/genai on the server)
app.post("/api/ai/insights", async (req, res) => {
  const db = readDb();
  const aiClient = getGeminiClient();
  const locale = req.body.locale || "en";

  if (!aiClient) {
    // Elegant fallback if API key is not configured or is placeholder
    const mockAnalysis = locale === "fa" ? {
      id: "ai-" + Date.now(),
      timestamp: new Date().toISOString(),
      insightsText: `### 🧠 گزارش تشخیصی شناختی (حالت نمایشی)

شما در حال حاضر در حالت نمایشی کار می‌کنید زیرا کلید **GEMINI_API_KEY** پیکربندی نشده است. برای فعال کردن ردیابی شناختی هوشمند زنده، لطفاً کلید API خود را در بخش **تنظیمات > رازها** در منوی بالای صفحه وارد کنید.

#### 📊 شاخص‌های فعلی و ممیزی فضای کار:
*   **آستانه به تعویق انداختن**: ما **۲ وظیفه** را پیدا کردیم که مکرراً به تعویق افتاده‌اند. کار باقی‌مانده آداپتور (*پیکربندی آداپتور پایگاه داده Express*) تاکنون **۴ بار مجزا** به تعویق افتاده است که نشان‌دهنده وجود اصطکاک بالقوه در تعریف دقیق کارهای فنی است.
*   **پروژه‌های رها شده**: پروژه‌هایی با کارهای معوقه معلق که در ۷ روز گذشته هیچ زمان تمرکزی برایشان ثبت نشده است. پروژه *هسته استدلال هوش مصنوعی* فاقد هرگونه کار تکمیل‌شده و فاقد زمان تمرکز فعال است.
*   **مجموعه ایده‌های اجرا نشده**: شما در حال حاضر **۲ ایده فعال** دارید که به صورت راکد باقی مانده‌اند.
*   **امتیاز تمرکز عمیق**: بر اساس بازه‌ها و کیفیت تمرکز ثبت‌شده، امتیاز شما **۷.۳ از ۱۰** است. شما در حال ایجاد چرخه‌های تمرکز خوبی هستید اما مدیریت نوسانات انرژی جای بهبود دارد.
*   **شاخص ریسک خستگی مفرط**: **متوسط**. آخرین جلسه تمرکز ثبت‌شده شما در روز گذشته نشان‌دهنده خستگی شناختی و خروج زودهنگام است. حتماً از بازه‌های طلایی تمرکز عمیق خود محافظت کنید!`,
      deepWorkScore: 7.3,
      burnoutRisk: "medium" as const,
      completionRate: 40,
      postponedRatio: 25,
      trends: [
        "به تعویق انداختن مداوم فرآیند پیاده‌سازی آداپتور پایگاه داده",
        "تجمع و رکود بالا در بخش ایده‌های معلق در جعبه شنی",
        "افت شدید سطح انرژی در جلسات کاری اواخر بعد از ظهر"
      ],
      suggestions: [
        "کار بزرگ پیاده‌سازی آداپتور Express را به ۳ کار فرعی، ملموس و ۲۰ دقیقه‌ای تفکیک کنید.",
        "فردا ۳۰ دقیقه اول زمان کاری خود را منحصراً به پیشبرد ایده 'پرس‌وجوهای خود-ترمیم‌شونده پایگاه‌داده تحت هوش مصنوعی' اختصاص دهید.",
        "برای مقابله با فرسودگی ذهنی، جلسات کاری تمرکز عمیق خود را پس از ساعت ۱۶:۰۰ محدود کنید."
      ]
    } : {
      id: "ai-" + Date.now(),
      timestamp: new Date().toISOString(),
      insightsText: `### 🧠 Cognitive Diagnostics Report (DEMO MODE)

You are running in Demo Mode because the **GEMINI_API_KEY** is not configured. Please supply your API key in **Settings > Secrets** in the top menu to enable live cognitive tracking.

#### 📊 Current Metrics & Workspace Audit:
*   **Postponement Threshold**: We found **2 tasks** repeatedly delayed. Outstanding adapter work (*Configure Express database adapter*) has been deferred **4 separate times**, signaling potential friction in task definition.
*   **Abandoned Projects**: Projects with pending backlogs but no active focus minutes are flagged. *AI Reasoning Core* has no completed tasks and zero focus time logged in the last 7 days.
*   **Unexecuted Idea Pool**: You have **2 active ideas** sitting stagnant.
*   **Deep Work Score**: Based on focus durations and scores, your score is **7.3/10**. You are building strong focus loops, but energy management can be improved.
*   **Burnout Risk Indicator**: **Moderate**. Your focus session logged yesterday (*session-3*) indicates fatigue and a premature exit. Guard your deep work windows!`,
      deepWorkScore: 7.3,
      burnoutRisk: "medium" as const,
      completionRate: 40,
      postponedRatio: 25,
      trends: ["Frequent deferral of Database adapters", "High idea backlog stagnation", "Afternoon session energy dips"],
      suggestions: [
        "Slice the Express adapter task into 3 distinct, smaller 20-minute tasks.",
        "Dedicate the first 30 minutes of tomorrow's focus block strictly to flushing out 'AI-driven self-healing database queries'.",
        "Set strict limits on focus blocks after 4 PM to combat cognitive exhaustion.",
      ],
    };
    db.aiAnalyses.unshift(mockAnalysis);
    writeDb(db);
    return res.json(mockAnalysis);
  }

  try {
    // Generate actual Gemini analysis based on data
    const activeTasks = db.items.filter((i: any) => i.type === "task" && i.status !== "completed");
    const completedTasks = db.items.filter((i: any) => i.type === "task" && i.status === "completed");
    const postponedTasks = db.items.filter((i: any) => i.type === "task" && (i.postponedCount || 0) > 1);
    const ideas = db.items.filter((i: any) => i.type === "idea");
    const focus = db.focusSessions;

    const dataSnapshot = {
      user: db.user,
      activeProjectsCount: db.projects.filter((p: any) => p.status === "active").length,
      tasks: {
        active: activeTasks.map((t: any) => ({ title: t.title, postponedCount: t.postponedCount, priority: t.priority })),
        completed: completedTasks.map((t: any) => ({ title: t.title, actualDuration: t.actualDuration })),
        postponedRepeatedly: postponedTasks.map((t: any) => ({ title: t.title, count: t.postponedCount })),
      },
      ideas: ideas.map((id: any) => ({ title: id.title, ageInDays: Math.round((Date.now() - new Date(id.createdAt).getTime()) / (1000 * 60 * 60 * 24)) })),
      focusSessions: focus.map((f: any) => ({ duration: f.duration, score: f.deepWorkScore, energy: f.energyLevel, notes: f.notes })),
    };

    const prompt = `You are the core cognitive engine of a highly advanced personal Second Brain dashboard. Your task is to analyze the user's workspace performance metrics and output a rigorous diagnostic report.

Here is the JSON snapshot of the user's workspace data:
${JSON.stringify(dataSnapshot, null, 2)}

You MUST analyze the following:
1. Tasks repeatedly postponed (flag tasks postponed > 2 times, explain why they might be stalled due to high friction).
2. Projects abandoned (active projects with backlog but zero focus minutes logged).
3. Ideas never executed (ideas created days ago but never converted).
4. Productivity trends (overall focus consistency).
5. Burnout signals (correlating low energy levels, short durations, or low deep work scores in focus sessions).
6. Deep Work score (an overall focus effectiveness metric on a 1-10 scale).
7. Completion rate (completed tasks vs total tasks).
8. Postponement ratio (repeatedly postponed tasks vs total active tasks).

IMPORTANT LANGUAGE DIRECTIVE: The user's active interface language is ${locale === "fa" ? "Persian (Farsi)" : "English"}. You MUST write all descriptive/narrative text in ${locale === "fa" ? "Persian (Farsi)" : "English"}, specifically "insightsText", "trends", and "suggestions". Address the user (Jamal) directly. Keep the tone highly intelligent, professional, calm, and deeply analytical. For Persian, break it into readable Persian headers such as: خلاصه تشخیصی، تحلیل اصطکاک وظایف، علائم فرسودگی و انرژی، و دستورات شناختی. Keep the numeric values, risk values, and rates as numbers.

You must respond in STRICTOR JSON matching the following schema. Return ONLY valid JSON, do not wrap in markdown boxes (like \`\`\`json).

{
  "insightsText": "Detailed professional Markdown analysis of the workspace diagnostic. Address Jamal specifically. Keep the tone highly intelligent, professional, calm, and deeply analytical. Break it into readable headers.",
  "deepWorkScore": 8.2, // number from 1 to 10
  "burnoutRisk": "low" | "medium" | "high",
  "completionRate": 45, // percentage integer
  "postponedRatio": 22, // percentage integer
  "trends": ["trend string 1", "trend string 2"],
  "suggestions": ["actionable advice 1", "actionable advice 2"]
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    const finalAnalysis = {
      id: "ai-" + Date.now(),
      timestamp: new Date().toISOString(),
      ...parsed,
    };

    db.aiAnalyses.unshift(finalAnalysis);
    writeDb(db);
    res.json(finalAnalysis);
  } catch (error) {
    console.error("Gemini insights generation failed, fallback to mock", error);
    res.status(500).json({ error: "Gemini analysis failed" });
  }
});

// AUTONOMOUS AI AGENT / COMMAND BAR ENDPOINT (performs mutations and summaries!)
app.post("/api/ai/agent", async (req, res) => {
  const db = readDb();
  const query = req.body.query;
  const locale = req.body.locale || "en";
  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  const aiClient = getGeminiClient();

  // Prepare standard fallback if no key exists
  if (!aiClient) {
    // Simulating mutations for Demo Mode
    let summary = "";
    let mockMutations = [] as any[];

    const lower = query.toLowerCase();
    if (lower.includes("reminder") || lower.includes("notify")) {
      mockMutations.push({
        type: "create_notification",
        data: {
          title: locale === "fa" ? "یادآور نماینده هوش مصنوعی" : "AI Agent Reminder",
          message: locale === "fa" 
            ? `یادآور برنامه‌ریزی‌شده: "${query.replace(/remind me to |send reminder |یادآوری کن که |ارسال یادآور /i, "")}"`
            : `Scheduled reminder: "${query.replace(/remind me to |send reminder /i, "")}"`,
        },
      });
      summary = locale === "fa"
        ? `من با موفقیت یک یادآور اعلان بر اساس دستور شما ثبت کردم: "${query}". (حالت نمایشی)`
        : `I have successfully registered a notification reminder based on your instruction: "${query}". (Demo Mode)`;
    } else if (lower.includes("meeting") || lower.includes("schedule") || lower.includes("جلسه") || lower.includes("برنامه")) {
      mockMutations.push({
        type: "create_item",
        data: {
          title: locale === "fa" ? "همگام‌سازی جلسه برنامه‌ریزی شده" : "Scheduled Meeting Sync",
          content: locale === "fa" ? "جلسه برنامه‌ریزی شده خودکار در جدول زمانی ثبت شد." : "Auto-scheduled meeting logged onto timeline.",
          type: "task",
          priority: "medium",
          energy: "low",
          symbol: "Calendar",
          estimatedDuration: 30,
        },
      });
      summary = locale === "fa"
        ? `یک وظیفه همگام‌سازی جلسه ۳۰ دقیقه‌ای در فضای کاری شما ثبت شد. (حالت نمایشی)`
        : `Logged a 30m meeting sync task into your workspace items. (Demo Mode)`;
    } else if (lower.includes("break project") || lower.includes("break down") || lower.includes("tasks") || lower.includes("تقسیم") || lower.includes("شکستن")) {
      // Create some default tasks
      if (locale === "fa") {
        mockMutations.push({
          type: "create_item",
          data: { title: "راه‌اندازی داکرفایل توسعه", type: "task", priority: "high", energy: "high", symbol: "Cpu" },
        });
        mockMutations.push({
          type: "create_item",
          data: { title: "طراحی مدل‌های نقشه‌برداری پایگاه داده", type: "task", priority: "medium", energy: "medium", symbol: "Database" },
        });
        mockMutations.push({
          type: "create_item",
          data: { title: "نوشتن تست‌های واحد برای بخش احراز هویت", type: "task", priority: "low", energy: "low", symbol: "CheckCircle" },
        });
        summary = `محدوده پروژه را بررسی کردم و آن را به ۳ وظیفه هدفمند با وضوح بالا تقسیم کردم: راه‌اندازی داکر، نقشه‌برداری طرحواره و تست‌های احراز هویت. (حالت نمایشی)`;
      } else {
        mockMutations.push({
          type: "create_item",
          data: { title: "Set up development dockerfile", type: "task", priority: "high", energy: "high", symbol: "Cpu" },
        });
        mockMutations.push({
          type: "create_item",
          data: { title: "Draft schema mapping models", type: "task", priority: "medium", energy: "medium", symbol: "Database" },
        });
        mockMutations.push({
          type: "create_item",
          data: { title: "Write unit tests for authentication", type: "task", priority: "low", energy: "low", symbol: "CheckCircle" },
        });
        summary = `Analyzed the project scope and decomposed it into 3 targeted, high-clarity tasks: Dockerfile setup, schema mappings, and authentication unit testing. (Demo Mode)`;
      }
    } else if (lower.includes("convert") || lower.includes("idea") || lower.includes("تبدیل") || lower.includes("ایده")) {
      // Find an idea to convert
      const idea = db.items.find((i: any) => i.type === "idea");
      if (idea) {
        mockMutations.push({
          type: "create_project",
          data: {
            name: idea.title,
            description: locale === "fa" ? `پروژه ایجاد شده از ایده: "${idea.content}"` : `Project evolved from idea: "${idea.content}"`,
            color: "#f43f5e",
            symbol: "Brain",
          },
        });
        mockMutations.push({
          type: "update_item",
          id: idea.id,
          updates: { status: "completed" }, // mark the original idea as processed
        });
        summary = locale === "fa"
          ? `ایده اجرا نشده شما با عنوان "${idea.title}" را پیدا کردم، آن را به یک پروژه کامل تبدیل کردم و ایده اصلی را بایگانی کردم. (حالت نمایشی)`
          : `Located your unexecuted idea "${idea.title}", successfully evolved it into a full Project, and archived the original idea. (Demo Mode)`;
      } else {
        summary = locale === "fa"
          ? `هیچ ایده اجرا نشده‌ای برای تبدیل یافت نشد. لطفاً ابتدا یک ایده جدید در تب کارهای معوقه اضافه کنید! (حالت نمایشی)`
          : `No unexecuted ideas found to convert. Please add a new Idea in the Items tab first! (Demo Mode)`;
      }
    } else {
      // General task creation fallback
      mockMutations.push({
        type: "create_item",
        data: {
          title: query.length > 50 ? query.substring(0, 47) + "..." : query,
          content: locale === "fa" ? `ایجاد شده به طور خودکار از طریق دستور نماینده: "${query}"` : `Created autonomously via Agent command: "${query}"`,
          type: "task",
          priority: "medium",
          energy: "medium",
          symbol: "Zap",
          estimatedDuration: 45,
        },
      });
      summary = locale === "fa"
        ? `دستور پردازش شد: "${query}". یک وظیفه به‌طور خودکار ایجاد شد. (برای فعال‌سازی فرامین هوشمند واقعی، کلید GEMINI_API_KEY خود را در تنظیمات وارد کنید)`
        : `Processed command: "${query}". Created a task item autonomously. (Demo Mode - Setup your GEMINI_API_KEY for fully intelligent mutations)`;
    }

    // Execute mock mutations
    executeMutations(db, mockMutations);
    writeDb(db);
    return res.json({ summary, mutations: mockMutations });
  }

  try {
    // Smart autonomous agent with Gemini
    const snapshot = {
      projects: db.projects,
      items: db.items.map((i: any) => ({ id: i.id, projectId: i.projectId, title: i.title, type: i.type, status: i.status })),
      notifications: db.notifications,
    };

    const systemPrompt = `You are an elite, fully autonomous AI Agent operating at the core of a next-generation personal Second Brain.
Your role is to translate natural language commands into structured database mutations to alter the system state, and return a crisp explanation.

Current database snapshot:
${JSON.stringify(snapshot, null, 2)}

The user has given this command: "${query}"

You can return mutations of the following types:
1. create_project: { name, description, color, symbol }
2. create_item: { projectId, title, content, type ('task' | 'idea' | 'bookmark' | 'habit' | 'knowledge'), priority, energy, symbol, estimatedDuration, tags }
3. update_item: { id, updates: { status, priority, energy, postponedCount, projectId } }
4. create_notification: { title, message }
5. create_timeline: { projectId, type ('log' | 'event' | 'automation'), description }

Guidelines:
- "Break project into tasks": Generate 3 to 4 specific, highly logical tasks to execute that project. Associate them with the project's ID.
- "Convert idea into project": Find the most relevant idea in the items snapshot. Create a project using the idea title. Then create 2 supporting tasks for that new project, and update the original idea's status to 'completed' so it's archived.
- "Prepare today's work" or "Organize week": Reprioritize tasks, set high priority for urgent items, or reschedule postponed items.
- "Summarize today's work": Return zero mutations but provide a great summary of what was completed based on items or focus sessions.
- "Send reminder": Create a notification with a beautiful message.
- If the command is unclear, perform a safe default action like creating a task, notification, or timeline log. DO NOT ask questions. Simply take action.

IMPORTANT LANGUAGE DIRECTIVE: The user's active interface language is ${locale === "fa" ? "Persian (Farsi)" : "English"}. You MUST write the "summary" explanation, as well as any new project/item names, descriptions, and notifications created, in ${locale === "fa" ? "Persian (Farsi)" : "English"}. Ensure the JSON formatting remains perfect.

You MUST respond strictly with JSON conforming to this schema:
{
  "summary": "Clear, professional, and confident explanation of exactly what actions were taken autonomously.",
  "mutations": [
    {
      "type": "create_project" | "create_item" | "update_item" | "create_notification" | "create_timeline",
      "id": "item-id-for-updates" (only needed for update_item),
      "data": { ...properties... } (for creates),
      "updates": { ...properties... } (for updates)
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    executeMutations(db, parsed.mutations || []);
    writeDb(db);

    res.json({
      summary: parsed.summary,
      mutations: parsed.mutations || [],
    });
  } catch (error) {
    console.error("AI Agent execution error", error);
    res.status(500).json({ error: "AI Agent failed to execute command" });
  }
});

// Mutation Executor Helper
function executeMutations(db: any, mutations: any[]) {
  const timestamp = new Date().toISOString();
  mutations.forEach((m: any) => {
    try {
      if (m.type === "create_project") {
        const id = "project-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        db.projects.push({
          id,
          name: m.data.name || "New Autonomous Project",
          description: m.data.description || "",
          color: m.data.color || "#a855f7",
          symbol: m.data.symbol || "Brain",
          status: "active",
          createdAt: timestamp,
        });
        db.timeline.unshift({
          id: "timeline-" + Date.now(),
          projectId: id,
          type: "log",
          description: `AI Agent: Created project '${m.data.name}'`,
          timestamp,
        });
      } else if (m.type === "create_item") {
        const id = "item-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        const projectId = m.data.projectId || db.projects[0]?.id || "";
        db.items.push({
          id,
          projectId,
          title: m.data.title || "Autonomous Task",
          content: m.data.content || "",
          type: m.data.type || "task",
          status: "todo",
          priority: m.data.priority || "medium",
          energy: m.data.energy || "medium",
          symbol: m.data.symbol || "Zap",
          estimatedDuration: m.data.estimatedDuration || 30,
          actualDuration: 0,
          postponedCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          tags: m.data.tags || ["autonomous"],
        });
        db.timeline.unshift({
          id: "timeline-" + Date.now(),
          projectId,
          itemId: id,
          type: "log",
          description: `AI Agent: Created item '${m.data.title}'`,
          timestamp,
        });
      } else if (m.type === "update_item" && m.id) {
        const index = db.items.findIndex((item: any) => item.id === m.id);
        if (index !== -1) {
          db.items[index] = {
            ...db.items[index],
            ...m.updates,
            updatedAt: timestamp,
          };
          db.timeline.unshift({
            id: "timeline-" + Date.now(),
            projectId: db.items[index].projectId,
            itemId: m.id,
            type: "log",
            description: `AI Agent: Updated item '${db.items[index].title}'`,
            timestamp,
          });
        }
      } else if (m.type === "create_notification") {
        db.notifications.unshift({
          id: "notif-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          title: m.data.title || "Agent Alert",
          message: m.data.message || "",
          read: false,
          timestamp,
        });
      } else if (m.type === "create_timeline") {
        db.timeline.unshift({
          id: "timeline-" + Date.now(),
          projectId: m.data.projectId,
          type: m.data.type || "log",
          description: m.data.description,
          timestamp,
        });
      }
    } catch (err) {
      console.error("Error executing mutation:", m, err);
    }
  });
}

// Vite integration & Production assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist-web");
    app.use(express.static(distPath));
    // Support client-side routing fallback in production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Second Brain Focus Dashboard server running on port ${PORT}`);
  });
}

startServer();
