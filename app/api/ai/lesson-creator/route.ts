// app/api/ai/lesson-creator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

// Schema for the lesson structure based on your Prisma schema
const ContentBlockSchema = z.object({
  type: z.enum([
    'VIDEO',
    'TEXT',
    'IMAGE',
    'QUIZ',
    'EXERCISE',
    'CODE',
    'CODE_EXERCISE',
    'PDF',
    'AUDIO',
    'DOWNLOAD',
    'FILL_IN_BLANK',
    'FLASHCARD',
    'MATCHING',
    'ORDERING',
    'DRAG_DROP',
    'TIMELINE',
  ]),
  position: z.number(),
  content: z.record(z.any()), // JSON content specific to each type
});

const LessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  thumbnailKey: z.string().optional(),
  position: z.number(),
  contentBlocks: z.array(ContentBlockSchema)
});

// System prompt for the AI
const SYSTEM_PROMPT = `You are an expert educational content creator. Your role is to have a conversation with the user to gather information about the lesson they want to create, and then generate a complete lesson structure in JSON format.

Your conversation should:
1. Be friendly and professional
2. Ask clarifying questions to understand:
   - The subject/topic
   - Target audience and skill level (Beginner/Intermediate/Advanced)
   - Learning objectives
   - Preferred content types (video, text, quizzes, exercises, etc.)
   - Estimated duration
   - Any specific requirements

After gathering enough information, generate a complete lesson structure following this schema:
- Use the appropriate content block types. Available types and their expected content keys are:
  * TEXT – { title?, text, format? ('markdown'|'html'|'plain') }
  * IMAGE – { imageKey, alt?, caption? }
  * VIDEO – { videoKey?, videoUrl?, title?, description?, duration?, thumbnailKey? }
  * AUDIO – { audioKey, title?, description?, transcript?, shouldShowTranscript? }
  * PDF – { pdfKey, title, description?, downloadable? }
  * DOWNLOAD – { fileKey, fileName, fileSize?, description? }
  * QUIZ – { question, options[{id,text,isCorrect}], explanation?, points?, allowMultipleAttempts?, showCorrectAnswer?, randomizeOptions? }
  * FILL_IN_BLANK – { text, instructions?, blanks[{id,correctAnswers[],caseSensitive?,allowPartialCredit?,hint?}], points?, showHints? }
  * FLASHCARD – { title?, instructions?, cards[{id,front,back,hint?}], shuffleCards?, showProgress?, allowFlip? }
  * MATCHING – { title?, instructions?, pairs[{id,leftItem,rightItem,explanation?}], shuffleItems?, showFeedback?, allowHints?, points?, timeLimit? }
  * ORDERING – { title?, instructions?, items[{id,text,correctPosition,explanation?,hint?}], shuffleItems?, showPositionNumbers?, allowPartialCredit?, showFeedback?, allowHints?, points?, timeLimit? }
  * DRAG_DROP – { title?, instructions?, tokens[{id,text,correctTargets[],hint?}], targets[{id,label,description?,maxItems?,acceptsMultiple?}], shuffleTokens?, showTargetLabels?, allowPartialCredit?, showFeedback?, allowHints?, returnToBank?, points?, timeLimit? }
  * TIMELINE – { title?, instructions?, events[{id,title,description?,date,time?,type?,icon?,color?,metadata?}], layout?, showDates?, showTimes?, chronological?, interactive?, allowNavigation?, showProgress?, allowPartialCredit?, shuffleEvents?, allowHints?, points? }
  * EXERCISE – { title?, instructions, expectedOutput?, hints[], points? }
  * CODE – { code, language, title?, runnable? }
  * CODE_EXERCISE – { title?, prompt, starterCode, solution?, tests[{description,code}] } — tests should use an \`assert(condition, message?)\` helper; learners run them in-browser.
- Create engaging and educational content
- Ensure quizzes have proper structure with correct/incorrect answers
- For FILL_IN_BLANK, create meaningful sentences with appropriate blanks
- Make content appropriate for the specified skill level

When the user confirms they want the lesson generated, respond with:
1. A confirmation message
2. A JSON code block with the complete lesson structure

The JSON should follow this structure:
{
  "title": "Lesson Title",
  "description": "Detailed description",
  "position": 1,
  "contentBlocks": [
    {
      "type": "TEXT",
      "position": 1,
      "content": {
        "title": "Section Title",
        "text": "Content text with **markdown** support",
        "markdown": true
      }
    },
    {
      "type": "QUIZ",
      "position": 2,
      "content": {
        "question": "Quiz question?",
        "options": [
          {"id": "1", "text": "Option 1", "isCorrect": true},
          {"id": "2", "text": "Option 2", "isCorrect": false}
        ],
        "explanation": "Why this answer is correct",
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
        "text": "The {{blank}} is an example sentence with {{blank}}.",
        "instructions": "Fill in the blanks",
        "blanks": [
          {
            "id": "1",
            "correctAnswers": ["answer1", "alternative1"],
            "caseSensitive": false,
            "allowPartialCredit": false,
            "hint": "Think about..."
          }
        ],
        "points": 5,
        "showHints": true
      }
    },
    {
      "type": "CODE_EXERCISE",
      "position": 4,
      "content": {
        "title": "Implement add(a, b)",
        "prompt": "Write a function add(a, b) that returns the numeric sum of both arguments.",
        "starterCode": "function add(a, b) {\n  // TODO: return the sum of a and b\n}\n",
        "solution": "function add(a, b) {\n  return a + b;\n}\n",
        "tests": [
          {
            "description": "adds two positive numbers",
            "code": "assert(add(2, 2) === 4, 'add(2, 2) should equal 4');"
          },
          {
            "description": "handles negative numbers",
            "code": "assert(add(-3, 5) === 2, 'add(-3, 5) should equal 2');"
          }
        ]
      }
    }
  ]
}

For code exercises include clear instructions, starter code, and at least one automated test using \`assert\`.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, generateJson } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // If this is a request to generate JSON, add a trigger message
    const conversationMessages = generateJson 
      ? [...messages, { role: 'user', content: 'Please generate the complete lesson structure in JSON format now.' }]
      : messages;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationMessages
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const assistantMessage = completion.choices[0].message;
    
    // Check if the response contains JSON
    let lessonJson = null;
    const jsonMatch = assistantMessage.content?.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch) {
      try {
        lessonJson = JSON.parse(jsonMatch[1]);
        // Validate against schema (optional)
        LessonSchema.parse(lessonJson);
      } catch (e) {
        console.error('Failed to parse or validate JSON:', e);
      }
    }

    return NextResponse.json({
      message: assistantMessage.content,
      lessonJson,
      role: 'assistant'
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
