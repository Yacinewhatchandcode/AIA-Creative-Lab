import { fileToBase64 } from "../utils/imageUtils";

interface KieVideoGenerationRequest {
  prompt: string;
  imageUrls?: string[];
  model?: 'veo3' | 'veo3_fast';
  aspectRatio?: '16:9' | '9:16' | 'Auto';
  seeds?: number;
  generationType?: 'TEXT_2_VIDEO' | 'FIRST_AND_LAST_FRAMES_2_VIDEO' | 'REFERENCE_2_VIDEO';
}

interface KieVideoGenerationResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface KieVideoStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    videoUrl?: string;
    errorMessage?: string;
  };
}

// KIE uses different domains for different services
const KIE_MAIN_API = 'https://api.kie.ai/api/v1';
const KIE_FILE_API = 'https://kieai.redpandaai.co';

const getKieApiKey = (): string => {
  if (!process.env.KIE_API_KEY) {
    throw new Error("KIE_API_KEY environment variable not set.");
  }
  return process.env.KIE_API_KEY;
};

const uploadImageToKie = async (imageBase64: string): Promise<string> => {
  // KIE API expects the base64 data to include the MIME type prefix
  let base64Data = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    // Add data URL prefix if it's just raw base64
    base64Data = `data:image/jpeg;base64,${imageBase64}`;
  }

  // First attempt: Use Cloudflare R2 transformation
  try {
    const response = await fetch(`${KIE_FILE_API}/api/file-base64-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
        'Content-Type': 'application/json',
        'CF-Access-Token': process.env.CF_ACCESS_TOKEN || undefined, // Cloudflare token if available
      },
      body: JSON.stringify({
        base64Data: base64Data,
        uploadPath: 'video-generation',
        fileName: `frame-${Date.now()}.jpg`,
        // Additional properties for Cloudflare optimization
        optimizeForWeb: true,
        quality: 85,
        stripMetadata: false
      }),
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data && result.data.downloadUrl) {
        return result.data.downloadUrl;
      }
    }
  } catch (cloudflareError) {
    console.log('Cloudflare R2 transformation not available, falling back to direct upload');
  }

  // Fallback: Try direct KIE API without Cloudflare
  const response = await fetch(`${KIE_FILE_API}/api/file-base64-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data: base64Data,
      uploadPath: 'video-generation',
      fileName: `frame-${Date.now()}.jpg`
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Return the download URL from the response
  if (result.success && result.data && result.data.downloadUrl) {
    return result.data.downloadUrl;
  } else {
    throw new Error(`Failed to upload image: ${result.msg || 'Unknown error'}`);
  }
};

const pollForVideoGeneration = async (taskId: string, maxWaitTime: number = 7 * 60 * 1000): Promise<string> => {
  const pollInterval = 10000;
  const startTime = Date.now();
  let retryCount = 0;
  const maxRetries = 3;

  while (true) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error(`Video generation timed out after ${maxWaitTime/1000} seconds.`);
    }

    let response: Response;
    try {
      response = await fetch(`${KIE_MAIN_API}/veo/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${getKieApiKey()}`,
          'CF-Ray-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Help with Cloudflare debugging
          'X-Retry-Count': retryCount.toString(),
        },
      });
    } catch (fetchError) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw new Error(`Failed to reach KIE API after ${maxRetries} attempts: ${fetchError.message}`);
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      continue;
    }

    if (!response.ok) {
      if (response.status === 429) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Rate limited. Please try again in a few seconds.`);
        }
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    try {
      const result: KieVideoGenerationResponse = await response.json();
      
      if (result.code === 200 && result.data && result.data.taskId === taskId) {
        // Task is in progress or completed
        if (result.data.status === 'completed' && result.data.videoUrl) {
          return result.data.videoUrl;
        }
        
        if (result.data.status === 'failed') {
          throw new Error(`Video generation failed: ${result.data.errorMessage || 'Unknown error'}`);
        }
      } else {
        throw new Error(`Unexpected response code: ${result.code} - ${result.msg}`);
      }
    } catch (parseError) {
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }
  }
}

export const generateVideoChunkWithKie = async (
  prompt: string,
  imageBase64Data?: string
): Promise<string> => {
  const requestPayload: KieVideoGenerationRequest = {
    prompt,
    model: 'veo3_fast',
    aspectRatio: '16:9',
    generationType: 'TEXT_2_VIDEO',
  };

  if (imageBase64Data) {
    const imageUrl = await uploadImageToKie(imageBase64Data);
    requestPayload.imageUrls = [imageUrl];
    requestPayload.generationType = 'REFERENCE_2_VIDEO';
  }

  const response = await fetch(`${KIE_MAIN_API}/veo/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate video: ${response.statusText}`);
  }

  const result: KieVideoGenerationResponse = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Video generation request failed: ${result.msg}`);
  }

  const taskId = result.data.taskId;
  const videoUrl = await pollForVideoGeneration(taskId);
  
  return `${videoUrl}?key=${getKieApiKey()}`;
};
