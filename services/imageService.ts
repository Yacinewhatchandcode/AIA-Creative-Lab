import { fileToBase64 } from "../utils/imageUtils";
import { validateInput } from "../utils/inputValidation";

// Security: All API calls route through backend proxy
const PROXY_BASE_URL = '/api';

interface ImageGenerationResponse {
  imageUrl: string;
  taskId: string;
}

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  validateInput(prompt);
  validateInput(aspectRatio);

  try {
    const response = await fetch(`${PROXY_BASE_URL}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspectRatio,
        model: 'gpt4o_image'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const result: ImageGenerationResponse = await response.json();
    return result.imageUrl;
  } catch (e) {
    console.error('Image generation failed:', e);
    throw new Error(`Image generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
  validateInput(prompt);

  try {
    const imageBase64 = await fileToBase64(imageFile);

    const response = await fetch(`${PROXY_BASE_URL}/image/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imageBase64,
        model: 'gpt4o_image'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to edit image: ${response.statusText}`);
    }

    const result: ImageGenerationResponse = await response.json();
    return result.imageUrl;
  } catch (e) {
    console.error('Image editing failed:', e);
    throw new Error(`Image edit failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};
