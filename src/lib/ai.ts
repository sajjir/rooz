import { GoogleGenAI } from "@google/genai";

export interface AiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface AiRequest {
  systemPrompt: string;
  userPrompt: string;
  responseMimeType?: "text/plain" | "application/json";
}

export interface AiResponse {
  text: string;
  raw?: any;
}

export interface AiProvider {
  id: "gemini" | "openai" | "claude" | "localllm";
  name: string;
  generate(request: AiRequest, config?: AiProviderConfig): Promise<AiResponse>;
}

/**
 * Gemini SDK Provider
 */
export class GeminiProvider implements AiProvider {
  id = "gemini" as const;
  name = "Google Gemini";

  async generate(request: AiRequest, config?: AiProviderConfig): Promise<AiResponse> {
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
 * OpenAI Provider (Extensible Stub)
 */
export class OpenAIProvider implements AiProvider {
  id = "openai" as const;
  name = "OpenAI GPT";

  async generate(request: AiRequest, config?: AiProviderConfig): Promise<AiResponse> {
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
 * Anthropic Claude Provider (Extensible Stub)
 */
export class ClaudeProvider implements AiProvider {
  id = "claude" as const;
  name = "Anthropic Claude";

  async generate(request: AiRequest, config?: AiProviderConfig): Promise<AiResponse> {
    const key = config?.apiKey;
    if (!key) {
      throw new Error("Claude API key is required.");
    }
    const model = config?.modelName || "claude-3-5-sonnet-latest";
    const url = config?.baseUrl || "https://api.anthropic.com/v1/messages";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const data = await response.json();
    return {
      text: data.content?.[0]?.text || "",
      raw: data,
    };
  }
}

/**
 * Local LLM Provider (Ollama or llama.cpp compatible)
 */
export class LocalLlmProvider implements AiProvider {
  id = "localllm" as const;
  name = "Local LLM (Ollama)";

  async generate(request: AiRequest, config?: AiProviderConfig): Promise<AiResponse> {
    const url = config?.baseUrl || "http://localhost:11434/api/generate";
    const model = config?.modelName || "llama3";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: `${request.systemPrompt}\n\nUser: ${request.userPrompt}\nAssistant:`,
        stream: false,
        format: request.responseMimeType === "application/json" ? "json" : undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Local LLM error: ${err}`);
    }

    const data = await response.json();
    return {
      text: data.response || "",
      raw: data,
    };
  }
}

// Global registry of available AI providers
export const aiProviders: Record<string, AiProvider> = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  claude: new ClaudeProvider(),
  localllm: new LocalLlmProvider(),
};

export const getAiProvider = (id: string): AiProvider => {
  return aiProviders[id] || aiProviders.gemini;
};
