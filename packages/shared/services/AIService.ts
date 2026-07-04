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
  id: "gemini" | "openai" | "claude" | "mock";
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
    const key = config?.apiKey || process.env.GEMINI_API_KEY;
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
    const key = config?.apiKey || process.env.OPENAI_API_KEY;
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
 * Anthropic Claude Provider
 */
export class ClaudeProvider implements AIProvider {
  id = "claude" as const;
  name = "Anthropic Claude";

  async generate(request: AIRequest, config?: AIProviderConfig): Promise<AIResponse> {
    const key = config?.apiKey || process.env.CLAUDE_API_KEY;
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
 * Mock Provider
 */
export class MockProvider implements AIProvider {
  id = "mock" as const;
  name = "Mock AI Engine";

  async generate(request: AIRequest): Promise<AIResponse> {
    console.log("[MockAI] Generating completion for prompt:", request.userPrompt);

    // Check if it's for insights, agent, or morning-plan
    const isInsights = 
      request.systemPrompt.includes("diagnostic report") || 
      request.userPrompt.includes("diagnostic report") || 
      request.systemPrompt.includes("Rigorous diagnostic report") ||
      request.userPrompt.includes("Rigorous diagnostic report");

    const isAgent = 
      request.systemPrompt.includes("autonomous AI Agent") || 
      request.systemPrompt.includes("structured database mutations") ||
      request.userPrompt.includes("autonomous AI Agent");

    const isMorningPlan = 
      request.systemPrompt.includes("Morning Planner AI") ||
      request.userPrompt.includes("Morning Planner AI");

    const isFa = 
      request.systemPrompt.includes("Persian") || 
      request.userPrompt.includes("Persian") || 
      request.systemPrompt.includes("Persian (Farsi)") || 
      request.userPrompt.includes("Persian (Farsi)");

    if (isInsights) {
      const mockAnalysis = isFa ? {
        insightsText: `### 🧠 گزارش تشخیصی شناختی (حالت نمایشی)

شما در حال حاضر در حالت نمایشی کار می‌کنید زیرا کلید **GEMINI_API_KEY** پیکربندی نشده است. برای فعال کردن ردیابی شناختی هوشمند زنده، لطفاً کلید API خود را در بخش **تنظیمات > رازها** در منوی بالای صفحه وارد کنید.

#### 📊 شاخص‌های فعلی و ممیزی فضای کار:
*   **آستانه به تعویق انداختن**: ما **۲ وظیفه** را پیدا کردیم که مکرراً به تعویق افتاده‌اند. کار باقی‌مانده آداپتور (*پیکربندی آداپتور پایگاه داده Express*) تاکنون **۴ بار مجزا** به تعویق افتاده است که نشان‌دهنده وجود اصطکاک بالقوه در تعریف دقیق کارهای فنی است.
*   **پروژه‌های رها شده**: پروژه‌هایی با کارهای معوقه معلق که در ۷ روز گذشته هیچ زمان تمرکزی برایشان ثبت نشده است. پروژه *هسته استدلال هوش مصنوعی* فاقد هرگونه کار تکمیل‌شده و فاقد زمان تمرکز فعال است.
*   **مجموعه ایده‌های اجرا نشده**: شما در حال حاضر **۲ ایده فعال** دارید که به صورت راکد باقی مانده‌اند.
*   **امتیاز تمرکز عمیق**: بر اساس بازه‌ها و کیفیت تمرکز ثبت‌شده، امتیاز شما **۷.۳ از ۱۰** است. شما در حال ایجاد چرخه‌های تمرکز خوبی هستید اما مدیریت نوسانات انرژی جای بهبود دارد.
*   **شاخص ریسک خستگی مفرط**: **متوسط**. آخرین جلسه تمرکز ثبت‌شده شما در روز گذشته نشان‌دهنده خستگی شناختی و خروج زودهنگام است. حتماً از بازهای طلایی تمرکز عمیق خود محافظت کنید!`,
        deepWorkScore: 7.3,
        burnoutRisk: "medium",
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
        insightsText: `### 🧠 Cognitive Diagnostics Report (DEMO MODE)

You are running in Demo Mode because the **GEMINI_API_KEY** is not configured. Please supply your API key in **Settings > Secrets** in the top menu to enable live cognitive tracking.

#### 📊 Current Metrics & Workspace Audit:
*   **Postponement Threshold**: We found **2 tasks** repeatedly delayed. Outstanding adapter work (*Configure Express database adapter*) has been deferred **4 separate times**, signaling potential friction in task definition.
*   **Abandoned Projects**: Projects with pending backlogs but no active focus minutes are flagged. *AI Reasoning Core* has no completed tasks and zero focus time logged in the last 7 days.
*   **Unexecuted Idea Pool**: You have **2 active ideas** sitting stagnant.
*   **Deep Work Score**: Based on focus durations and scores, your score is **7.3/10**. You are building strong focus loops, but energy management can be improved.
*   **Burnout Risk Indicator**: **Moderate**. Your focus session logged yesterday (*session-3*) indicates fatigue and a premature exit. Guard your deep work windows!`,
        deepWorkScore: 7.3,
        burnoutRisk: "medium",
        completionRate: 40,
        postponedRatio: 25,
        trends: ["Frequent deferral of Database adapters", "High idea backlog stagnation", "Afternoon session energy dips"],
        suggestions: [
          "Slice the Express adapter task into 3 distinct, smaller 20-minute tasks.",
          "Dedicate the first 30 minutes of tomorrow's focus block strictly to flushing out 'AI-driven self-healing database queries'.",
          "Set strict limits on focus blocks after 4 PM to combat cognitive exhaustion.",
        ],
      };
      return {
        text: JSON.stringify(mockAnalysis),
        raw: { mock: true },
      };
    }

    if (isAgent) {
      // Try to extract query
      let query = "organize work";
      const match = request.systemPrompt.match(/The user has given this command: "([^"]+)"/) || 
                    request.userPrompt.match(/The user has given this command: "([^"]+)"/);
      if (match && match[1]) {
        query = match[1];
      }

      let summary = "";
      let mockMutations = [] as any[];
      const lower = query.toLowerCase();

      if (lower.includes("reminder") || lower.includes("notify")) {
        const cleanReminder = query.replace(/remind me to |send reminder |یادآوری کن که |ارسال یادآور /i, "");
        mockMutations.push({
          type: "create_notification",
          data: {
            title: isFa ? "یادآور نماینده هوش مصنوعی" : "AI Agent Reminder",
            message: isFa 
              ? `یادآور برنامه‌ریزی‌شده: "${cleanReminder}"`
              : `Scheduled reminder: "${cleanReminder}"`,
          },
        });
        summary = isFa
          ? `من با موفقیت یک یادآور اعلان بر اساس دستور شما ثبت کردم: "${query}". (حالت نمایشی)`
          : `I have successfully registered a notification reminder based on your instruction: "${query}". (Demo Mode)`;
      } else if (lower.includes("meeting") || lower.includes("schedule") || lower.includes("جلسه") || lower.includes("برنامه")) {
        mockMutations.push({
          type: "create_item",
          data: {
            title: isFa ? "همگام‌سازی جلسه برنامه‌ریزی شده" : "Scheduled Meeting Sync",
            content: isFa ? "جلسه برنامه‌ریزی شده خودکار در جدول زمانی ثبت شد." : "Auto-scheduled meeting logged onto timeline.",
            type: "task",
            priority: "medium",
            energy: "low",
            symbol: "Calendar",
            estimatedDuration: 30,
          },
        });
        summary = isFa
          ? `یک وظیفه همگام‌سازی جلسه ۳۰ دقیقه‌ای در فضای کاری شما ثبت شد. (حالت نمایشی)`
          : `Logged a 30m meeting sync task into your workspace items. (Demo Mode)`;
      } else if (lower.includes("break project") || lower.includes("break down") || lower.includes("tasks") || lower.includes("تقسیم") || lower.includes("شکستن")) {
        if (isFa) {
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
        mockMutations.push({
          type: "create_project",
          data: {
            name: isFa ? "پروژه تکامل یافته از ایده" : "Evolved Project from Idea",
            description: isFa ? "پروژه‌ای که از ایده توسعه یافته است." : "Project evolved from idea",
            color: "#f43f5e",
            symbol: "Brain",
          },
        });
        summary = isFa
          ? `ایده شما را پیدا کردم، آن را به یک پروژه کامل تبدیل کردم و ایده اصلی را بایگانی کردم. (حالت نمایشی)`
          : `Located your unexecuted idea, successfully evolved it into a full Project, and archived the original idea. (Demo Mode)`;
      } else {
        mockMutations.push({
          type: "create_item",
          data: {
            title: query.length > 50 ? query.substring(0, 47) + "..." : query,
            content: isFa ? `ایجاد شده به طور خودکار از طریق دستور نماینده: "${query}"` : `Created autonomously via Agent command: "${query}"`,
            type: "task",
            priority: "medium",
            energy: "medium",
            symbol: "Zap",
            estimatedDuration: 45,
          },
        });
        summary = isFa
          ? `دستور پردازش شد: "${query}". یک وظیفه به‌طور خودکار ایجاد شد. (برای فعال‌سازی فرامین هوشمند واقعی، کلید GEMINI_API_KEY خود را در تنظیمات وارد کنید)`
          : `Processed command: "${query}". Created a task item autonomously. (Demo Mode - Setup your GEMINI_API_KEY for fully intelligent mutations)`;
      }

      return {
        text: JSON.stringify({ summary, mutations: mockMutations }),
        raw: { mock: true },
      };
    }

    if (isMorningPlan) {
      const plan = {
        planTitle: isFa ? "برنامه تمرکز عمیق" : "Deep Work Horizon",
        focusProjectName: isFa ? "پروژه اصلی" : "Main Horizon Project",
        highImpactTask: isFa ? "پاکسازی پیام‌های ورودی" : "Clear inbox items",
        morningSession: isFa ? "تمرکز روی کار با اولویت بالا" : "Focus on high-priority task",
        afternoonSession: isFa ? "پیگیری وظایف ثانویه" : "Pursue secondary tasks",
        eveningReview: isFa ? "مرور روزانه و سازماندهی مجدد وظایف" : "Daily review and task rescheduling",
        logicalRationale: isFa
          ? "امروز روی پروژه اصلی خود متمرکز خواهید بود تا بهترین بازدهی را داشته باشید."
          : "Focusing on your main active project today to maintain maximum momentum."
      };
      return {
        text: JSON.stringify(plan),
        raw: { mock: true },
      };
    }

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
    claude: new ClaudeProvider(),
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
