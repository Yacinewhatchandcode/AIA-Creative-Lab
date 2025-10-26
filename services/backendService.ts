import { decideSceneCount, planStory } from './storyPlannerService';
import { generateVideoChunkWithKie } from './kieService';
import { autonomousFrameAgent } from './autonomousFrameAgent';
import { generateSceneAudioPackage } from './audioService';
import { fileToBase64 } from '../utils/imageUtils';
import type { AgentStep } from '../types';
import { PipelineStatus } from '../types';
import { PIPELINE_AGENTS } from '../constants';

// --- Types for the service ---
interface Refs {
  frameExtractionVideoRef: HTMLVideoElement | null;
  frameExtractionCanvasRef: HTMLCanvasElement | null;
  concatenationVideoRef: HTMLVideoElement | null;
  concatenationCanvasRef: HTMLCanvasElement | null;
}

interface RunParams {
  prompt: string;
  file: File | null;
  numChunks: number;
  isAutoMode: boolean;
  refs: Refs;
  onProgress: (update: any) => void;
}

// --- Helper Functions ---

const extractLastFrame = (videoUrl: string, refs: Refs): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { frameExtractionVideoRef: video, frameExtractionCanvasRef: canvas } = refs;
        if (!video || !canvas) return reject("Video or canvas refs not available for frame extraction");

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not available');

        video.src = videoUrl;
        video.load();

        const onSeeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            video.removeEventListener('seeked', onSeeked);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };

        video.addEventListener('loadedmetadata', () => {
            video.currentTime = video.duration > 0.1 ? video.duration - 0.1 : 0;
        });

        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', () => reject('Failed to load video for frame extraction'));
    });
};

const concatenateVideos = (chunkUrls: string[], refs: Refs): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { concatenationVideoRef: video, concatenationCanvasRef: canvas } = refs;
        if (!video || !canvas) return reject("Video or canvas refs not available for concatenation");

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not available');

        if (chunkUrls.length === 0) return reject("No video chunks to concatenate");

        const firstUrl = chunkUrls[0];
        const tempVideo = document.createElement('video');
        tempVideo.src = firstUrl;
        tempVideo.onloadedmetadata = () => {
            canvas.width = tempVideo.videoWidth;
            canvas.height = tempVideo.videoHeight;

            const stream = canvas.captureStream(24);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            const recordedBlobs: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) recordedBlobs.push(event.data);
            };
            recorder.onstop = () => {
                const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
                resolve(URL.createObjectURL(superBuffer));
            };

            recorder.start();

            let currentChunkIndex = 0;
            let rafId: number;

            function drawFrame() {
                if (!video || video.paused || video.ended) return;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                rafId = requestAnimationFrame(drawFrame);
            }

            video.onplay = drawFrame;
            video.onpause = video.onended = () => {
                cancelAnimationFrame(rafId);
                currentChunkIndex++;
                if (currentChunkIndex < chunkUrls.length) {
                    video.src = chunkUrls[currentChunkIndex];
                    video.play();
                } else {
                    recorder.stop();
                }
            };

            video.src = firstUrl;
            video.play().catch(reject);
        };
        tempVideo.onerror = () => reject("Failed to load first video for metadata");
    });
};


// --- Main Orchestration Service ---

