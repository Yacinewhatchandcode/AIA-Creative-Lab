import { validateInput } from "../utils/inputValidation";

// Security: All API calls route through backend proxy
const PROXY_BASE_URL = '/api';

interface AudioGenerationResponse {
  audioUrl: string;
  taskId: string;
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
  validateInput(scenePrompt);
  onProgress?.({ stage: 'Creating music composition', details: 'Analyzing scene for appropriate music style' });
  
  try {
    const response = await fetch(`${PROXY_BASE_URL}/audio/generate-music`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenePrompt,
        sceneIndex,
        totalScenes
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate music: ${response.statusText}`);
    }

    const result: AudioGenerationResponse = await response.json();
    onProgress?.({ stage: 'Music complete', details: 'Background music ready for integration' });
    return result.audioUrl;
  } catch (e) {
    console.error('Music generation failed:', e);
    throw e;
  }
};

/**
 * Generate voiceover for scene dialog
 */
export const generateVoiceover = async (
  dialog: string,
  characterVoice: 'male' | 'female' | 'neutral' = 'neutral',
  onProgress?: (update: { stage: string; details?: string }) => void
): Promise<string> => {
  validateInput(dialog);
  onProgress?.({ stage: 'Creating voiceover', details: `Processing dialog with ${characterVoice} voice` });
  
  try {
    const response = await fetch(`${PROXY_BASE_URL}/audio/generate-voiceover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dialog,
        characterVoice
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate voiceover: ${response.statusText}`);
    }

    const result: AudioGenerationResponse = await response.json();
    onProgress?.({ stage: 'Voiceover complete', details: 'Audio ready for integration' });
    return result.audioUrl;
  } catch (e) {
    console.error('Voiceover generation failed:', e);
    throw e;
  }
};

/**
 * Mix music and voiceover
 */
export const mixAudioTracks = async (
  musicUrl: string,
  voiceoverUrl: string,
  balance: number = 0.3,
  onProgress?: (update: { stage: string }) => void
): Promise<string> => {
  validateInput(musicUrl);
  validateInput(voiceoverUrl);
  onProgress?.({ stage: 'Mixing audio tracks' });
  
  try {
    const response = await fetch(`${PROXY_BASE_URL}/audio/mix-tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        musicUrl,
        voiceoverUrl,
        balance
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mix audio: ${response.statusText}`);
    }

    const result: AudioGenerationResponse = await response.json();
    return result.audioUrl;
  } catch (e) {
    console.error('Audio mixing failed:', e);
    throw e;
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
  validateInput(scenePrompt);
  
  try {
    // Generate background music
    const musicUrl = await generateMusicForScene(scenePrompt, sceneIndex, totalScenes, onProgress);
    
    // Generate voiceover if dialog exists
    if (dialog && dialog.trim().length > 0) {
      const voiceoverUrl = await generateVoiceover(dialog, 'neutral', onProgress);
      
      // Mix music and voiceover
      const mixedUrl = await mixAudioTracks(musicUrl, voiceoverUrl, 0.3, onProgress);
      return mixedUrl;
    }
    
    // Return music-only track if no dialog
    return musicUrl;
  } catch (e) {
    console.error('Scene audio package generation failed:', e);
    throw e;
  }
};
