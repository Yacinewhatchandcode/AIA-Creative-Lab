import { decideSceneCount, planStory, generateVideoChunk } from './geminiService';
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    await sleep(1000); // Simulate init
    let effectiveNumChunks = numChunks;
    if (isAutoMode) {
      onProgress({ currentTask: "Auto-planning: AI is deciding movie length..." });
      effectiveNumChunks = await decideSceneCount(prompt);
      onProgress({ numChunks: effectiveNumChunks });
    }
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 2: Story Planner
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Planning the story...");
    const storyPrompts = await planStory(prompt, effectiveNumChunks);
     if (storyPrompts.length !== effectiveNumChunks) {
        throw new Error(`Story planner returned ${storyPrompts.length} prompts, expected ${effectiveNumChunks}.`);
     }
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 3: Scene Setup (Simulated)
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Preparing visual assets...");
    let lastFrameDataUrl: string | undefined = undefined;
    if (file) {
      onProgress({ currentTask: `Processing initial image...` });
      lastFrameDataUrl = await fileToBase64(file);
    }
    await sleep(1000); // Simulate asset prep
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 4: VEO Generation
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS);
    const generatedChunkUrls: string[] = [];
    for (let i = 0; i < effectiveNumChunks; i++) {
        updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, `Generating Scene ${i + 1} of ${effectiveNumChunks}...`);
        
        const videoUrlWithKey = await generateVideoChunk(storyPrompts[i], lastFrameDataUrl);
        const videoBlob = await fetch(videoUrlWithKey).then(res => res.blob());
        const localObjectUrl = URL.createObjectURL(videoBlob);
        
        generatedChunkUrls.push(localObjectUrl);
        
        if (i < effectiveNumChunks - 1) {
            updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, `Extracting final frame from Scene ${i + 1}...`);
            lastFrameDataUrl = await extractLastFrame(localObjectUrl, refs);
        }
    }
    updateStepStatus(agentIndex, PipelineStatus.COMPLETED);
    agentIndex++;

    // Agent 5: Audio Synthesis (Simulated)
    updateStepStatus(agentIndex, PipelineStatus.IN_PROGRESS, "Composing soundtrack and voiceover...");
    await sleep(3000); // Simulate audio work
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