
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatSettings, ApiResponse, Message, MessageSource, PortfolioProfile, PortfolioResponse, Attachment } from "../types";

const extractJson = (text: string): string => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text.trim();
};

export const callGeminiProxy = async (messages: Message[], conversationId?: string, settings: ChatSettings = { modelName: 'gemini-3-flash-preview', temperature: 0.7, enableWebGrounding: true }): Promise<ApiResponse> => {
  // إنشاء مثيل جديد لكل طلب لضمان استخدام المفتاح الأحدث
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const result = await ai.models.generateContent({
      model: settings.modelName || 'gemini-3-flash-preview',
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }, ...(msg.attachments || []).map(a => ({ inlineData: { data: a.data, mimeType: a.mimeType } }))]
      })),
      config: { 
        temperature: settings.temperature, 
        tools: settings.enableWebGrounding ? [{ googleSearch: {} }] : [] 
      }
    });

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: MessageSource[] = groundingChunks
      ?.filter((chunk: any) => chunk.web)
      ?.map((chunk: any) => ({
        title: chunk.web.title || "Source",
        url: chunk.web.uri
      })) || [];

    return { 
      response: result.text || "", 
      type: 'text',
      sources: sources.length > 0 ? sources : undefined,
      groundingMetadata: result.candidates?.[0]?.groundingMetadata
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { response: "", type: 'text', error: error?.message || "Internal API Error" };
  }
};

export const parseResumeFromFile = async (file: Attachment, targetLang: 'ar' | 'en'): Promise<Partial<PortfolioProfile>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze this resume and extract professional details. Output MUST be in ${targetLang === 'ar' ? 'Arabic' : 'English'}. Return valid JSON with: name, headline, location, tagline, about, experienceYears, skills (array of category objects), projects (array).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: { parts: [{ inlineData: { data: file.data, mimeType: file.mimeType } }, { text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(extractJson(response.text || "{}"));
  } catch (error) { 
    console.error("Resume Parsing Error:", error);
    throw error; 
  }
};

export const generatePortfolio = async (profile: PortfolioProfile, refinement?: string): Promise<PortfolioResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isAr = profile.preferredLanguage === 'ar';
  
  const prompt = `Task: Create a high-end, professional personal portfolio based on this profile.
  Style Template: ${profile.template}
  Language: ${isAr ? 'Arabic' : 'English'}
  User Info: ${JSON.stringify(profile)}
  ${refinement ? `Specific Feedback to Apply: ${refinement}` : ''}
  
  Requirements:
  1. Generate 5-6 sections: hero, about, skills, projects, and contact.
  2. For each section, provide a 'title' and 'bodyHtml'.
  3. The 'bodyHtml' MUST use Tailwind CSS classes to create a beautiful, responsive layout matching the ${profile.template} style.
  4. Ensure the Arabic text is professionally phrased and uses RTL layout principles.
  5. Return ONLY a JSON object matching the requested schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  kind: { type: Type.STRING },
                  bodyHtml: { type: Type.STRING }
                },
                required: ["id", "title", "kind", "bodyHtml"]
              }
            },
            tone: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["sections"]
        }
      }
    });

    const text = response.text || "";
    const cleanJson = extractJson(text);
    const data = JSON.parse(cleanJson);
    return { ...data, template: profile.template, language: profile.preferredLanguage };
  } catch (error: any) {
    console.error("Portfolio Generation Error:", error);
    throw new Error(error?.message || "Failed to generate portfolio");
  }
};
