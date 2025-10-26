import type { AgentStep } from './types';
import { PipelineStatus } from './types';
import {
  PencilIcon,
  FilmIcon,
  SparklesIcon,
  ShieldCheckIcon,
  AudioWaveIcon
} from './components/icons';

export const PIPELINE_AGENTS: AgentStep[] = [
  {
    name: 'Orchestrator Agent',
    description: 'Initializing multi-agent system and validating inputs.',
    status: PipelineStatus.PENDING,
    icon: ShieldCheckIcon,
  },
  {
    name: 'Story Planning Agent',
    description: 'Breaking down the narrative into sequential scenes.',
    status: PipelineStatus.PENDING,
    icon: PencilIcon,
  },
  {
    name: 'Scene Setup Agent',
    description: 'Preparing character models and visual continuity keyframes.',
    status: PipelineStatus.PENDING,
    icon: SparklesIcon,
  },
  {
    name: 'VEO Generation Agent',
    description: 'Generating video chunks with frame-to-frame continuity.',
    status: PipelineStatus.PENDING,
    icon: FilmIcon,
  },
  {
    name: 'Audio Synthesis Agent',
    description: 'Composing musical score and generating character voiceovers.',
    status: PipelineStatus.PENDING,
    icon: AudioWaveIcon,
  },
  {
    name: 'Post-Production Agent',
    description: 'Assembling scenes and audio into the final cinematic movie.',
    status: PipelineStatus.PENDING,
    icon: SparklesIcon,
  },
];
