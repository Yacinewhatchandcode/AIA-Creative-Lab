import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { fileToBase64 } from "../utils/imageUtils";

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY environment variable not set.");
    }
    if (!aiClient) {
        aiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    }
    return aiClient;
}

export const decideSceneCount = async (prompt: string): Promise<number> => {
  const ai = getAiClient();
  const systemInstruction = `You are an AI story editor. Your task is to analyze the user's story prompt and decide the optimal number of short video scenes (between 2 and 8) needed to tell the story effectively. A simple concept might only need 2-3 scenes, while a more complex one with multiple events could need 5-8. Respond ONLY with a valid JSON object containing a single key "sceneCount" with a number value. Do not include any other text or explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Analyze this prompt and decide the scene count: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sceneCount: { type: Type.INTEGER },
          },
          required: ['sceneCount'],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return Math.max(2, Math.min(8, result.sceneCount));
  } catch (e) {
    console.error("Failed to decide scene count:", e);
    return 3; // Fallback
  }
};

export const planStory = async (prompt: string, numChunks: number): Promise<string[]> => {
  const ai = getAiClient();
  const systemInstruction = `You are a creative story planner for an AI video generation system. Your task is to break down a user's story idea into ${numChunks} distinct, sequential scenes. For each scene, create a detailed and cinematic prompt for the video generation model. Ensure the prompts flow logically. Respond ONLY with a valid JSON array of strings.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Create a story plan for this prompt: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse story plan:", e);
    return Array.from({ length: numChunks }, (_, i) => `${prompt} - scene ${i + 1}`);
  }
};

export const generateVideoChunk = async (prompt: string, imageBase64Data?: string): Promise<string> => {
    const ai = getAiClient();
    const requestPayload: any = {
        model: 'veo3_fast',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    };

    if (imageBase64Data) {
        const [meta, base64Data] = imageBase64Data.split(',');
        requestPayload.image = {
            imageBytes: base64Data,
            mimeType: meta.match(/:(.*?);/)?.[1] || 'image/jpeg',
        };
        // FIX: When providing an image, the API infers the aspect ratio.
        // Sending both `image` and `aspectRatio` causes an INVALID_ARGUMENT error.
        delete requestPayload.config.aspectRatio;
    }

    let operation = await ai.models.generateVideos(requestPayload);
    const pollInterval = 10000;
    const maxPollTime = 7 * 60 * 1000;
    const startTime = Date.now();

    while (!operation.done) {
        if (Date.now() - startTime > maxPollTime) throw new Error("Video generation timed out.");
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) throw new Error("Video generation failed.");
    
    return `${operation.response.generatedVideos[0].video.uri}&key=${process.env.API_KEY}`;
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
    const ai = getAiClient();
    
    // Fix: Use a browser-compatible method to convert the image file to a base64 string,
    // as Node.js's `Buffer` is not available in the browser.
    const base64DataUrl = await fileToBase64(imageFile);
    const base64Data = base64DataUrl.split(',')[1];

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, { text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Image editing failed to produce an image.");
};

export const startChat = (): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};