import { fileToBase64 } from "../utils/imageUtils";
import { validateInput } from "../utils/inputValidation";

// Security: All API calls route through backend proxy, never direct to Gemini
const PROXY_BASE_URL = '/api';

export const decideSceneCount = async (prompt: string): Promise<number> => {
  validateInput(prompt);
  
  try {
    const response = await fetch(`${PROXY_BASE_URL}/gemini/decide-scene-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Failed to decide scene count: ${response.statusText}`);
    }

    const result = await response.json();
    return Math.max(2, Math.min(8, result.sceneCount ?? 3));
  } catch (e) {
    console.error("Failed to decide scene count:", e);
    return 3; // Fallback
  }
};

export const planStory = async (prompt: string, numChunks: number): Promise<string[]> => {
  validateInput(prompt);
  
  try {
    const response = await fetch(`${PROXY_BASE_URL}/gemini/plan-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, numChunks }),
    });

    if (!response.ok) {
      throw new Error(`Failed to plan story: ${response.statusText}`);
    }

    const result = await response.json();
    return result.scenes ?? Array.from({ length: numChunks }, (_, i) => `${prompt} - scene ${i + 1}`);
  } catch (e) {
    console.error("Failed to parse story plan:", e);
    return Array.from({ length: numChunks }, (_, i) => `${prompt} - scene ${i + 1}`);
  }
};

export const generateVideoChunk = async (prompt: string, imageBase64Data?: string): Promise<string> => {
  validateInput(prompt);
  
  try {
    const response = await fetch(`${PROXY_BASE_URL}/gemini/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageBase64Data }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate video: ${response.statusText}`);
    }

    const result = await response.json();
    return result.videoUri ?? '';
  } catch (e) {
    console.error("Failed to generate video chunk:", e);
    throw e;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  validateInput(prompt);
  validateInput(aspectRatio);

  try {
    const response = await fetch(`${PROXY_BASE_URL}/gemini/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const result = await response.json();
    return result.imageData ?? '';
  } catch (e) {
    console.error("Failed to generate image:", e);
    throw e;
  }
};

export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
  validateInput(prompt);
  
  try {
    const base64DataUrl = await fileToBase64(imageFile);
    
    const response = await fetch(`${PROXY_BASE_URL}/gemini/edit-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageData: base64DataUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to edit image: ${response.statusText}`);
    }

    const result = await response.json();
    return result.imageData ?? '';
  } catch (e) {
    console.error("Failed to edit image:", e);
    throw e;
  }
};

export const startChat = () => {
  // Chat sessions should be managed through the backend proxy
  // Return a stub that routes through the proxy
  return {
    sendMessage: async (message: string) => {
      validateInput(message);
      
      const response = await fetch(`${PROXY_BASE_URL}/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return response.json();
    }
  };
};
