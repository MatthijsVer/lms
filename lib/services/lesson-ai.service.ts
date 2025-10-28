// lib/services/lesson-ai.service.ts
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

// Content block schemas for validation
export const QuizContentSchema = z.object({
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean()
  })),
  explanation: z.string(),
  points: z.number().default(10),
  allowMultipleAttempts: z.boolean().default(true),
  showCorrectAnswer: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true)
});

export const FillInBlankContentSchema = z.object({
  text: z.string(),
  instructions: z.string(),
  blanks: z.array(z.object({
    id: z.string(),
    correctAnswers: z.array(z.string()),
    caseSensitive: z.boolean().default(false),
    allowPartialCredit: z.boolean().default(false),
    hint: z.string().optional()
  })),
  points: z.number().default(5),
  showHints: z.boolean().default(true)
});

export const MatchingContentSchema = z.object({
  title: z.string().optional(),
  instructions: z.string(),
  pairs: z.array(z.object({
    id: z.string(),
    leftItem: z.string(),
    rightItem: z.string(),
    explanation: z.string().optional()
  })),
  shuffleItems: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  allowHints: z.boolean().default(true),
  points: z.number().default(5),
  timeLimit: z.number().optional()
});

export const OrderingContentSchema = z.object({
  title: z.string().optional(),
  instructions: z.string(),
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    correctPosition: z.number(),
    explanation: z.string().optional(),
    hint: z.string().optional()
  })),
  shuffleItems: z.boolean().default(true),
  showPositionNumbers: z.boolean().default(true),
  allowPartialCredit: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  allowHints: z.boolean().default(true),
  points: z.number().default(5),
  timeLimit: z.number().optional()
});

export const DragDropContentSchema = z.object({
  title: z.string().optional(),
  instructions: z.string(),
  tokens: z.array(z.object({
    id: z.string(),
    text: z.string(),
    correctTargets: z.array(z.string()),
    hint: z.string().optional()
  })),
  targets: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    maxItems: z.number().optional(),
    acceptsMultiple: z.boolean().default(true)
  })),
  shuffleTokens: z.boolean().default(true),
  showTargetLabels: z.boolean().default(true),
  allowPartialCredit: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  allowHints: z.boolean().default(true),
  returnToBank: z.boolean().default(true),
  points: z.number().default(5),
  timeLimit: z.number().optional()
});

export const TimelineContentSchema = z.object({
  title: z.string().optional(),
  instructions: z.string(),
  events: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    time: z.string().optional(),
    type: z.enum(["milestone", "event", "deadline", "achievement"]).default("event"),
    icon: z.string().optional(),
    color: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })),
  layout: z.enum(["vertical", "horizontal"]).default("vertical"),
  showDates: z.boolean().default(true),
  showTimes: z.boolean().default(true),
  chronological: z.boolean().default(true),
  allowPartialCredit: z.boolean().default(true),
  shuffleEvents: z.boolean().default(true),
  allowHints: z.boolean().default(true),
  points: z.number().default(5)
});

export const TextContentSchema = z.object({
  title: z.string(),
  text: z.string(),
  markdown: z.boolean().default(true)
});

export const VideoContentSchema = z.object({
  title: z.string(),
  videoKey: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional()
});

// Main lesson schema
export const LessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  position: z.number().default(1),
  contentBlocks: z.array(z.object({
    type: z.enum([
      'VIDEO', 'TEXT', 'IMAGE', 'QUIZ', 'EXERCISE',
      'CODE', 'PDF', 'AUDIO', 'DOWNLOAD', 'FILL_IN_BLANK', 'FLASHCARD', 'MATCHING', 'ORDERING', 'DRAG_DROP', 'TIMELINE'
    ]),
    position: z.number(),
    content: z.record(z.any())
  }))
});

export class LessonAIService {
  private static instance: LessonAIService;

  private constructor() {}

  static getInstance(): LessonAIService {
    if (!LessonAIService.instance) {
      LessonAIService.instance = new LessonAIService();
    }
    return LessonAIService.instance;
  }

  async generateLessonConversation(messages: any[], options?: {
    generateJson?: boolean;
    temperature?: number;
    model?: string;
  }) {
    const systemPrompt = this.getSystemPrompt();
    
    try {
      const completion = await openai.chat.completions.create({
        model: options?.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: 4000,
        response_format: options?.generateJson ? { type: "json_object" } : undefined,
      });

      const response = completion.choices[0].message;
      
      // Extract JSON if present
      let lessonData = null;
      if (response.content) {
        const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            lessonData = JSON.parse(jsonMatch[1]);
            // Validate the structure
            LessonSchema.parse(lessonData);
          } catch (e) {
            console.error('JSON parsing/validation error:', e);
          }
        }
      }

