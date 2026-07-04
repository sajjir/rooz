import { GoogleGenAI } from "@google/genai";

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  responseMimeType?: "text/plain" | "application/json";
}

export interface AIResponse {
  text: string;
  raw?: any;
}

export interface AIProvider {
  id: "gemini" | "openai" | "mock";
  name: string;
  generate(request: AIRequest, config?: AIProviderConfig): Promise<AIResponse>;
}

/**
 * Gemini Provider
 */
export class GeminiProvider implements AIProvider {
  id = "gemini" as const;
  name = "Google Gemini";

  async generate(request: AIRequest, config?: AIProviderConfig): Promise<AIResponse> {
    const key = config?.apiKey || process.env.GEMINI_API_KEY || (typeof window !== "undefined" ? (window as any).GEMINI_API_KEY : "");
    if (!key) {
      throw new Error("Gemini API key is required but was not provided. Configure it in settings.");
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const model = config?.modelName || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: model,
      contents: request.userPrompt,
      config: {
        systemInstruction: request.systemPrompt,
        responseMimeType: request.responseMimeType || "text/plain",
      },
    });

    return {
      text: response.text || "",
      raw: response,
    };
  }
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider implements AIProvider {
  id = "openai" as const;
  name = "OpenAI GPT";

  async generate(request: AIRequest, config?: AIProviderConfig): Promise<AIResponse> {
    const key = config?.apiKey;
    if (!key) {
      throw new Error("OpenAI API key is required.");
    }
    const model = config?.modelName || "gpt-4o-mini";
    const url = config?.baseUrl || "https://api.openai.com/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        response_format: request.responseMimeType === "application/json" ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || "",
      raw: data,
    };
  }
}

/**
 * Mock Provider
 */
export class MockProvider implements AIProvider {
  id = "mock" as const;
  name = "Mock AI Engine";

  async generate(request: AIRequest): Promise<AIResponse> {
    console.log("[MockAI] Generating completion for prompt:", request.userPrompt);
    return {
      text: `[Mock AI Response for: "${request.userPrompt.substring(0, 30)}..."] Based on productivity trends, setting priority tasks early in the morning yields 35% higher completed minutes of deep work focus. Consider reducing postponed counts.`,
      raw: { mock: true },
    };
  }
}

export class AIService {
  private providers: Record<string, AIProvider> = {
    gemini: new GeminiProvider(),
    openai: new OpenAIProvider(),
    mock: new MockProvider(),
  };

  private activeProviderId: string = "gemini";

  setActiveProvider(providerId: string) {
    if (this.providers[providerId]) {
      this.activeProviderId = providerId;
    }
  }

  getProvider(providerId?: string): AIProvider {
    return this.providers[providerId || this.activeProviderId] || this.providers.gemini;
  }

  async generate(request: AIRequest, config?: AIProviderConfig): Promise<AIResponse> {
    const provider = this.getProvider();
    return provider.generate(request, config);
  }
}

export const aiService = new AIService();
