const KIE_MAIN_API = 'https://api.kie.ai/api/v1';

const getKieApiKey = (): string => {
  if (!process.env.KIE_API_KEY) {
    throw new Error("KIE_API_KEY environment variable not set.");
  }
  return process.env.KIE_API_KEY;
};

interface AudioGenerationRequest {
  prompt: string;
  model?: string;
  duration?: number;
  tags?: string[];
  title?: string;
}

interface AudioGenerationResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface AudioStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    audioUrl?: string;
    errorMessage?: string;
    duration?: number;
  };
}

/**
 * Generate music based on video scene context
 */
export const generateMusicForScene = async (
  scenePrompt: string,
  sceneIndex: number,
  totalScenes: number,
  onProgress?: (update: { stage: string; details?: string }) => void
): Promise<string> => {
  onProgress?.({ stage: 'Creating music composition', details: 'Analyzing scene for appropriate music style' });
  
  // Determine music style based on scene content
  let musicStyle = 'cinematic';
  let instrumentPrompt = '';
  
  const lowerPrompt = scenePrompt.toLowerCase();
  
  // Detect mood and style from scene
  if (lowerPrompt.includes('action') || lowerPrompt.includes('fight') || lowerPrompt.includes('battle')) {
    musicStyle = 'epic orchestral';
    instrumentPrompt = 'orchestra, drums, brass section, intense percussion';
  } else if (lowerPrompt.includes('sad') || lowerPrompt.includes('emotional') || lowerPrompt.includes('dramatic')) {
    musicStyle = 'emotional piano';
    instrumentPrompt = 'piano, strings, gentle melodies';
  } else if (lowerPrompt.includes('happy') || lowerPrompt.includes('joyful') || lowerPrompt.includes('celebration')) {
    musicStyle = 'upbeat';
    instrumentPrompt = 'guitar, drums, bass, energetic rhythm';
  } else if (lowerPrompt.includes('mysterious') || lowerPrompt.includes('suspense')) {
    musicStyle = 'ambient';
    instrumentPrompt = 'synthesizer, subtle pads, atmospheric sounds';
  } else if (lowerPrompt.includes('nature') || lowerPrompt.includes('forest') || lowerPrompt.includes('ocean')) {
    musicStyle = 'nature';
    instrumentPrompt = 'flute, harp, nature sounds, peaceful';
  }
  
  // Create comprehensive music prompt
  const musicPrompt = `${musicStyle} background music for scene ${sceneIndex + 1} of ${totalScenes}: ${scenePrompt}. ${instrumentPrompt}. ${duration || 20} seconds, suitable for cinematic use.`;
  
  const requestPayload: AudioGenerationRequest = {
    prompt: musicPrompt,
    model: 'suno-v4',
    duration: 20, // 20 seconds per scene
    tags: [musicStyle, 'cinematic', 'background'],
    title: `Scene ${sceneIndex + 1} Background Music`
  };
  
  onProgress?.({ stage: 'Generating music', details: `Using Suno V4 to create ${musicStyle} composition` });
  
  // Generate music using KIE's Suno API
  const response = await fetch(`${KIE_MAIN_API}/suno/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate music: ${response.statusText}`);
  }
  
  const result: AudioGenerationResponse = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Music generation request failed: ${result.msg}`);
  }
  
  const taskId = result.data.taskId;
  
  onProgress?.({ stage: 'Processing music', details: 'Waiting for audio generation to complete' });
  
  // Poll for completion
  const audioUrl = await pollForAudioCompletion(taskId);
  
  onProgress?.({ stage: 'Music complete', details: 'Background music ready for integration' });
  
  return audioUrl;
};

/**
 * Generate voiceover for scene dialog
 */
export const generateVoiceover = async (
  dialog: string,
  characterVoice: 'male' | 'female' | 'neutral' = 'neutral',
  onProgress?: (update: { stage: string; details?: string }) => void
): Promise<string> => {
  onProgress?.({ stage: 'Creating voiceover', details: `Processing dialog with ${characterVoice} voice` });
  
  // Enhance dialog with voice direction
  const voicePrompt = `${dialog}. Voice: ${characterVoice}, natural tone, clear pronunciation, emotional and engaging delivery suitable for narration.`;
  
  const response = await fetch(`${KIE_MAIN_API}/tts/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: voicePrompt,
      voice: characterVoice === 'male' ? 'en-us-male-1' : characterVoice === 'female' ? 'en-us-female-1' : 'en-us-neutral-1',
      speed: 1.0,
      pitch: 1.0,
      emotion: 'engaging'
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate voiceover: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Voiceover generation failed: ${result.msg}`);
  }
  
  onProgress?.({ stage: 'Voiceover complete', details: 'Audio ready for integration' });
  
  return result.data.audioUrl;
};

/**
 * Mix music and voiceover
 */
export const mixAudioTracks = async (
  musicUrl: string,
  voiceoverUrl: string,
  balance: number = 0.3, // 30% music, 70% voiceover
  onProgress?: (update: { stage: string }) => void
): Promise<string> => {
  onProgress?.({ stage: 'Mixing audio tracks' });
  
  const response = await fetch(`${KIE_MAIN_API}/audio/mix`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getKieApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      musicUrl,
      voiceoverUrl,
      musicVolume: balance,
      voiceVolume: 1.0,
      fadeDuration: 1.0 // 1 second fade
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to mix audio: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(`Audio mixing failed: ${result.msg}`);
  }
  
  return result.data.mixedAudioUrl;
};

/**
 * Poll for audio generation completion
 */
const pollForAudioCompletion = async (
  taskId: string,
  maxWaitTime: number = 2 * 60 * 1000 // 2 minutes max
): Promise<string> => {
  const pollInterval = 5000; // Check every 5 seconds
  const startTime = Date.now();
  
  while (true) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error("Audio generation timed out.");
    }
    
    const response = await fetch(`${KIE_MAIN_API}/suno/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${getKieApiKey()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.statusText}`);
    }
    
    const result: AudioStatusResponse = await response.json();
    
    if (result.data.status === 'completed' && result.data.audioUrl) {
      return result.data.audioUrl;
    }
    
    if (result.data.status === 'failed') {
      throw new Error(`Audio generation failed: ${result.data.errorMessage || 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
};

/**
 * Generate complete audio package for a scene
 */
export const generateSceneAudioPackage = async (
  scenePrompt: string,
  dialog?: string,
  sceneIndex: number = 0,
  totalScenes: number = 1,
  onProgress?: (update: { stage: string; details?: string }) => void
): Promise<string> => {
  // 1. Generate background music
  const musicUrl = await generateMusicForScene(scenePrompt, sceneIndex, totalScenes, onProgress);
  
  // 2. Generate voiceover if dialog exists
  if (dialog && dialog.trim().length > 0) {
    const voiceoverUrl = await generateVoiceover(dialog, 'neutral', onProgress);
    
    // 3. Mix music and voiceover
    const mixedUrl = await mixAudioTracks(musicUrl, voiceoverUrl, 0.3, onProgress);
    return mixedUrl;
  }
  
  // Return music-only track if no dialog
  return musicUrl;
};
