import { generateImageWithSeedream, editImageWithSeedream } from './seedreamService';
import { generateVideoChunkWithKie } from './kieService';
import { decideSceneCount, planStory } from './storyPlannerService';
import { fileToBase64 } from '../utils/imageUtils';

interface FrameEnhancementTask {
  sceneIndex: number;
  prompt: string;
  seed?: number;
  aspectRatio?: string;
  visualStyle?: string;
  continuityElements?: string[];
  enhancedFrame?: string;
  videoTask?: Promise<string>;
  dialog?: string;
  action?: string;
  sceneNumber?: number;
}

interface ScriptScene {
  sceneNumber: number;
  location: string;
  time: string;
  action: string;
  dialog?: string[];
  visualDescription?: string;
  cameraAngle?: string;
}

enum ProcessingMode {
  SCRIPT = 'script',
  IDEA = 'idea'
}

interface VisualContinuity {
  characters: string[];
  style: string;
  colorPalette?: string[];
  environment?: string;
  mood?: string;
  transitions?: string[];
}

class AutonomousFrameAgent {
  /**
   * Detects if user has provided a script or just an idea
   */
  private detectProcessingMode(userPrompt: string): { mode: ProcessingMode; confidence: number } {
    const scriptIndicators = [
      /scene\s*\d+/i,
      /int\.?\s*ext\.?/i,
      /\d+\.?\s*.*\n/gm, // Numbered scenes
      /fade\s*(in|out)/i,
      /cut\s+to:/i,
      /dialog|dialogue/i,
      /voiceover|vo/i,
      /character\s*:.*:/i,
      /\[.*\]/g, // Action descriptions in brackets
    ];

    const ideaIndicators = [
      /create\s+(a|an)\s+.*?\s+(movie|film|video)/i,
      /make\s+(a|an)\s+.*?\s+(story|animation)/i,
      /show\s+me\s+.*?\s+(doing|happening)/i,
      /generate\s+.*?\s+(story|plot)/i,
      /idea\s+for/i,
      /concept\s+of/i,
    ];

    let scriptScore = 0;
    let ideaScore = 0;

    scriptIndicators.forEach(indicator => {
      if (indicator.test(userPrompt)) scriptScore++;
    });

    ideaIndicators.forEach(indicator => {
      if (indicator.test(userPrompt)) ideaScore++;
    });

    // Check for structured content (multiple scenes, dialog, etc.)
    const lines = userPrompt.toLowerCase().split('\n').filter(line => line.trim().length > 0);
    const hasDialog = userPrompt.includes(':') && lines.some(line => line.match(/:.*".*"/));
    const hasScenes = userPrompt.match(/scene\s*\d+/gi) || userPrompt.match(/\d+\./g);
    
    if (hasDialog || (hasScenes && hasScenes.length > 1)) {
      scriptScore += 2;
    }

    if (scriptScore > ideaScore) {
      return { mode: ProcessingMode.SCRIPT, confidence: Math.min(scriptScore / (scriptIndicators.length + 2), 1) };
    } else {
      return { mode: ProcessingMode.IDEA, confidence: Math.min(ideaScore / ideaIndicators.length, 1) };
    }
  }

