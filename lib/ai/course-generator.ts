import OpenAI from "openai";
import {
  AiCourseStructure,
  AiCourseStructureSchema,
  AiChapter,
  AiChapterSchema,
} from "./course-structure";

const openAiKey = process.env.OPENAI_API_KEY ?? "";

const openai = new OpenAI({
  apiKey: openAiKey,
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

function parseChapterJson(message: string): AiChapter | null {
  const match = message.match(JSON_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    const chapterData = parsed.chapter ?? parsed;
    return AiChapterSchema.parse(chapterData);
  } catch (error) {
    console.error("Failed to parse AI chapter JSON:", error);
    return null;
  }
}

type CourseMetadata = {
  title: string;
  smallDescription: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: number;
  price: number;
  category: string;
  status?: "Draft" | "Published" | "Archived";
};

async function generateCourseMetadata(text: string): Promise<CourseMetadata> {
  const defaults: CourseMetadata = {
    title: "AI Generated Course",
    smallDescription: "Auto-generated course outline.",
    description:
      "This course outline was generated from source materials. Review and edit before publishing.",
    level: "Intermediate",
    duration: 6,
    price: 0,
    category: "General",
    status: "Draft",
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are preparing metadata for an online course. Read the notes provided and respond with a JSON code block containing the following keys:\n{\n  "title": string,\n  "smallDescription": string,\n  "description": string,\n  "level": "Beginner" | "Intermediate" | "Advanced",\n  "duration": number (in hours, 1-40),\n  "price": number (USD, 0-200),\n  "category": string,\n  "status": "Draft"\n}\nKeep descriptions concise and user-friendly.`,
        },
        {
          role: "user",
          content: text.slice(0, 6000),
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content ?? "";
    const match = content.match(JSON_REGEX);
    const jsonString = match ? match[1] : content;

    const parsed = JSON.parse(jsonString);
    return {
      title: parsed.title ?? defaults.title,
      smallDescription: parsed.smallDescription ?? defaults.smallDescription,
      description: parsed.description ?? defaults.description,
      level: ["Beginner", "Intermediate", "Advanced"].includes(parsed.level)
        ? parsed.level
        : defaults.level,
      duration:
        typeof parsed.duration === "number" && parsed.duration > 0
          ? Math.min(40, Math.max(1, parsed.duration))
          : defaults.duration,
      price:
        typeof parsed.price === "number" && parsed.price >= 0
          ? Math.min(200, parsed.price)
          : defaults.price,
      category: parsed.category ?? defaults.category,
      status: "Draft",
    };
  } catch (error) {
    console.error("Failed to generate course metadata:", error);
    return defaults;
  }
}

async function generateChapterFromChunk(
  chunk: string,
  chapterNumber: number,
  courseTitle: string
): Promise<AiChapter | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are helping design chapter #${chapterNumber} for the course "${courseTitle}". Using only the excerpt provided, create a JSON code block that matches this schema:\n{\n  "chapter": {\n    "title": string,\n    "overview": string,\n    "position": number,\n    "lessons": [\n      {\n        "title": string,\n        "description": string,\n        "position": number,\n        "contentBlocks": [\n          {\n            "type": "VIDEO" | "TEXT" | "IMAGE" | "QUIZ" | "EXERCISE" | "CODE" | "CODE_EXERCISE" | "PDF" | "AUDIO" | "DOWNLOAD" | "FILL_IN_BLANK" | "FLASHCARD" | "MATCHING" | "ORDERING" | "DRAG_DROP" | "TIMELINE",\n            "position": number,\n            "content": object\n          }\n        ]\n      }\n    ]\n  }\n}\nGuidelines: derive titles and descriptions from the excerpt, include 1-3 lessons, each with 2-4 relevant content blocks. Make sure contentBlocks have structured objects (e.g. TEXT blocks should include { "title": string, "text": string, "format": "markdown" }). Do not invent unrelated material.`,
      },
      {
        role: "user",
        content: `Excerpt:\n"""\n${chunk}\n"""`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1200,
  });

  const content = completion.choices[0].message.content ?? "";
  const chapter = parseChapterJson(content);
  if (!chapter) return null;

  const normalisedLessons = chapter.lessons.map((lesson, lessonIdx) => ({
    ...lesson,
    position: lesson.position ?? lessonIdx + 1,
    contentBlocks: (lesson.contentBlocks ?? []).map((block, blockIdx) => ({
      ...block,
      position: block.position ?? blockIdx + 1,
    })),
  }));

  return {
    title: chapter.title,
    overview: chapter.overview,
    position: chapter.position ?? chapterNumber,
    lessons: normalisedLessons,
  };
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
  const summary = await summarizeLargeText(sourceText);
  const metadata = await generateCourseMetadata(summary);
  const chunks = chunkText(sourceText, 1800);

  const chapters: AiChapter[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const outline = await generateChapterFromChunk(chunk, index + 1, metadata.title);
    if (outline) {
      chapters.push(outline);
    }
  }

  if (chapters.length === 0) {
    chapters.push({
      title: "Introduction",
      overview: metadata.smallDescription,
      lessons: [
        {
          title: metadata.title,
          description: metadata.description,
          position: 1,
          contentBlocks: [
            {
              type: "TEXT",
              position: 1,
              content: {
                title: "Overview",
                text: metadata.description,
                format: "markdown",
              },
            },
          ],
        },
      ],
    });
  }

  const course = sanitiseCourseStructure({
    ...metadata,
    chapters,
  });

  const message = `Generated course "${course.title}" with ${course.chapters.length} chapter${course.chapters.length === 1 ? "" : "s"} from the ${mode} source.`;

  return {
    message,
    courseJson: course,
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
  const chunks = chunkText(text, 2000);
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
  if (course.status !== "Published" && course.status !== "Archived") {
    course.status = "Draft";
  }

  course.chapters = Array.isArray(course.chapters) ? course.chapters : [];

  course.chapters = course.chapters.map((chapter: any, chapterIdx: number) => {
    const safeChapter = { ...chapter };
    safeChapter.position =
      typeof safeChapter.position === "number"
        ? safeChapter.position
        : chapterIdx + 1;
    safeChapter.overview =
      typeof safeChapter.overview === "string" ? safeChapter.overview : "";
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
        safeLesson.description =
          typeof safeLesson.description === "string"
            ? safeLesson.description
            : "";
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
      content = { title: "", text: content, format: "markdown" };
    } else if (type === "VIDEO") {
      content = { title: "Video", description: content };
    } else if (type === "PDF" || type === "DOWNLOAD") {
      content = { title: "Resource", description: content, downloadable: true };
    } else if (type === "CODE" || type === "CODE_EXERCISE") {
      content = { title: "Example", code: content, language: "javascript" };
    } else {
      content = { text: content };
    }
  }

  if (!content || typeof content !== "object") {
    content = {};
  }
  const blockWithContent = {
    ...block,
    type,
    position,
    content,
  };

  if (type === "TEXT") {
    blockWithContent.content.title =
      blockWithContent.content.title ?? "Text";
    blockWithContent.content.text =
      blockWithContent.content.text ?? "";
    blockWithContent.content.format =
      blockWithContent.content.format ?? "markdown";
  }

  if (type === "QUIZ") {
    blockWithContent.content.question =
      blockWithContent.content.question ?? "Quiz question";
    blockWithContent.content.options = Array.isArray(blockWithContent.content.options)
      ? blockWithContent.content.options
      : [
          { id: "1", text: "Option 1", isCorrect: true },
          { id: "2", text: "Option 2", isCorrect: false },
        ];
    blockWithContent.content.explanation =
      blockWithContent.content.explanation ?? "Explanation";
    blockWithContent.content.points =
      typeof blockWithContent.content.points === "number"
        ? blockWithContent.content.points
        : 5;
  }

  if (type === "CODE" || type === "CODE_EXERCISE") {
    blockWithContent.content.language =
      blockWithContent.content.language ?? "javascript";
    blockWithContent.content.code =
      blockWithContent.content.code ?? "";
  }

  return blockWithContent;
}