export const runMovieGenerationPipeline = async (params: RunParams) => {
  const { prompt, file, numChunks, isAutoMode, refs, onProgress } = params;
  
  let currentSteps = [...PIPELINE_AGENTS];
  const updateStepStatus = (index: number, status: PipelineStatus, task: string | null = null) => {
    currentSteps = currentSteps.map((step, i) => i === index ? { ...step, status } : step);
    onProgress({ steps: currentSteps, currentTask: task });
  };

  try {
    let agentIndex = 0;

    // Agent 1: Orchestrator
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Initializing system...");
    let effectiveNumChunks = numChunks;
    if (isAutoMode) {
      onProgress({ currentTask: "Auto-planning: AI is deciding movie length..." });
      effectiveNumChunks = await decideSceneCount(prompt);
      onProgress({ numChunks: effectiveNumChunks });
    }
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 2: Story Analysis (integrated into Autonomous Agent)
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Analyzing content structure...");
    // Story planning is now handled autonomously based on user input type
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 3: Scene Setup
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Preparing visual assets...");
    let lastFrameDataUrl: string | undefined = undefined;
    if (file) {
      onProgress({ currentTask: `Processing initial image...` });
      lastFrameDataUrl = await fileToBase64(file);
    }
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 4: Autonomous Frame Enhancement & Parallel Video Generation
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS);
    
    onProgress({ currentTask: "Autonomous agent: analyzing input and preparing pipeline..." });
    
    // Stage 1: Frame Enhancement with Seedream (handles both script and idea mode)
    let frameUpdateCount = 0;
    const { enhancedFrames, videoPromises, mode, tasks: sceneTasks } = await autonomousFrameAgent.orchestrateFrameEnhancement(
      prompt, // Pass original prompt instead of storyPrompts
      lastFrameDataUrl,
      (update) => {
        frameUpdateCount++;
        onProgress({ 
          currentTask: `Autonomous agent: ${update.stage} (Scene ${update.scene})${update.details ? ` - ${update.details}` : ''}` 
        });
      }
    );
    
    // Update effective chunks if different from initial estimation
    if (mode === 'script' && enhancedFrames.length !== effectiveNumChunks) {
      onProgress({ numChunks: enhancedFrames.length });
      effectiveNumChunks = enhancedFrames.length;
    }
    
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Parallel video generation in progress...");
    
    // Stage 2: Parallel Video Generation
    let videoUpdateCount = 0;
    const generatedVideoUrls = await autonomousFrameAgent.executeParallelGeneration(
      videoPromises,
      (update) => {
        videoUpdateCount++;
        onProgress({ 
          currentTask: `Parallel generation: ${update.details} (${update.completed}/${update.total} videos)` 
        });
      }
    );
    
    // Convert to blob URLs
    const generatedChunkUrls: string[] = [];
    for (let i = 0; i < generatedVideoUrls.length; i++) {
      const videoUrlWithKey = generatedVideoUrls[i];
      const videoBlob = await fetch(videoUrlWithKey).then(res => res.blob());
      const localObjectUrl = URL.createObjectURL(videoBlob);
      generatedChunkUrls.push(localObjectUrl);
    }
    
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 5: Real Audio Synthesis
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Generating custom soundtrack...");
    
    const audioUrls: string[] = [];
    
    // Extract dialog from enhanced frames if any
    for (let i = 0; i < sceneTasks.length; i++) {
      const task = sceneTasks[i];
      const scenePrompt = task.prompt;
      const sceneDialog = task.dialog;
      
      onProgress({ currentTask: `Creating audio for Scene ${i + 1}...` });
      
      try {
        const audioUrl = await generateSceneAudioPackage(
          scenePrompt,
          sceneDialog,
          i,
          sceneTasks.length,
          (update) => {
            onProgress({ currentTask: `Scene ${i + 1} - ${update.stage}${update.details ? `: ${update.details}` : ''}` });
          }
        );
        audioUrls.push(audioUrl);
      } catch (audioError) {
        console.warn(`Audio generation failed for scene ${i + 1}:`, audioError);
        // Continue without audio for this scene
      }
    }
    
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 6: Post-Production
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Assembling final movie...");
    const finalUrl = await concatenateVideos(generatedChunkUrls, refs);
    onProgress({ finalVideoUrl: finalUrl });
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);

    // Cleanup local object URLs
    generatedChunkUrls.forEach(url => URL.revokeObjectURL(url));

  } catch (err) {
    let errorMessage = "An unknown error occurred.";
    if (err instanceof Error) errorMessage = err.message;
    else if (typeof err === 'string') errorMessage = err;
    
    onProgress({
      error: errorMessage,
      steps: currentSteps.map(step => step.status === PipelineStatus.IN_PROGRESS ? { ...step, status: PipelineStatus.FAILED } : step),
    });
  }
};