      return {
        message: response.content,
        lessonData,
        role: response.role
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate lesson content');
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert educational content creator specializing in creating structured, engaging lessons. Your role is to have a natural conversation with educators to understand their needs and generate comprehensive lesson plans.

## Conversation Flow

1. **Greeting & Topic Discovery**
   - Start with a warm, professional greeting
   - Ask about the subject/topic they want to teach
   - Show enthusiasm about their choice

2. **Audience & Level Assessment**
   - Determine target audience (age group, background)
   - Assess skill level: Beginner, Intermediate, or Advanced
   - Understand prerequisites if any

3. **Learning Objectives**
   - Ask for 2-4 specific learning objectives
   - Help refine objectives to be measurable and clear
   - Ensure objectives match the skill level

4. **Content Preferences**
   - Explore preferred content types:
     * TEXT: Explanatory content, concepts
     * VIDEO: Visual demonstrations (note: placeholder keys will be used)
     * QUIZ: Multiple choice questions for assessment
     * FILL_IN_BLANK: Interactive completion exercises
     * MATCHING: Pair matching activities for relationships/associations
     * ORDERING: Sequential arrangement of steps/processes/events
     * DRAG_DROP: Categorization by dragging tokens into target areas
     * TIMELINE: Chronological or sequential display of events with detailed information
     * EXERCISE: Practice problems
     * CODE: Programming examples (if applicable)
   - Understand the balance they want

5. **Duration & Pacing**
   - Determine total lesson duration
   - Suggest appropriate pacing for the content

6. **Review & Generation**
   - Summarize what you've learned
   - Confirm details before generation
   - When ready, generate complete lesson structure

## JSON Generation Guidelines

When generating the lesson JSON, create rich, educational content:

### TEXT Blocks
- Clear, engaging explanations
- Use markdown for formatting
- Include examples and analogies
- Break complex topics into digestible sections

### QUIZ Blocks
- Create thoughtful questions that test understanding
- Provide 4 options typically
- Include clear explanations for correct answers
- Vary difficulty based on lesson level
- Always mark correct answers properly

### FILL_IN_BLANK Blocks
- Create meaningful sentences with strategic blanks
- Use {{blank}} format in the text
- Provide multiple acceptable answers when appropriate
- Include helpful hints
- Target key vocabulary or concepts

### MATCHING Blocks
- Create pairs of related items for students to connect
- Use for relationships, definitions, cause-effect, etc.
- Include explanations for each pair when helpful
- Typically 4-6 pairs work best for engagement
- Left items should be concise, right items can be longer

### ORDERING Blocks
- Create sequences of steps, events, or processes to be arranged
- Perfect for procedures, timelines, workflows, recipes
- Include explanations for why each item goes in its position
- Typically 4-8 items work best for cognitive load
- Consider chronological, logical, or priority-based ordering

### DRAG_DROP Blocks
- Create categorization activities with draggable tokens and target areas
- Perfect for sorting items by properties, types, or categories
- Tokens can belong to multiple targets or just one
- Include clear target labels and descriptions
- Typically 6-12 tokens across 2-4 targets work well

### TIMELINE Blocks
- Create interactive chronological ordering exercises where students arrange events in correct sequence
- Perfect for historical sequences, process steps, project timelines, biographical events
- Events should have clear titles, accurate dates, and descriptions (used as hints)
- Use appropriate event types: milestone, event, deadline, achievement
- Typically 4-8 events work best for an engaging ordering challenge
- Students drag and drop events into chronological order from earliest to latest
- Include meaningful descriptions that can serve as helpful hints after submission

### Example Structure:
\`\`\`json
{
  "title": "Introduction to [Topic]",
  "description": "A comprehensive [level] lesson covering [main concepts]",
  "position": 1,
  "contentBlocks": [
    {
      "type": "TEXT",
      "position": 1,
      "content": {
        "title": "Introduction",
        "text": "Welcome to this lesson on [topic]. You'll learn...",
        "markdown": true
      }
    },
    {
      "type": "QUIZ",
      "position": 2,
      "content": {
        "question": "What is...?",
        "options": [
          {"id": "1", "text": "Correct answer", "isCorrect": true},
          {"id": "2", "text": "Distractor 1", "isCorrect": false},
          {"id": "3", "text": "Distractor 2", "isCorrect": false},
          {"id": "4", "text": "Distractor 3", "isCorrect": false}
        ],
        "explanation": "The correct answer is... because...",
        "points": 10,
        "allowMultipleAttempts": true,
        "showCorrectAnswer": true,
        "randomizeOptions": true
      }
    },
    {
      "type": "FILL_IN_BLANK",
      "position": 3,
      "content": {
        "text": "The {{blank}} is responsible for {{blank}} in the system.",
        "instructions": "Complete the sentence with the appropriate terms.",
        "blanks": [
          {
            "id": "blank1",
            "correctAnswers": ["answer1", "alternative1"],
            "caseSensitive": false,
            "allowPartialCredit": false,
            "hint": "Think about the main component"
          },
          {
            "id": "blank2",
            "correctAnswers": ["answer2"],
            "caseSensitive": false,
            "allowPartialCredit": false,
            "hint": "What is its primary function?"
          }
        ],
        "points": 5,
        "showHints": true
      }
    },
    {
      "type": "MATCHING",
      "position": 4,
      "content": {
        "title": "Match Related Items",
        "instructions": "Draw lines to connect each item on the left with its matching item on the right.",
        "pairs": [
          {
            "id": "pair1",
            "leftItem": "Capital of France",
            "rightItem": "Paris",
            "explanation": "Paris has been the capital of France since 987 AD."
          },
          {
            "id": "pair2",
            "leftItem": "Largest Ocean",
            "rightItem": "Pacific",
            "explanation": "The Pacific Ocean covers about 46% of the Earth's water surface."
          }
        ],
        "shuffleItems": true,
        "showFeedback": true,
        "allowHints": true,
        "points": 5
      }
    },
    {
      "type": "ORDERING",
      "position": 5,
      "content": {
        "title": "Steps in Order",
        "instructions": "Drag and drop the steps to arrange them in the correct order.",
        "items": [
          {
            "id": "step1",
            "text": "Gather all ingredients",
            "correctPosition": 0,
            "explanation": "Always start by preparing all materials before beginning.",
            "hint": "This should be done first"
          },
          {
            "id": "step2",
            "text": "Preheat the oven",
            "correctPosition": 1,
            "explanation": "Preheating ensures consistent cooking temperature.",
            "hint": "Temperature is important for cooking"
          },
          {
            "id": "step3",
            "text": "Mix dry ingredients",
            "correctPosition": 2,
            "explanation": "Dry ingredients should be combined before adding wet ingredients.",
            "hint": "Start with the powders and solids"
          }
        ],
        "shuffleItems": true,
        "showPositionNumbers": true,
        "allowPartialCredit": true,
        "showFeedback": true,
        "allowHints": true,
        "points": 5
      }
    },
    {
      "type": "DRAG_DROP",
      "position": 6,
      "content": {
        "title": "Categorize Items",
        "instructions": "Drag each token from the bank into the correct category.",
        "tokens": [
          {
            "id": "token1",
            "text": "Apple",
            "correctTargets": ["fruits"],
            "hint": "This grows on trees"
          },
          {
            "id": "token2",
            "text": "Carrot",
            "correctTargets": ["vegetables"],
            "hint": "This grows underground"
          },
          {
            "id": "token3",
            "text": "Red",
            "correctTargets": ["colors"],
            "hint": "This is a primary color"
          }
        ],
        "targets": [
          {
            "id": "fruits",
            "label": "Fruits",
            "description": "Sweet foods that grow on plants",
            "acceptsMultiple": true
          },
          {
            "id": "vegetables",
            "label": "Vegetables",
            "description": "Nutritious plant parts we eat",
            "acceptsMultiple": true
          },
          {
            "id": "colors",
            "label": "Colors",
            "description": "Visual properties we can see",
            "acceptsMultiple": true
          }
        ],
        "shuffleTokens": true,
        "showTargetLabels": true,
        "allowPartialCredit": true,
        "showFeedback": true,
        "allowHints": true,
        "returnToBank": true,
        "points": 5
      }
    },
    {
      "type": "TIMELINE",
      "position": 7,
      "content": {
        "title": "Historical Development Timeline",
        "instructions": "Drag and drop the events to arrange them in chronological order from earliest to latest.",
        "events": [
          {
            "id": "event1",
            "title": "Early Discovery",
            "description": "This discovery happened in the mid-19th century and laid the foundation for all future work.",
            "date": "1850-01-15",
            "type": "milestone",
            "color": "#fbbf24"
          },
          {
            "id": "event2", 
            "title": "Major Breakthrough", 
            "description": "This achievement occurred in the early 20th century and revolutionized the field.",
            "date": "1920-06-10",
            "time": "14:30",
            "type": "achievement",
            "color": "#10b981"
          },
          {
            "id": "event3",
            "title": "Modern Application",
            "description": "This development happened at the turn of the 21st century.",
            "date": "2000-12-01",
            "type": "event",
            "color": "#3b82f6"
          }
        ],
        "layout": "vertical",
        "showDates": true,
        "showTimes": true,
        "chronological": true,
        "allowPartialCredit": true,
        "shuffleEvents": true,
        "allowHints": true,
        "points": 5
      }
    }
  ]
}
\`\`\`

## Important Rules:
1. Always maintain a conversational, helpful tone
2. Generate age-appropriate and level-appropriate content
3. Ensure all quizzes have exactly one or more correct answers clearly marked
4. Create diverse content types for engagement
5. Include clear learning checkpoints
6. End lessons with a summary or review
7. When the user says "generate", "create", "yes", or "proceed" after the review, generate the complete JSON
8. Always wrap JSON in markdown code blocks with \`\`\`json\`\`\`

Remember: You're helping educators create effective, engaging lessons. Be creative, thorough, and pedagogically sound in your content generation.`;
  }

  async validateLesson(lessonData: any): Promise<boolean> {
    try {
      LessonSchema.parse(lessonData);
      return true;
    } catch (error) {
      console.error('Lesson validation failed:', error);
      return false;
    }
  }
}

export default LessonAIService;
