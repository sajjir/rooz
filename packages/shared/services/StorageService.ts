import { DbState } from "../types";

export interface StorageProvider {
  id: string;
  name: string;
  get(): Promise<any>;
  set(data: any): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  id = "local_storage";
  name = "HTML5 LocalStorage";

  async get(): Promise<any> {
    // Check if there is old data to migrate
    const oldRaw = localStorage.getItem("second_brain_db");
    if (oldRaw) {
      localStorage.setItem("rooz_db", oldRaw);
      localStorage.removeItem("second_brain_db");
      console.log("[StorageMigration] Safely migrated state from second_brain_db to rooz_db");
    }
    const raw = localStorage.getItem("rooz_db");
    return raw ? JSON.parse(raw) : null;
  }

  async set(data: any): Promise<void> {
    localStorage.setItem("rooz_db", JSON.stringify(data));
  }
}

export class ChromeStorageProvider implements StorageProvider {
  id = "chrome_storage";
  name = "Chrome Local Storage";

  async get(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get(["dbState"], (res) => {
          resolve(res.dbState || null);
        });
      } else {
        resolve(null);
      }
    });
  }

  async set(data: any): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ dbState: data }, () => {
          // Notify other contexts of the state update
          chrome.runtime.sendMessage({ type: "DB_UPDATED" });
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export class CloudSyncProvider implements StorageProvider {
  id = "cloud_sync";
  name = "Cloud Synchronizer Engine";

  async get(): Promise<any> {
    console.log("[CloudSync] Pulling state from remote cloud server...");
    // Future Firestore or SQL remote database pull
    return null;
  }

  async set(data: any): Promise<void> {
    console.log("[CloudSync] Pushing synced state to cloud server...", data);
    // Future Firestore or SQL remote database push
  }
}

export class StorageService {
  private providers: Record<string, StorageProvider> = {
    local_storage: new LocalStorageProvider(),
    chrome_storage: new ChromeStorageProvider(),
    cloud_sync: new CloudSyncProvider(),
  };

  private activeProviderId: string = "local_storage";

  constructor() {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      this.activeProviderId = "chrome_storage";
    }
  }

  setActiveProvider(providerId: string) {
    if (this.providers[providerId]) {
      this.activeProviderId = providerId;
    }
  }

  getProvider(): StorageProvider {
    return this.providers[this.activeProviderId] || this.providers.local_storage;
  }

  async getDbState(): Promise<DbState | null> {
    return this.getProvider().get();
  }

  async saveDbState(state: DbState): Promise<void> {
    await this.getProvider().set(state);
  }
}

export const storageService = new StorageService();
