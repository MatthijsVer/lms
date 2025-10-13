import OpenAI from "openai";
import {
  AiCourseStructure,
  AiCourseStructureSchema,
  AiChapter,
  AiChapterSchema,
} from "./course-structure";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JSON_REGEX = /```json\n([\s\S]*?)\n```/;

const CHAT_SYSTEM_PROMPT = `You are an expert educational content creator. Your role is to have a conversation with the user to gather information about the lesson they want to create, and then generate a complete lesson structure in JSON format.

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
  * CODE_EXERCISE – { title?, prompt, starterCode, solution?, tests[{description,code}] } — tests should use an assert(condition, message?) helper; learners run them in-browser.
- Create engaging and educational content
- Ensure quizzes have proper structure with correct/incorrect answers
- For FILL_IN_BLANK, create meaningful sentences with appropriate blanks
- Make content appropriate for the specified skill level

When the user confirms they want the lesson generated, respond with:
1. A confirmation message
2. A JSON code block with the complete lesson structure`.trim();

const VIDEO_PROMPT = `You are given source material derived from a course video. Create a complete course as JSON following this format:
{
  "title": "...",
  "smallDescription": "...",
  "description": "...",
  "level": "Beginner|Intermediate|Advanced",
  "duration": number (hours),
  "price": number (USD),
  "category": "...",
  "status": "Draft",
  "chapters": [
    {
      "title": "...",
      "overview": "...",
      "position": 1,
      "lessons": [
        {
          "title": "...",
          "description": "...",
          "position": 1,
          "contentBlocks": [ ... blocks defined in the schema above ... ]
        }
      ]
    }
  ]
}

Use the transcript to derive learning objectives, lesson outlines, and engaging content blocks.`.trim();

const DOCUMENT_PROMPT = `You are given course source material from a document. Summarise it into a complete online course JSON using the same schema. Extract key sections to form chapters and lessons, mixing appropriate content block types for engagement.`.trim();

type ChatMessage = {
  role: "assistant" | "user" | "system";
  content: string;
};

function parseCourseJson(message: string): AiCourseStructure | null {
  const match = message.match(JSON_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    const sanitised = sanitiseCourseStructure(parsed);
    return AiCourseStructureSchema.parse(sanitised);
  } catch (error) {
    console.error("Failed to parse AI course JSON:", error);
    return null;
  }
}

export async function generateCourseFromChat(
  messages: ChatMessage[],
  generateJson: boolean
) {
  const conversation = generateJson
    ? [
        ...messages,
        {
          role: "user" as const,
          content: "Please generate the complete course structure in JSON format now.",
        },
      ]
    : messages;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...conversation,
    ],
    temperature: 0.7,
    max_tokens: 3500,
  });

  const assistantContent = completion.choices[0].message.content ?? "";
  const courseJson = parseCourseJson(assistantContent);

  return {
    message: assistantContent,
    courseJson,
    role: "assistant" as const,
  };
}

export async function generateCourseFromSource(
  mode: "video" | "document",
  sourceText: string
) {
  const systemPrompt =
    mode === "video" ? VIDEO_PROMPT : DOCUMENT_PROMPT;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `${systemPrompt}\n\nRemember to include diverse content blocks and realistic durations/pricing.`,
      },
      {
        role: "user",
        content: `Source material:\n"""\n${sourceText}\n"""`,
      },
    ],
    temperature: 0.6,
    max_tokens: 3500,
  });

  const assistantContent = completion.choices[0].message.content ?? "";
  const courseJson = parseCourseJson(assistantContent);

  return {
    message: assistantContent,
    courseJson,
    role: "assistant" as const,
  };
}

function chunkText(text: string, maxLength = 4000) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return [clean];

  const chunks: string[] = [];
  let current = "";
  const sentences = clean.split(/(?<=[.?!])\s+/);

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }
  if (current.trim().length) {
    chunks.push(current.trim());
  }
  return chunks;
}