  /**
   * Parses user script into structured scenes
   */
  private parseScript(userPrompt: string): ScriptScene[] {
    const scenes: ScriptScene[] = [];
    const lines = userPrompt.split('\n').filter(line => line.trim().length > 0);
    
    let currentScene: Partial<ScriptScene> = {};
    let sceneNumber = 1;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect scene headers
      const sceneMatch = trimmedLine.match(/scene\s*(\d+):?\s*(.*)/i);
      const intExtMatch = trimmedLine.match(/(int|ext)\.?\s*(.*)\s*-\s*(day|night|dawn|dusk)/i);
      const lineNumberedMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
      
      if (sceneMatch || intExtMatch || lineNumberedMatch) {
        // Save previous scene if exists
        if (currentScene.action || currentScene.dialog) {
          scenes.push({
            sceneNumber: currentScene.sceneNumber || sceneNumber,
            location: currentScene.location || 'Unknown',
            time: currentScene.time || 'Day',
            action: currentScene.action || '',
            dialog: currentScene.dialog,
            visualDescription: currentScene.visualDescription,
            cameraAngle: currentScene.cameraAngle
          });
        }
        
        // Start new scene
        currentScene = {
          sceneNumber: sceneNumber++
        };
        
        if (sceneMatch) {
          currentScene.sceneNumber = parseInt(sceneMatch[1]);
          const locationTime = sceneMatch[2];
          if (locationTime.includes('-')) {
            const parts = locationTime.split('-');
            currentScene.location = parts[0].trim();
            currentScene.time = parts[1].trim();
          } else {
            currentScene.location = locationTime.trim();
          }
        } else if (intExtMatch) {
          currentScene.location = intExtMatch[2].trim();
          currentScene.time = intExtMatch[3].trim();
        }
        
        continue;
      }
      
      // Detect camera angles
      const cameraMatch = trimmedLine.match(/camera:\s*(.*)/i) || 
                         trimmedLine.match(/^[([]\s*(wide|close-up|medium|pan|tilt).*/i);
      if (cameraMatch && !trimmedLine.includes(':')) {
        currentScene.cameraAngle = cameraMatch[1];
        continue;
      }
      
      // Detect dialog (character: "dialog")
      const dialogMatch = trimmedLine.match(/^([^:]+):\s*["'](.*)["']$/);
      if (dialogMatch) {
        if (!currentScene.dialog) currentScene.dialog = [];
        currentScene.dialog.push(`${dialogMatch[1]}: ${dialogMatch[2]}`);
        continue;
      }
      
      // Action lines or visual descriptions
      if (trimmedLine && !trimmedLine.startsWith('[')) {
        if (!currentScene.action) {
          currentScene.action = trimmedLine;
        } else {
          currentScene.action += ' ' + trimmedLine;
        }
      } else if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentScene.visualDescription = trimmedLine.slice(1, -1).trim();
      }
    }
    
    // Add final scene
    if (currentScene.action || currentScene.dialog) {
      scenes.push({
        sceneNumber: currentScene.sceneNumber || sceneNumber,
        location: currentScene.location || 'Unknown',
        time: currentScene.time || 'Day',
        action: currentScene.action || '',
        dialog: currentScene.dialog,
        visualDescription: currentScene.visualDescription,
        cameraAngle: currentScene.cameraAngle
      });
    }
    
    return scenes.length > 0 ? scenes : this.createScenesFromIdea(userPrompt);
  }

  /**
   * Creates scenes from idea when script format not detected
   */
  private createScenesFromIdea(idea: string): ScriptScene[] {
    // Default to 3 scenes if no script structure
    const numScenes = 3;
    const scenes: ScriptScene[] = [];
    
    // Extract key elements from the idea
    const ideaLower = idea.toLowerCase();
    let location = 'Unknown location';
    let characters: string[] = [];
    
    // Detect locations
    const locations = ['forest', 'city', 'beach', 'house', 'space', 'mountain', 'desert', 'ocean', 'school', 'office'];
    locations.forEach(loc => {
      if (ideaLower.includes(loc)) location = loc;
    });
    
    // Detect characters
    const characterTypes = ['hero', 'woman', 'man', 'child', 'boy', 'girl', 'robot', 'animal'];
    characterTypes.forEach(char => {
      if (ideaLower.includes(char)) characters.push(char);
    });
    
    for (let i = 0; i < numScenes; i++) {
      scenes.push({
        sceneNumber: i + 1,
        location: location,
        time: 'Day',
        action: `Scene ${i + 1} action for: ${idea}`,
        visualDescription: `Visual representation of ${idea} - Scene ${i + 1}`
      });
    }
    
    return scenes;
  }

  /**
   * Converts scenes to frame enhancement tasks
   */
  private scenesToEnhancementTasks(scenes: ScriptScene[]): FrameEnhancementTask[] {
    const tasks: FrameEnhancementTask[] = [];
    const baseSeed = 12345;
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      let prompt = scene.visualDescription || scene.action;
      
      // Add location and time context
      prompt += ` in ${scene.location}, ${scene.time.toLowerCase()}.`;
      
      // Add dialog if present
      if (scene.dialog && scene.dialog.length > 0) {
        prompt += ` Characters speaking: ${scene.dialog.join('. ')}.`;
      }
      
      // Add camera direction
      if (scene.cameraAngle) {
        prompt += ` ${scene.cameraAngle} camera angle.`;
      }
      
      tasks.push({
        sceneIndex: i,
        prompt: prompt,
        seed: this.createConsistentSeed(baseSeed, i),
        aspectRatio: '16:9',
        sceneNumber: scene.sceneNumber,
        action: scene.action,
        dialog: scene.dialog ? scene.dialog.join(' ') : undefined
      });
    }
    
    return tasks;
  }

  /**
   * Extracts visual continuity elements from story prompts
   */
  private extractVisualContinuity(storyPrompts: string[]): VisualContinuity {
    const allText = storyPrompts.join(' ').toLowerCase();
    
    // Extract characters/persons
    const characters: string[] = [];
    const characterKeywords = ['man', 'woman', 'person', 'boy', 'girl', 'character', 'hero'];
    characterKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        characters.push(keyword);
      }
    });
    
    // Determine visual style
    let style = 'realistic';
    if (allText.includes('anime') || allText.includes('cartoon')) style = 'anime';
    else if (allText.includes('oil painting') || allText.includes('artistic')) style = 'artistic';
    else if (allText.includes('cyberpunk') || allText.includes('futuristic')) style = 'cyberpunk';
    
    // Determine environment
    let environment = 'natural';
    if (allText.includes('city') || allText.includes('urban')) environment = 'urban';
    else if (allText.includes('space') || allText.includes('galaxy')) environment = 'space';
    else if (allText.includes('forest') || allText.includes('nature')) environment = 'natural';
    
    return {
      characters: characters.length > 0 ? characters : ['main character'],
      style,
      environment,
      mood: 'engaging',
      transitions: ['smooth transition']
    };
  }
  
  /**
   * Creates enhanced frame using Seedream with continuity awareness
   */
  private async createEnhancedFrame(
    task: FrameEnhancementTask,
    continuity: VisualContinuity,
    previousFrame?: string
  ): Promise<string> {
    let enhancedPrompt = task.prompt;
    
    // Add continuity elements to the prompt
    enhancedPrompt += `. Style: ${continuity.style}. Environment: ${continuity.environment}.`;
    
    // Add character consistency
    if (continuity.characters.length > 0) {
      enhancedPrompt += ` Characters: [${continuity.characters.join(', ')}]. Maintain character consistency throughout.`;
    }
    
    // Add visual direction
    enhancedPrompt += '. Cinematic lighting. High detail. 4K resolution. Professional photography style.';
    
    // If it's not the first scene, add transition context
    if (previousFrame && task.sceneIndex > 0) {
      enhancedPrompt += '. seamless transition from previous scene';
      
      // Use Seedream edit to maintain continuity
      if (task.sceneIndex > 0) {
        try {
          return await editImageWithSeedream(enhancedPrompt, this.dataURLtoFile(previousFrame));
        } catch (e) {
          // Fallback to generation if edit fails
          console.warn(`Frame edit failed, generating new frame for scene ${task.sceneIndex}:`, e);
        }
      }
    }
    
    // Generate new frame
    try {
      return await generateImageWithSeedream(enhancedPrompt, '16:9');
    } catch (e) {
      console.error(`Failed to generate enhanced frame for scene ${task.sceneIndex}:`, e);
      throw e;
    }
  }
  
  /**
   * Converts data URL to File object
   */
  private dataURLtoFile(dataUrl: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], `frame-${Date.now()}.jpg`, {type: mime});
  }
  
  /**
   * Creates a seed for consistency
   */
  private createConsistentSeed(base: number, variation: number): number {
    return (base * 1000 + variation) % 99999;
  }
  
  /**
   * Main autonomous agent orchestration - detects script vs idea mode
   */
  async orchestrateFrameEnhancement(
    userInput: string,
    initialImage?: string,
    onProgress?: (update: { scene: number; stage: string; details?: string }) => void
  ): Promise<{ enhancedFrames: string[]; videoPromises: Promise<string>[]; mode: ProcessingMode; tasks: FrameEnhancementTask[] }> {
    
    // Step 1: Detect processing mode
    const { mode, confidence } = this.detectProcessingMode(userInput);
    
    onProgress?.({ 
      scene: 0, 
      stage: `Detected ${mode.toUpperCase()} mode (${Math.round(confidence * 100)}% confidence)`,
      details: mode === ProcessingMode.SCRIPT ? 'Following exact script specifications' : 'Creating story from idea'
    });
    
    let tasks: FrameEnhancementTask[] = [];
    
    if (mode === ProcessingMode.SCRIPT) {
      // Step 2: Parse script into structured scenes
      onProgress?.({ scene: 1, stage: 'Parsing script into scenes' });
      const scenes = this.parseScript(userInput);
      tasks = this.scenesToEnhancementTasks(scenes);
    } else {
      // Step 2: Use existing story planner
      onProgress?.({ scene: 1, stage: 'Creating story from idea using AI planning' });
      const numChunks = await decideSceneCount(userInput);
      const storyPrompts = await planStory(userInput, numChunks);
      
      // Create tasks from story prompts (method from previous implementation)
      const continuity = this.extractVisualContinuity(storyPrompts);
      const baseSeed = 12345;
      
      for (let i = 0; i < storyPrompts.length; i++) {
        tasks.push({
          sceneIndex: i,
          prompt: storyPrompts[i],
          seed: this.createConsistentSeed(baseSeed, i),
          aspectRatio: '16:9',
          visualStyle: continuity.style,
          continuityElements: continuity.characters,
        });
      }
    }
    
    const enhancedFrames: string[] = [];
    const videoPromises: Promise<string>[] = [];
    const continuity = this.extractVisualContinuity(tasks.map(t => t.prompt));
    
    onProgress?.({ scene: 0, stage: 'Starting autonomous frame enhancement process' });
    
    // Process frames sequentially for continuity, but prepare for parallel video generation
    let previousFrameDataUrl = initialImage;
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      onProgress?.({ 
        scene: i + 1, 
        stage: 'Enhancing frame with Seedream',
        details: `Creating reference frame for scene ${i + 1} with ${continuity.style} style`
      });
      
      try {
        // Create enhanced frame
        const enhancedFrame = await this.createEnhancedFrame(
          task, 
          continuity, 
          previousFrameDataUrl
        );
        
        enhancedFrames.push(enhancedFrame);
        task.enhancedFrame = enhancedFrame;
        
        onProgress?.({ 
          scene: i + 1, 
          stage: 'Frame enhanced successfully',
          details: 'Preparing video generation task'
        });
        
        // Prepare video generation with enhanced frame
        task.videoTask = this.generateVideoWithEnhancedFrame(task);
        videoPromises.push(task.videoTask);
        
        // Store frame for continuity
        previousFrameDataUrl = enhancedFrame;
        
      } catch (error) {
        console.error(`Failed to process scene ${i + 1}:`, error);
        throw new Error(`Frame enhancement failed at scene ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    onProgress?.({ scene: tasks.length, stage: 'All frames enhanced', details: 'Ready for parallel video generation' });
    
    return { enhancedFrames, videoPromises, mode, tasks };
  }
  
  /**
   * Generates video with enhanced frame
   */
  private async generateVideoWithEnhancedFrame(task: FrameEnhancementTask): Promise<string> {
    return new Promise((resolve, reject) => {
      // Add delay to allow frame processing to complete
      setTimeout(async () => {
        try {
          const videoUrl = await generateVideoChunkWithKie(task.prompt, task.enhancedFrame);
          resolve(videoUrl);
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }
  
  /**
   * Executes all video generation tasks in parallel
   */
  async executeParallelGeneration(
    videoPromises: Promise<string>[],
    onProgress?: (update: { completed: number; total: number; details?: string }) => void
  ): Promise<string[]> {
    const totalVideos = videoPromises.length;
    const completedVideos: string[] = [];
    const ongoingPromises: Promise<void>[] = [];
    
    onProgress?.({ completed: 0, total: totalVideos, details: 'Starting parallel video generation' });
    
    // Create wrapper promises to track completion
    videoPromises.forEach((videoPromise, index) => {
      const wrappedPromise = videoPromise
        .then(videoUrl => {
          completedVideos[index] = videoUrl;
          onProgress?.({ 
            completed: completedVideos.filter(Boolean).length, 
            total: totalVideos,
            details: `Completed scene ${index + 1} video generation`
          });
        })
        .catch(error => {
          console.error(`Video generation failed for scene ${index + 1}:`, error);
          throw error;
        });
      
      ongoingPromises.push(wrappedPromise);
    });
    
    // Wait for all videos to complete
    await Promise.all(ongoingPromises);
    
    onProgress?.({ completed: totalVideos, total: totalVideos, details: 'All videos generated successfully' });
    
    return completedVideos;
  }
}

export const autonomousFrameAgent = new AutonomousFrameAgent();
