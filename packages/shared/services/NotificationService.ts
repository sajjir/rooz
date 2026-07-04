export interface NotificationOptions {
  title: string;
  message: string;
  id?: string;
}

export interface NotificationProvider {
  id: string;
  name: string;
  show(options: NotificationOptions): void;
}

export class ChromeNotificationProvider implements NotificationProvider {
  id = "chrome";
  name = "Chrome System Notification";

  show(options: NotificationOptions): void {
    if (typeof chrome !== "undefined" && chrome.notifications) {
      chrome.notifications.create(options.id || "notif-" + Date.now(), {
        type: "basic",
        iconUrl: "assets/icon128.png",
        title: options.title,
        message: options.message,
        priority: 1,
      });
    } else {
      console.log(`[ChromeNotification Mock] ${options.title}: ${options.message}`);
    }
  }
}

export class WebNotificationProvider implements NotificationProvider {
  id = "web";
  name = "HTML5 Web Browser Notification";

  show(options: NotificationOptions): void {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(options.title, { body: options.message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(options.title, { body: options.message });
          }
        });
      }
    } else {
      console.log(`[HTML5Notification Mock] ${options.title}: ${options.message}`);
    }
  }
}

export class NotificationService {
  private providers: Record<string, NotificationProvider> = {
    chrome: new ChromeNotificationProvider(),
    web: new WebNotificationProvider(),
  };

  private activeProviderId: string = "web";

  constructor() {
    if (typeof chrome !== "undefined" && chrome.notifications) {
      this.activeProviderId = "chrome";
    }
  }

  setActiveProvider(providerId: string) {
    if (this.providers[providerId]) {
      this.activeProviderId = providerId;
    }
  }

  getProvider(): NotificationProvider {
    return this.providers[this.activeProviderId] || this.providers.web;
  }

  show(title: string, message: string, id?: string) {
    this.getProvider().show({ title, message, id });
  }

  // Domain reminders
  showMorningPlanningReminder() {
    this.show(
      "Good Morning, Planner!",
      "Review your Inbox, define today's 3 high-impact Deep Work items, and launch a focus session.",
      "morning-planning"
    );
  }

  showEveningReviewReminder() {
    this.show(
      "Evening Review Time",
      "Reflect on today's Deep Work sessions, clear pending actions, and log lessons onto your timeline.",
      "evening-review"
    );
  }

  showBlockedTaskReminder(taskTitle: string) {
    this.show(
      "Locked Task Detected",
      `The task "${taskTitle}" is marked as Waiting. Check dependencies or resolve blockages.`,
      "blocked-task"
    );
  }

  showIdeaReminder(ideaTitle: string) {
    this.show(
      "Unprocessed Idea Found",
      `Remember your idea: "${ideaTitle}"? Bring it to today's workspace and map a storypath attempt!`,
      "idea-reminder"
    );
  }
}

export const notificationService = new NotificationService();
