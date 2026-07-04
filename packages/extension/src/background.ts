// Chrome Extension Background Service Worker (Manifest V3)

import { DbState } from "../../shared/types";

// Decoupled Background Services Definitions

/**
 * 1. Notification Manager
 */
class NotificationManager {
  static show(title: string, message: string, notificationId?: string) {
    if (typeof chrome !== "undefined" && chrome.notifications) {
      chrome.notifications.create(notificationId || "brain-notif-" + Date.now(), {
        type: "basic",
        iconUrl: "assets/icon128.png",
        title: title,
        message: message,
        priority: 1,
      });
    } else {
      console.log(`[Notification Mock] ${title}: ${message}`);
    }
  }
}

/**
 * 2. Google Calendar Synchronization Service Interface
 */
export interface CalendarSyncConfig {
  clientId: string;
  scopes: string[];
}

export class GoogleCalendarSync {
  async syncEvents(): Promise<number> {
    console.log("[CalendarSync] Fetching Google Calendar events...");
    return Math.floor(Math.random() * 3) + 1; // Return mock count of synchronized events
  }
}

/**
 * 3. n8n and Webhook Automation Connector
 */
export interface WebhookConfig {
  n8nWebhookUrl?: string;
  triggerOnTaskCreated: boolean;
  triggerOnTaskCompleted: boolean;
}

export class AutomationWebhookEngine {
  private config: WebhookConfig = {
    triggerOnTaskCreated: true,
    triggerOnTaskCompleted: true,
  };

  async dispatchEvent(event: string, payload: any): Promise<boolean> {
    console.log(`[AutomationEngine] Dispatching event [${event}] with payload:`, payload);
    if (!this.config.n8nWebhookUrl) {
      return false;
    }
    try {
      const response = await fetch(this.config.n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      });
      return response.ok;
    } catch (err) {
      console.error("[AutomationEngine] Webhook connection failure", err);
      return false;
    }
  }
}

/**
 * 4. Future Autonomous AI Agent background processor
 */
export class BackgroundAiAgent {
  async analyzeStaleTasks(tasks: any[]): Promise<string[]> {
    console.log("[AiAgent] Analyzing stagnant task backlog for productivity trends...");
    return [];
  }

  async organizeWeek(tasks: any[]): Promise<any[]> {
    console.log("[AiAgent] Running autonomous weekly planning loop...");
    return [];
  }
}

// Instantiate Background Services
const calendarService = new GoogleCalendarSync();
const webhookEngine = new AutomationWebhookEngine();
const aiAgent = new BackgroundAiAgent();

// Lifecycle Listeners & Core Extension Configuration

// On Installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[Background] Rooz Daily Operating System Chrome Extension installed successfully!");
    
    // Create initial morning/evening alarm triggers
    setupAlarms();
    
    // Push an initial workspace notification
    NotificationManager.show(
      "Rooz Extension Loaded",
      "Press Alt+Shift+Space for Quick Capture or Ctrl+Shift+B for Workspace Side Panel.",
      "install-success"
    );
  }
});

// Alarm Schedulers for Morning, Evening, and intervals
function setupAlarms() {
  chrome.alarms.clearAll(() => {
    // 1. Morning Planning Reminder (Trigger daily)
    chrome.alarms.create("morning-reminder", {
      delayInMinutes: 1, // Start shortly after install, then repeat daily
      periodInMinutes: 24 * 60, // 24 hours
    });

    // 2. Evening Daily Review (Trigger daily)
    chrome.alarms.create("daily-review-reminder", {
      delayInMinutes: 12 * 60, // 12 hours later, then repeat daily
      periodInMinutes: 24 * 60, // 24 hours
    });

    // 3. Automation Interval Loop (Synchronize every 30 minutes)
    chrome.alarms.create("automation-sync-loop", {
      periodInMinutes: 30,
    });
  });
}

// Listen to Alarms and dispatch corresponding system logs and UI actions
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log(`[Background] Alarm fired: ${alarm.name}`);
  const timestamp = new Date().toISOString();

  if (alarm.name === "morning-reminder") {
    NotificationManager.show(
      "Good Morning, Planner!",
      "Review your Inbox, define today's 3 high-impact Deep Work items, and launch a focus session.",
      "morning-alarm"
    );
  } else if (alarm.name === "daily-review-reminder") {
    chrome.storage.local.get(["dbState"], (result) => {
      const db = (result.dbState as DbState) || { items: [], focusSessions: [], projects: [] };
      const items = db.items || [];
      const focusSessions = db.focusSessions || [];
      const projects = db.projects || [];

      const isToday = (dateStr?: string) => {
        if (!dateStr) return false;
        return new Date(dateStr).toDateString() === new Date().toDateString();
      };

      const completedCount = items.filter(i => i.type === "task" && i.status === "completed" && isToday(i.updatedAt)).length;
      const attemptsCount = focusSessions.filter(s => isToday(s.startTime)).length;
      const ideasCount = items.filter(i => i.type === "idea" && isToday(i.createdAt)).length;

      const totalFocusMinutesToday = focusSessions
        .filter(s => s.completed && isToday(s.startTime))
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      const focusHours = (totalFocusMinutesToday / 60).toFixed(1);

      // Identify focus project name if any
      const mainProjectName = projects.length > 0 ? projects[0].name : "your main project";

      const title = "🌙 Evening Review Time";
      const message = `Today Completed ${completedCount}, Attempts ${attemptsCount}, Ideas ${ideasCount}. Tomorrow Continue ${mainProjectName} because you've already invested ${focusHours} hours today.`;

      NotificationManager.show(title, message, "evening-alarm");
    });
  } else if (alarm.name === "automation-sync-loop") {
    try {
      const syncedCount = await calendarService.syncEvents();
      if (syncedCount > 0) {
        chrome.storage.local.get(["dbState"], (result) => {
          if (result.dbState) {
            const db = result.dbState as DbState;
            db.timeline = db.timeline || [];
            db.timeline.unshift({
              id: "timeline-calendar-" + Date.now(),
              type: "automation",
              description: `Background: Synchronized ${syncedCount} meetings from Google Calendar onto today's workspace.`,
              timestamp,
            });
            chrome.storage.local.set({ dbState: db });
          }
        });
      }
    } catch (err) {
      console.error("[Background] Automated alarm execution error", err);
    }
  }
});

// Keyboard Commands & Shortcut Listeners
chrome.commands.onCommand.addListener((command) => {
  console.log(`[Background] Command shortcut detected: ${command}`);
  
  if (command === "toggle-sidepanel") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.sidePanel.open({ tabId: activeTab.id });
      }
    });
  }
});

// Unified Message Hub: handles cross-extension navigation and task dispatch
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background Message Router] Received message:", message);

  if (message.type === "NAVIGATE_TAB") {
    chrome.runtime.sendMessage(message);
    sendResponse({ status: "dispatched" });
  } else if (message.type === "DB_UPDATED") {
    chrome.runtime.sendMessage(message);
    sendResponse({ status: "synced" });
  }

  return true; // Keep message channel open for asynchronous responses
});

// Configure Side Panel behavior to open on clicking extension icon
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.error("[Background] Failed to configure sidepanel behavior", err);
  });
}
