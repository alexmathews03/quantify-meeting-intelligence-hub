import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const queryTranscriptContext = async (question, transcriptContext) => {
  if (!genAI) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env.local file.");
  }

  // Reverting to base flash model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // The structured prompt that guides the AI
  const prompt = `
You are the Meeting Hub AI Assistant. Your job is to answer questions based strictly on the following meeting transcript.

Transcript Context:
---
${transcriptContext}
---

User Question: ${question}

Instructions:
1. Answer the question directly and concisely based ONLY on the Transcript Context above.
2. If the answer is not in the transcript, state that you don't know based on the provided context.
3. If referencing a specific event or decision, include the timestamp in bold (e.g., **[04:10]**).
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate a response from the AI. Check your API key or network connection.");
  }
};

export const parseUploadedTranscript = async (rawText) => {
  if (!genAI) throw new Error("Missing VITE_GEMINI_API_KEY in .env.local file.");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an expert NLP data-extraction engine.
Analyze the following raw meeting transcript and extract highly structured intelligence.
You MUST output raw JSON fulfilling this exact schema:
IMPORTANT: Do NOT output any markdown backticks (\`\`\`json). Output raw curly braces only.

{
  "title": "A short 3-5 word title derived from the transcript.",
  "date": "Extracted date or 'Unknown Date'",
  "duration": "Estimated duration (e.g., '45m') based on timestamps, or 'Unknown'",
  "wordCount": [Integer of rough word count],
  "overallSentiment": "positive" | "neutral" | "negative",
  "participants": ["Array of distinct speaker names"],
  "decisions": [
    { "type": "decision", "text": "The major decision made" }
  ],
  "actionItems": [
    { "type": "action", "text": "Task description", "owner": "Assigned Person", "date": "Deadline, or '-'" }
  ],
  "sentimentTimeline": [
    {
      "time": "MM:SS",
      "value": [Integer 0 to 100],
      "speaker": "Active speaker at this segment",
      "textSegment": "The exact literal quote from the transcript that justifies this score.",
      "isHighlight": true or false (Set true ONLY if it's a major conflict or major agreement moment)
    }
  ]
}

CRITICAL RULES FOR sentimentTimeline:
1. Generate a timeline point roughly every 5 minutes of dialogue, OR at major shifts in conversation tone.
2. The "value" must be a vibe score from 0 (extreme conflict/anger) to 100 (extreme consensus/enthusiasm). 50 is neutral.
3. The "textSegment" MUST accurately reflect the speaker's tone, pulling a real sentence from the transcript.

RAW TRANSCRIPT TO PROCESS:
---
${rawText.substring(0, 50000)}
---
`;

  try {
    const result = await model.generateContent(prompt);
    let textOutput = result.response.text();

    try {
      // Sometimes Gemini wraps JSON in markdown blocks even with mimeType set
      if (textOutput.includes('\`\`\`')) {
        textOutput = textOutput.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
      }
      return JSON.parse(textOutput);
    } catch (parseErr) {
      console.error("Failed to parse this JSON: ", textOutput);
      throw new Error("AI returned invalid JSON: " + parseErr.message);
    }
  } catch (error) {
    console.error("AI Parsing Error:", error);
    // Return explicit error message (e.g., API key invalid, rate limit, or safety)
    throw new Error(error.message || "Failed to parse the transcript structure via AI.");
  }
};