export async function summarizeLargeText(text: string) {
  const chunks = chunkText(text);
  if (chunks.length === 1) return chunks[0];

  const summaries: string[] = [];
  for (const chunk of chunks) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarize the following course source text into concise bullet points capturing key themes, skills, and structure. Keep under 200 words.",
        },
        { role: "user", content: chunk },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });
    summaries.push(completion.choices[0].message.content ?? "");
  }

  return summaries.join("\n");
}

export { openai };

const allowedBlockTypes = new Set([
  "VIDEO",
  "TEXT",
  "IMAGE",
  "QUIZ",
  "EXERCISE",
  "CODE",
  "CODE_EXERCISE",
  "PDF",
  "AUDIO",
  "DOWNLOAD",
  "FILL_IN_BLANK",
  "FLASHCARD",
  "MATCHING",
  "ORDERING",
  "DRAG_DROP",
  "TIMELINE",
]);

function sanitiseCourseStructure(raw: any) {
  if (!raw || typeof raw !== "object") return raw;
  const course = { ...raw };

  if (!course.title || typeof course.title !== "string") {
    course.title = "Generated Course";
  }
  if (!course.smallDescription || typeof course.smallDescription !== "string") {
    course.smallDescription = "AI generated course outline.";
  }
  if (!course.description || typeof course.description !== "string") {
    course.description =
      "This course was generated by the AI course builder. Review and edit as needed before publishing.";
  }
  if (!["Beginner", "Intermediate", "Advanced"].includes(course.level)) {
    course.level = "Intermediate";
  }
  if (typeof course.duration !== "number" || course.duration <= 0) {
    course.duration = 6;
  }
  if (typeof course.price !== "number" || course.price < 0) {
    course.price = 0;
  }
  if (!course.category || typeof course.category !== "string") {
    course.category = "General";
  }

  course.chapters = Array.isArray(course.chapters) ? course.chapters : [];

  course.chapters = course.chapters.map((chapter: any, chapterIdx: number) => {
    const safeChapter = { ...chapter };
    safeChapter.position =
      typeof safeChapter.position === "number"
        ? safeChapter.position
        : chapterIdx + 1;
    safeChapter.lessons = Array.isArray(safeChapter.lessons)
      ? safeChapter.lessons
      : [];

    safeChapter.lessons = safeChapter.lessons.map(
      (lesson: any, lessonIdx: number) => {
        const safeLesson = { ...lesson };
        safeLesson.position =
          typeof safeLesson.position === "number"
            ? safeLesson.position
            : lessonIdx + 1;
        safeLesson.contentBlocks = Array.isArray(safeLesson.contentBlocks)
          ? safeLesson.contentBlocks
          : [];

        safeLesson.contentBlocks = safeLesson.contentBlocks
          .map((block: any, blockIdx: number) => sanitiseBlock(block, blockIdx))
          .filter(Boolean);

        return safeLesson;
      }
    );

    return safeChapter;
  });

  return course;
}

function sanitiseBlock(block: any, index: number) {
  if (!block || typeof block !== "object") return null;

  let type =
    typeof block.type === "string" ? block.type.trim().toUpperCase() : "";

  if (!allowedBlockTypes.has(type)) {
    if (type === "VIDEO" || type === "TEXT") {
      // already upper case
    } else {
      // attempt heuristic: convert lowercase names
      const upper = type.toUpperCase();
      if (allowedBlockTypes.has(upper)) {
        type = upper;
      } else {
        return null;
      }
    }
  }

  const position =
    typeof block.position === "number" ? block.position : index + 1;

  let content = block.content;
  if (typeof content === "string") {
    if (type === "TEXT" || type === "FLASHCARD") {
      content = { text: content };
    } else if (type === "VIDEO") {
      content = { description: content };
    } else if (type === "PDF" || type === "DOWNLOAD") {
      content = { description: content, title: "Generated content" };
    } else if (type === "CODE" || type === "CODE_EXERCISE") {
      content = { code: content, language: "javascript" };
    } else {
      content = { text: content };
    }
  }

  if (!content || typeof content !== "object") {
    content = {};
  }

  return {
    ...block,
    type,
    position,
    content,
  };
}
