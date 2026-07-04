export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  projectId?: string;
}

export interface CalendarProvider {
  id: string;
  name: string;
  fetchEvents(config?: any): Promise<CalendarEvent[]>;
}

export class GoogleCalendarProvider implements CalendarProvider {
  id = "google_calendar";
  name = "Google Calendar";

  async fetchEvents(config?: any): Promise<CalendarEvent[]> {
    console.log("[GoogleCalendarProvider] Authenticating and syncing events...");
    // Future oauth / token implementation
    const now = new Date();
    return [
      {
        id: "gcal-1",
        title: "Sprint Planning Session",
        description: "Focus on Core Platform Architecture",
        startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        projectId: "project-1",
      },
      {
        id: "gcal-2",
        title: "Alpha Landing Review",
        description: "Review responsive display panels",
        startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        projectId: "project-2",
      }
    ];
  }
}

export class MockCalendarProvider implements CalendarProvider {
  id = "mock_calendar";
  name = "Mock Calendar";

  async fetchEvents(): Promise<CalendarEvent[]> {
    console.log("[MockCalendarProvider] Fetching dummy events...");
    const now = new Date();
    return [
      {
        id: "mock-cal-1",
        title: "Mock Sync Up meeting",
        description: "Refactoring discussions",
        startTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
      }
    ];
  }
}

export class CalendarService {
  private providers: Record<string, CalendarProvider> = {
    google_calendar: new GoogleCalendarProvider(),
    mock_calendar: new MockCalendarProvider(),
  };

  private activeProviderId: string = "mock_calendar";

  setActiveProvider(id: string) {
    if (this.providers[id]) {
      this.activeProviderId = id;
    }
  }

  getProvider(id?: string): CalendarProvider {
    return this.providers[id || this.activeProviderId] || this.providers.mock_calendar;
  }

  async syncEvents(config?: any): Promise<CalendarEvent[]> {
    const provider = this.getProvider();
    return provider.fetchEvents(config);
  }
}

export const calendarService = new CalendarService();
