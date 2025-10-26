import { fileToBase64 } from "../utils/imageUtils";

interface SeedreamImageGenerationRequest {
  prompt: string;
  image_base64?: string;
  width?: number;
  height?: number;
  seed?: number;
  num_images?: number;
  guidance_scale?: number;
  model?: string;
}

interface SeedreamImageGenerationResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SeedreamImageStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    imageUrl?: string;
    errorMessage?: string;
  };
}

const KIE_FILE_API = 'https://kieai.redpandaai.co';
const KIE_MAIN_API = 'https://api.kie.ai/api/v1';

const getKieApiKey = (): string => {
  if (!process.env.KIE_API_KEY) {
    throw new Error("KIE_API_KEY environment variable not set. Please configure your API key in the .env file.");
  }
  if (process.env.KIE_API_KEY.length < 10) {
    throw new Error("Invalid KIE_API_KEY format. Please check your API key.");
  }
  return process.env.KIE_API_KEY;
};

const pollForImageGeneration = async (taskId: string, maxWaitTime: number = 2 * 60 * 1000): Promise<string> => {
  const pollInterval = 5000;
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error("Image generation timed out.");
    }

    const response = await fetch(`${KIE_FILE_API}/4o-image/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.statusText}`);
    }

    const result: SeedreamImageStatusResponse = await response.json();

    if (result.data.status === 'completed' && result.data.imageUrl) {
      return result.data.imageUrl;
    }

    if (result.data.status === 'failed') {
      throw new Error(`Image generation failed: ${result.data.errorMessage || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
};

export const generateImageWithSeedream = async (
  prompt: string,
  aspectRatio: string
): Promise<string> => {
  // Determine dimensions based on aspect ratio
  let width = 1024;
  let height = 1024;
  
  if (aspectRatio === '16:9') {
    width = 1024;
    height = 576;
  } else if (aspectRatio === '9:16') {
    width = 576;
    height = 1024;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (aspectRatio === '3:4') {
    width = 768;
    height = 1024;
  }

  const requestPayload: SeedreamImageGenerationRequest = {
    prompt,
    width,
    height,
    model: 'seedream_4.0', // Using Seedream 4.0 model
    num_images: 1,
    guidance_scale: 7.5,
  };

  let response: Response;
    
    // Try Cloudflare R2 transformation first
    try {
      response = await fetch(`${KIE_FILE_API}/4o-image/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getKieApiKey()}`,
          'Content-Type': 'application/json',
          'CF-Access-Token': process.env.CF_ACCESS_TOKEN || undefined,
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1',
          model: 'seedream_4.0'
        }),
      });
    } catch (cloudflareError) {
      console.info('Cloudflare R2 not available for Seedream, trying direct API');
    }

    // Fallback to direct KIE API if Cloudflare fails
    if (!response || !response.ok) {
      try {
        response = await fetch(`${KIE_MAIN_API}/api/v1/4o-image/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getKieApiKey()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1',
            model: 'seedream_4.0'
          }),
        });
      } catch (directApiError) {
        throw new Error(`Failed to connect to KIE API: ${directApiError instanceof Error ? directApiError.message : 'Network error'}`);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate image: ${response.statusText} - ${errorText}`);
    }

  const result: SeedreamImageGenerationResponse = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Image generation request failed: ${result.msg}`);
  }

  const taskId = result.data.taskId;
  const imageUrl = await pollForImageGeneration(taskId);
  
  return imageUrl;
};

export const editImageWithSeedream = async (prompt: string, imageFile: File): Promise<string> => {
  const imageBase64 = await fileToBase64(imageFile);
  
  const requestPayload: SeedreamImageGenerationRequest = {
    prompt,
    image_base64: imageBase64,
    width: 1024,
    height: 1024,
    model: 'seedream_4.0_edit', // Using Seedream 4.0 edit model
    num_images: 1,
    guidance_scale: 7.5,
  };

  let response: Response;
    
    // Try Cloudflare R2 transformation first
    try {
      response = await fetch(`${KIE_FILE_API}/4o-image/edit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getKieApiKey()}`,
          'Content-Type': 'application/json',
          'CF-Access-Token': process.env.CF_ACCESS_TOKEN || undefined,
        },
        body: JSON.stringify({
          prompt,
          imageBase64,
          aspectRatio: '1:1',
          model: 'seedream_4.0_edit'
        }),
      });
    } catch (cloudflareError) {
      console.info('Cloudflare R2 not available for Seedream edit, trying direct API');
    }

    // Fallback to direct KIE API if Cloudflare fails
    if (!response || !response.ok) {
      try {
        response = await fetch(`${KIE_MAIN_API}/api/v1/4o-image/edit`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getKieApiKey()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            imageBase64,
            aspectRatio: '1:1',
            model: 'seedream_4.0_edit'
          }),
        });
      } catch (directApiError) {
        throw new Error(`Failed to connect to KIE API: ${directApiError instanceof Error ? directApiError.message : 'Network error'}`);
      }
    }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to edit image: ${response.statusText} - ${errorText}`);
  }

  const result: SeedreamImageGenerationResponse = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Image editing request failed: ${result.msg}`);
  }

  const taskId = result.data.taskId;
  const imageUrl = await pollForImageGeneration(taskId);
  
  return imageUrl;
};
