import { fileToBase64 } from "../utils/imageUtils";
import { validateInput } from "../utils/inputValidation";

// Security: All API calls route through backend proxy, never expose KIE API key
const PROXY_BASE_URL = '/api';

interface SeedreamGenerationResponse {
  imageUrl: string;
  taskId: string;
}

export const generateImageWithSeedream = async (
  prompt: string,
  aspectRatio: string
): Promise<string> => {
  validateInput(prompt);
  validateInput(aspectRatio);

  try {
    const response = await fetch(`${PROXY_BASE_URL}/seedream/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspectRatio,
        model: 'seedream_4.0'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate image: ${response.statusText} - ${errorText}`);
    }

    const result: SeedreamGenerationResponse = await response.json();
    return result.imageUrl;
  } catch (e) {
    console.error('Seedream image generation failed:', e);
    throw new Error(`Image generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const editImageWithSeedream = async (prompt: string, imageFile: File): Promise<string> => {
  validateInput(prompt);

  try {
    const imageBase64 = await fileToBase64(imageFile);

    const response = await fetch(`${PROXY_BASE_URL}/seedream/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imageBase64,
        model: 'seedream_4.0_edit'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to edit image: ${response.statusText} - ${errorText}`);
    }

    const result: SeedreamGenerationResponse = await response.json();
    return result.imageUrl;
  } catch (e) {
    console.error('Seedream image edit failed:', e);
    throw new Error(`Image edit failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};
