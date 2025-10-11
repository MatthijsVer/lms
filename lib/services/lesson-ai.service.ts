// lib/services/lesson-ai.service.ts
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
      'CODE', 'PDF', 'AUDIO', 'DOWNLOAD', 'FILL_IN_BLANK', 'FLASHCARD'
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
- Use [______] format in the text
- Provide multiple acceptable answers when appropriate
- Include helpful hints
- Target key vocabulary or concepts

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
        "text": "The [______] is responsible for [______] in the system.",
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