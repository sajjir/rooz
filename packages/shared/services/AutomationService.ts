export interface AutomationPayload {
  eventName: string;
  itemId?: string;
  itemTitle?: string;
  itemType?: string;
  timestamp: string;
  payload?: any;
}

export interface AutomationProvider {
  id: "n8n" | "zapier" | "make" | "custom";
  name: string;
  triggerEvent(payload: AutomationPayload, config?: any): Promise<boolean>;
}

export class N8nAutomationProvider implements AutomationProvider {
  id = "n8n" as const;
  name = "n8n.io Webhook";

  async triggerEvent(payload: AutomationPayload, config?: { webhookUrl?: string }): Promise<boolean> {
    const url = config?.webhookUrl;
    if (!url) {
      console.log("[N8nAutomation] Not triggered: Webhook URL is missing.");
      return false;
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (err) {
      console.error("[N8nAutomation] Webhook connection failure", err);
      return false;
    }
  }
}

export class ZapierAutomationProvider implements AutomationProvider {
  id = "zapier" as const;
  name = "Zapier webhook";

  async triggerEvent(payload: AutomationPayload, config?: { webhookUrl?: string }): Promise<boolean> {
    const url = config?.webhookUrl;
    if (!url) {
      console.log("[ZapierAutomation] Not triggered: Zapier Webhook URL is missing.");
      return false;
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (err) {
      console.error("[ZapierAutomation] connection failure", err);
      return false;
    }
  }
}

export class MakeAutomationProvider implements AutomationProvider {
  id = "make" as const;
  name = "Make (Integromat) webhook";

  async triggerEvent(payload: AutomationPayload, config?: { webhookUrl?: string }): Promise<boolean> {
    const url = config?.webhookUrl;
    if (!url) {
      console.log("[MakeAutomation] Not triggered: Make Webhook URL is missing.");
      return false;
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (err) {
      console.error("[MakeAutomation] connection failure", err);
      return false;
    }
  }
}

export class CustomAutomationProvider implements AutomationProvider {
  id = "custom" as const;
  name = "Custom Flow Engine";

  async triggerEvent(payload: AutomationPayload): Promise<boolean> {
    console.log("[CustomAutomationProvider] Running autonomous custom action runner on:", payload.eventName);
    return true;
  }
}

export class AutomationService {
  private providers: Record<string, AutomationProvider> = {
    n8n: new N8nAutomationProvider(),
    zapier: new ZapierAutomationProvider(),
    make: new MakeAutomationProvider(),
    custom: new CustomAutomationProvider(),
  };

  private activeProviderId: string = "custom";

  setActiveProvider(providerId: string) {
    if (this.providers[providerId]) {
      this.activeProviderId = providerId;
    }
  }

  getProvider(providerId?: string): AutomationProvider {
    return this.providers[providerId || this.activeProviderId] || this.providers.custom;
  }

  async trigger(payload: AutomationPayload, config?: any): Promise<boolean> {
    const provider = this.getProvider();
    return provider.triggerEvent(payload, config);
  }
}

export const automationService = new AutomationService();
