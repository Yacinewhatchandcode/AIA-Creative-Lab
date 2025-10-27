import { validateInput } from "../utils/inputValidation";

// Security: All API calls route through backend proxy
const PROXY_BASE_URL = '/api';

interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  imageBase64?: string;
}

interface VideoGenerationResponse {
  videoUrl: string;
  taskId: string;
  status: string;
}

export const generateVideo = async (
  prompt: string,
  model: string = 'veo3_fast',
  aspectRatio: string = '16:9',
  imageBase64?: string
): Promise<string> => {
  validateInput(prompt);
  validateInput(model);
  validateInput(aspectRatio);

  try {
    const payload: VideoGenerationRequest = {
      prompt,
      model,
      aspectRatio
    };

    if (imageBase64) {
      payload.imageBase64 = imageBase64;
    }

    const response = await fetch(`${PROXY_BASE_URL}/kie/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate video: ${response.statusText} - ${errorText}`);
    }

    const result: VideoGenerationResponse = await response.json();
    return result.videoUrl;
  } catch (e) {
    console.error('KIE video generation failed:', e);
    throw new Error(`Video generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const checkVideoStatus = async (taskId: string): Promise<VideoGenerationResponse> => {
  validateInput(taskId);

  try {
    const response = await fetch(`${PROXY_BASE_URL}/kie/video-status/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check video status: ${response.statusText}`);
    }

    return await response.json();
  } catch (e) {
    console.error('Failed to check video status:', e);
    throw new Error(`Status check failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};
