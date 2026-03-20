
import { GoogleGenAI, Type, GenerateContentResponse, Part } from "@google/genai";
import { ProductInfo, AdAngle, Language, UploadedFile } from "../types";
import { brandArchetypes } from "../data/brandArchetypes";

const getGenAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAdAngles = async (productInfo: ProductInfo, lang: Language): Promise<AdAngle[]> => {
  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const langInstruction = lang === 'da' ? "Svar på DANSK." : "Answer in ENGLISH.";
  
  const prompt = `
    ${langInstruction}
    As a world-class Growth Marketer, generate 3 unique and high-converting ad angle strategies for this product:
    Product: ${productInfo.name}
    Audience: ${productInfo.audience}
    USPs: ${productInfo.sellingPoints}
    Platform: ${productInfo.platform}
    
    Each angle must have:
    1. A catchy title (Strategic Hook).
    2. A brief description of the psychological trigger.
    3. A specific visual prompt idea for an AI image generator.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              visual_prompt_idea: { type: Type.STRING }
            },
            required: ["title", "description", "visual_prompt_idea"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Angle generation failed:", error);
    throw error;
  }
};

export const generateSuggestedPrompt = async (productInfo: ProductInfo, lang: Language): Promise<string> => {
  const ai = getGenAI();
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are a Creative Director. Based on the following product DNA, write a single, high-end, atmospheric visual prompt for an AI image generator.
    Product: ${productInfo.name}
    Audience: ${productInfo.audience}
    USPs: ${productInfo.sellingPoints}
    Response should be a single paragraph of descriptive text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    return "High-end commercial photography, professional lighting, cinematic environment.";
  }
};

export const generateAdVisuals = async (
  angle: AdAngle | null,
  mainImage: UploadedFile,
  customPrompt: string,
  options: {
    numberOfImages: number;
    aspectRatio: string;
    useSuperRealism: boolean;
    styleReference?: UploadedFile;
    headline: string;
    headlineOptions?: {
      fontSize: string;
      color: string;
      font: string;
    };
    platform: string;
    textStyle: string;
    additionalAssets?: UploadedFile[];
  }
): Promise<string[]> => {
  const ai = getGenAI();
  const model = "gemini-3-pro-image-preview";
  
  const ratio = options.aspectRatio.includes('1:1') ? '1:1' : 
                options.aspectRatio.includes('9:16') ? '9:16' : 
                options.aspectRatio.includes('16:9') ? '16:9' : '1:1';

  try {
    const imagePromises = Array.from({ length: options.numberOfImages }, (_, index) => {
      const realismPart = options.useSuperRealism ? "Cinematic lighting, high-end photography, 8k resolution, photorealistic, commercial studio grade." : "";
      
      let textInstruction = "NO TEXT: Image is pure visual.";
      if (options.headline) {
        textInstruction = `TEXT OVERLAY: "${options.headline}". Font: ${options.headlineOptions?.font}. Color: ${options.headlineOptions?.color}.`;
      }

      const fullPrompt = `
        STRATEGY: ${angle?.title || 'General Ad'}
        CONCEPT: ${angle?.visual_prompt_idea || customPrompt}
        THEME: ${customPrompt}
        RULES:
        - ${textInstruction}
        - ${realismPart}
        - Incorporate the product from the main image naturally.
        - Professional lighting for ${options.platform}.
      `;

      const parts: Part[] = [
          { inlineData: { data: mainImage.data, mimeType: mainImage.mimeType } }
      ];
      if (options.additionalAssets) {
          options.additionalAssets.forEach(asset => parts.push({ inlineData: { data: asset.data, mimeType: asset.mimeType } }));
      }
      if (options.styleReference) {
          parts.push({ inlineData: { data: options.styleReference.data, mimeType: options.styleReference.mimeType } });
      }
      parts.push({ text: fullPrompt });

      return ai.models.generateContent({
        model: model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio as any, imageSize: "1K" } },
      });
    });

    const responses = await Promise.all(imagePromises);
    return responses.map(res => res.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data || '');
  } catch (error) {
    console.error("Visual generation failed:", error);
    throw error;
  }
};

export const generateAdVideo = async (
  angle: AdAngle | null,
  baseImage: UploadedFile | null,
  customPrompt: string,
  options: { resolution: '720p' | '1080p', aspectRatio: '16:9' | '9:16' }
): Promise<string> => {
  const ai = getGenAI();
  const model = 'veo-3.1-fast-generate-preview';
  
  const generationParams: any = {
    model: model,
    prompt: `Motion creative. ${customPrompt}. Angle: ${angle?.title}. Cinematic flow, product-focused.`,
    config: { numberOfVideos: 1, resolution: options.resolution, aspectRatio: options.aspectRatio }
  };

  if (baseImage) {
    generationParams.image = { imageBytes: baseImage.data, mimeType: baseImage.mimeType };
  }

  try {
    let operation = await ai.models.generateVideos(generationParams);
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video failed:", error);
    throw error;
  }
};

export const generateCaptions = async (productInfo: ProductInfo, angle: AdAngle, lang: Language): Promise<string[]> => {
  const ai = getGenAI();
  const model = "gemini-3-flash-preview";
  const langInstruction = lang === 'da' ? "Skriv teksterne på DANSK." : "Write captions in ENGLISH.";
  const prompt = `${langInstruction} Write 3 ad captions for ${productInfo.name}. Angle: ${angle.title}. Rules: 1 short hook, 1 benefit-driven, 1 story. Use emojis.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    return ["Grab yours today!", "The best choice for you.", "Quality you can trust."];
  }
};
