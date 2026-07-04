export type Priority = 'low' | 'medium' | 'high';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type ItemType = 'task' | 'idea' | 'bookmark' | 'habit' | 'knowledge';
export type ItemStatus = 'todo' | 'completed' | 'postponed' | 'abandoned';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dailyGoalMinutes: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  symbol: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  projectId?: string;
  itemId?: string;
  type: 'log' | 'event' | 'automation';
  description: string; // This stores descriptions using the notebook language, e.g. "○ Idea: task created", "△ Attempt: focus session started", etc.
  timestamp: string;
}

export interface Item {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: ItemType;
  status: ItemStatus; // Stored status for fast queries and compatibility
  priority: Priority;
  energy: EnergyLevel;
  symbol: string;
  estimatedDuration: number; // in minutes
  actualDuration: number; // in minutes
  postponedCount: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags: string[];
  history: TimelineEntry[]; // Every task stores its own history of events using the notebook language
}

export interface FocusSession {
  id: string;
  projectId?: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  deepWorkScore: number; // 1 to 10
  energyLevel: EnergyLevel;
  notes?: string;
  completed: boolean;
}

export interface AutomationLog {
  id: string;
  actionName: string;
  status: 'success' | 'failed';
  message: string;
  timestamp: string;
}

export interface AiAnalysis {
  id: string;
  timestamp: string;
  insightsText: string;
  deepWorkScore: number;
  burnoutRisk: 'low' | 'medium' | 'high';
  completionRate: number;
  postponedRatio: number;
  trends: string[];
  suggestions: string[];
}

export interface NotificationEntry {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'google_calendar' | 'github' | 'custom_webhook';
  connected: boolean;
  lastSynced?: string;
}

export interface DbState {
  user: UserProfile;
  projects: Project[];
  items: Item[];
  focusSessions: FocusSession[];
  timeline: TimelineEntry[];
  automationLogs: AutomationLog[];
  notifications: NotificationEntry[];
  integrations: IntegrationConfig[];
}
