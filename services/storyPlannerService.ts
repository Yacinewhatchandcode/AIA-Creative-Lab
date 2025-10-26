// Free local story planning service without external API dependencies

const DEFAULT_SCENE_COUNT = 3;
const MIN_SCENE_COUNT = 2;
const MAX_SCENE_COUNT = 8;

const STORY_TEMPLATES = {
  action: [
    "Opening scene establishing the challenge",
    "Rising action with increasing tension",
    "Climax confrontation",
    "Resolution and aftermath"
  ],
  adventure: [
    "Introduction to the quest or journey",
    "First obstacle or challenge",
    "Mid-journey development",
    "Final challenge and discovery",
    "Return with newfound wisdom"
  ],
  drama: [
    "Setup introducing characters and situation",
    "Inciting incident changes everything",
    "Rising action with complications",
    "Climax emotional peak",
    "Resolution showing transformation"
  ],
  comedy: [
    "Setup with comedic premise",
    "Escalation of humorous situations",
    "Comic misadventures",
    "Climax humorous resolution",
    "Wrap-up with final joke"
  ],
  default: [
    "Introduction to characters and setting",
    "Development of the main situation",
    "Rising action with challenges",
    "Climactic moment",
    "Resolution and conclusion"
  ]
};

const detectStoryType = (prompt: string): keyof typeof STORY_TEMPLATES => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('action') || lowerPrompt.includes('fight') || lowerPrompt.includes('battle')) {
    return 'action';
  }
  if (lowerPrompt.includes('adventure') || lowerPrompt.includes('journey') || lowerPrompt.includes('quest')) {
    return 'adventure';
  }
  if (lowerPrompt.includes('drama') || lowerPrompt.includes('emotional') || lowerPrompt.includes('relationship')) {
    return 'drama';
  }
  if (lowerPrompt.includes('comedy') || lowerPrompt.includes('funny') || lowerPrompt.includes('humor')) {
    return 'comedy';
  }
  
  return 'default';
};

const determineSceneCount = (prompt: string): number => {
  const lowerPrompt = prompt.toLowerCase();
  let count = DEFAULT_SCENE_COUNT;
  
  // Increase scene count for complex stories
  if (lowerPrompt.includes('epic') || lowerPrompt.includes('long') || lowerPrompt.includes('detailed')) {
    count += 2;
  }
  if (lowerPrompt.includes('short') || lowerPrompt.includes('quick') || lowerPrompt.includes('simple')) {
    count = Math.max(MIN_SCENE_COUNT, count - 1);
  }
  
  // Adjust based on content complexity
  const complexityWords = ['transformation', 'evolution', 'journey', 'series of events', 'multiple'];
  const hasComplexity = complexityWords.some(word => lowerPrompt.includes(word));
  if (hasComplexity) {
    count += 1;
  }
  
  return Math.max(MIN_SCENE_COUNT, Math.min(MAX_SCENE_COUNT, count));
};

export const decideSceneCount = async (prompt: string): Promise<number> => {
  // Simulate processing time for better UX
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return determineSceneCount(prompt);
};

export const planStory = async (prompt: string, numChunks: number): Promise<string[]> => {
  // Simulate processing time for better UX
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const storyType = detectStoryType(prompt);
  const template = STORY_TEMPLATES[storyType];
  const scenes: string[] = [];
  
  // Extract key elements from the prompt
  const promptLower = prompt.toLowerCase();
  const elements = {
    character: extractCharacter(prompt),
    setting: extractSetting(prompt),
    action: extractAction(prompt),
    mood: extractMood(prompt)
  };
  
  for (let i = 0; i < numChunks; i++) {
    const templatePhase = template[Math.min(i, template.length - 1)];
    const scenePrompt = enhanceScenePrompt(
      prompt,
      elements,
      templatePhase,
      i + 1,
      numChunks
    );
    scenes.push(scenePrompt);
  }
  
  return scenes;
};

const extractCharacter = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  const characterKeywords = ['person', 'man', 'woman', 'child', 'guy', 'girl', 'character', 'hero', 'protagonist'];
  
  for (const keyword of characterKeywords) {
    if (lowerPrompt.includes(keyword)) {
      const words = prompt.split(' ');
      const index = words.findIndex(w => w.toLowerCase().includes(keyword));
      if (index !== -1 && index + 2 < words.length) {
        return words.slice(index, index + 3).join(' ');
      }
    }
  }
  
  return 'a character';
};

const extractSetting = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  const settingKeywords = ['in', 'at', 'on', 'inside', 'outside', 'city', 'forest', 'house', 'mountain', 'beach'];
  
  for (const keyword of settingKeywords) {
    if (lowerPrompt.includes(keyword)) {
      const words = prompt.split(' ');
      const index = words.findIndex(w => w.toLowerCase() === keyword);
      if (index !== -1 && index + 2 < words.length) {
        return words.slice(index, index + 3).join(' ');
      }
    }
  }
  
  return 'a setting';
};

const extractAction = (prompt: string): string => {
  const verbs = prompt.split(' ').filter(word => 
    ['running', 'jumping', 'flying', 'fighting', 'dancing', 'singing', 'building', 'exploring', 'creating', 'transforming']
      .some(verb => word.toLowerCase().includes(verb))
  );
  
  return verbs.length > 0 ? verbs[0] : 'doing something';
};

const extractMood = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  const moods = {
    'happy': ['happy', 'joyful', 'cheerful', 'bright', 'sunny'],
    'sad': ['sad', 'somber', 'dark', 'melancholy', 'gloomy'],
    'exciting': ['exciting', 'thrilling', 'adventurous', 'action-packed', 'dynamic'],
    'calm': ['calm', 'peaceful', 'serene', 'quiet', 'gentle'],
    'mysterious': ['mysterious', 'enigmatic', 'puzzling', 'secret', 'hidden']
  };
  
  for (const [mood, keywords] of Object.entries(moods)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      return mood;
    }
  }
  
  return 'engaging';
};

const enhanceScenePrompt = (
  originalPrompt: string,
  elements: { character: string; setting: string; action: string; mood: string },
  templatePhase: string,
  sceneNumber: number,
  totalScenes: number
): string => {
  const { character, setting, action, mood } = elements;
  
  // Create a cinematographic prompt based on the original idea and scene phase
  let scenePrompt = `${templatePhase}: `;
  
  // Add character and action
  scenePrompt += `${character} ${action} ${setting}. `;
  
  // Add mood and visual style
  scenePrompt += `${mood} atmosphere, `;
  
  // Add cinematic details based on scene position
  if (sceneNumber === 1) {
    scenePrompt += 'establishing shot, wide angle, ';
  } else if (sceneNumber === totalScenes) {
    scenePrompt += 'concluding scene, emotional resolution, ';
  } else {
    scenePrompt += 'dynamic scene, ';
  }
  
  // Add visual style
  scenePrompt += 'cinematic lighting, detailed environment, ';
  
  // Add original context
  scenePrompt += `inspired by: ${originalPrompt}`;
  
  return scenePrompt;
};
