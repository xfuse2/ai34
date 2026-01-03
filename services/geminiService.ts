
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { ApiResponse, Message, MessageSource, Attachment, PortfolioProfile, PortfolioResponse } from "../types";

export const callGeminiProxy = async (
  messages: Message[], 
  settings: any = {}
): Promise<ApiResponse> => {
  // إنشاء نسخة جديدة دائماً لضمان استخدام أحدث مفتاح API تم اختياره من خلال aistudio
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = settings.modelName || 'gemini-3-flash-preview';
  const isImageMode = settings.mode === 'image';
  const isVoiceMode = settings.mode === 'voice';

  try {
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        { text: msg.content },
        ...(msg.attachments || []).map(a => ({
          inlineData: { data: a.data, mimeType: a.mimeType }
        }))
      ]
    }));

    const config: any = {
      temperature: settings.temperature || 0.7,
    };

    if (settings.enableWebGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    if (modelName.includes('pro')) {
      config.thinkingConfig = { thinkingBudget: 4000 };
    }

    if (isVoiceMode) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents,
        config: {
          ...config,
          // المودالية الصوتية حصرية
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      const audioData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      return { response: response.text || "Voice Response", type: 'audio', audioData };
    }

    if (isImageMode) {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents,
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
        }
      });
      
      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return { response: response.text || "Generated Image", type: 'image', imageUrl };
    }

    const result = await ai.models.generateContent({
      model: modelName,
      contents,
      config
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
    console.error("Gemini API Error Detail:", error);
    
    // محاولة استخراج نص الخطأ الخام للتحقق منه في الواجهة
    let errorMessage = "Unknown API Error";
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = String(error);
      }
    }

    return { 
      response: "", 
      type: 'text', 
      error: errorMessage 
    };
  }
};

/**
 * Parses a resume file (PDF or Image) into a structured PortfolioProfile using Gemini.
 */
export const parseResumeFromFile = async (attachment: Attachment, lang: string): Promise<Partial<PortfolioProfile>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: attachment.data, mimeType: attachment.mimeType } },
          { text: `Analyze the provided resume and extract the details into a structured JSON format. 
                   Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
                   Fields to extract: name, headline, location, tagline, about, experienceYears, targetAudience, skills (category, items), projects (title, description).` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            headline: { type: Type.STRING },
            location: { type: Type.STRING },
            tagline: { type: Type.STRING },
            about: { type: Type.STRING },
            experienceYears: { type: Type.NUMBER },
            targetAudience: { type: Type.STRING },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['category', 'items']
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['title', 'description']
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Failed to parse resume JSON", e);
    // إذا كان الخطأ متعلقاً بالصلاحيات، يمكن تمريره للأعلى إذا لزم الأمر
    throw e;
  }
};

/**
 * Generates a full portfolio based on the user's profile data.
 */
export const generatePortfolio = async (profile: PortfolioProfile, refinement?: string): Promise<PortfolioResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a world-class web developer and designer. 
                  Generate a professional portfolio page in HTML/CSS based on this user profile: ${JSON.stringify(profile)}.
                  Template: ${profile.template}.
                  Language: ${profile.preferredLanguage}.
                  ${refinement ? `Refinement request: ${refinement}` : ''}
                  
                  Return the result in JSON format with sections.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            template: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  bodyHtml: { type: Type.STRING }
                },
                required: ['id', 'title', 'bodyHtml']
              }
            }
          },
          required: ['template', 'sections']
        }
      }
    });
    return JSON.parse(response.text || '{}') as PortfolioResponse;
  } catch (e: any) {
    console.error("Failed to parse portfolio JSON", e);
    // نقوم برمي الخطأ ليتم معالجته في المكون الرسومي
    throw e;
  }
};
