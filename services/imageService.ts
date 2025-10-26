import { fileToBase64 } from "../utils/imageUtils";

interface KieImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  model?: string;
}

interface KieImageEditRequest {
  prompt: string;
  imageBase64: string;
  model?: string;
}

interface KieImageResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface KieImageStatusResponse {
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
    throw new Error("KIE_API_KEY environment variable not set.");
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

    const response = await fetch(`${KIE_API_BASE_URL}/api/v1/4o-image/generate/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.statusText}`);
    }

    const result: KieImageStatusResponse = await response.json();

    if (result.data.status === 'completed' && result.data.imageUrl) {
      return result.data.imageUrl;
    }

    if (result.data.status === 'failed') {
      throw new Error(`Image generation failed: ${result.data.errorMessage || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  const requestPayload: KieImageGenerationRequest = {
    prompt,
    aspectRatio,
    model: 'gpt4o_image', // Using 4o Image API model
  };

  let response: Response;
  
  // Try with Cloudflare R2 transformation first
  try {
    response = await fetch(`${KIE_FILE_API}/4o-image/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
        'Content-Type': 'application/json',
        'CF-Access-Token': process.env.CF_ACCESS_TOKEN || undefined,
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (cloudflareError) {
    console.log('Cloudflare R2 not available for 4o-image, trying direct API');
  }

  // Fallback to direct KIE API if Cloudflare fails
  if (!response || !response.ok) {
    response = await fetch(`${KIE_MAIN_API}/api/v1/4o-image/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
  }

  const response2 = await fetch(kieApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response2.ok) {
    throw new Error(`Failed to generate image: ${response2.statusText}`);
  }

  const result: KieImageResponse = await response2.json();
  
  if (result.code !== 200) {
    throw new Error(`Image generation request failed: ${result.msg}`);
  }

  const taskId = result.data.taskId;
  const imageUrl = await pollForImageGeneration(taskId);
  
  return imageUrl;
};

export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
  const imageBase64 = await fileToBase64(imageFile);
  
  const requestPayload: KieImageEditRequest = {
    prompt,
    imageBase64,
    model: 'gpt4o_image', // Using 4o Image API model
  };

  let response: Response;
  
  // Try with Cloudflare R2 transformation first
  try {
    response = await fetch(`${KIE_FILE_API}/4o-image/edit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
        'Content-Type': 'application/json',
        'CF-Access-Token': process.env.CF_ACCESS_TOKEN || undefined,
      },
      body: JSON.stringify(requestPayload),
    });
  } catch (cloudflareError) {
    console.log('Cloudflare R2 not available for 4o-image edit, trying direct API');
  }

  // Fallback to direct KIE API if Cloudflare fails
  if (!response || !response.ok) {
    response = await fetch(`${KIE_MAIN_API}/api/v1/4o-image/edit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });
  }

  const response3 = await fetch(kieApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response3.ok) {
    throw new Error(`Failed to edit image: ${response3.statusText}`);
  }

  const result: KieImageResponse = await response3.json();
  
  if (result.code !== 200) {
    throw new Error(`Image editing request failed: ${result.msg}`);
  }

  const taskId = result.data.taskId;
  const imageUrl = await pollForImageGeneration(taskId);
  
  return imageUrl;
};
