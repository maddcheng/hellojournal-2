
export const journalPrompts = [
  "What brought you joy today?",
  "Describe a moment that challenged you recently.",
  "What are you grateful for right now?",
  "If you could talk to your future self, what would you say?",
  "What's something you'd like to accomplish this week?",
  "Reflect on a recent conversation that stayed with you.",
  "How did you practice self-care today?",
  "What's one small thing you could do today to make progress toward your goals?",
  "Write about something beautiful you noticed recently.",
  "What's a lesson you've learned this month?",
  "Describe your ideal day. What elements could you incorporate into today?",
  "What boundaries do you need to set or maintain?",
  "What's something you're looking forward to?",
  "Who inspired you recently and why?",
  "What would make today great?",
  "What's a challenge you're facing, and what might help?",
  "Write about a memory that made you smile.",
  "What are three things you appreciate about yourself?",
  "How have you grown in the past year?",
  "What would you tell your younger self?",
];

export const getRandomPrompt = (): string => {
  const randomIndex = Math.floor(Math.random() * journalPrompts.length);
  return journalPrompts[randomIndex];
};

// Template prompts for the AI generator
export const templatePrompts = {
  monthly: "Create a monthly planner template with dates, goals section, and habit tracker.",
  weekly: "Design a weekly planner with days of the week, priorities section, and notes area.",
  daily: "Generate a daily planner with schedule, tasks, priorities, and reflection section.",
  bullet: "Create a bullet journal spread with index, future log, and collections.",
  cornell: "Design a Cornell note-taking template with cue column, notes section, and summary area.",
  blank: "Create a minimal blank page with subtle guidelines.",
};

export const getTemplatePrompt = (templateType: string): string => {
  return templatePrompts[templateType as keyof typeof templatePrompts] || 
    "Create a journal template based on user requirements.";
};
