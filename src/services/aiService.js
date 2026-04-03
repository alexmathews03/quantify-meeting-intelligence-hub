import Groq from "groq-sdk";

// Initialize Groq with API key from environment variables
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// NOTE: dangerouslyAllowBrowser is required because this is a client-side Vite app.
// In a production app, you would proxy these requests through a backend.
const groq = apiKey ? new Groq({ 
  apiKey: apiKey,
  dangerouslyAllowBrowser: true 
}) : null;

/**
 * Chatbot context query using Groq
 */
export const queryTranscriptContext = async (question, transcriptContext) => {
  if (!groq) {
    throw new Error("Missing VITE_GROQ_API_KEY. Please add it to your .env.local and restart the app.");
  }

  const prompt = `
You are QUAN, the AI Assistant for the QUANTIFY platform. 
Your specialty is distilling chaotic meeting transcripts into structured, quantified data.

Transcript Context:
---
${transcriptContext}
---

User Question: ${question}

Instructions:
1. If the user sends a casual greeting, respond warmly.
2. For transcript-related questions, answer directly and concisely based on the Context.
3. If referencing a specific event, include the timestamp in bold (e.g., **[04:10]**).
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq Chat Error:", error);
    if (error.status === 429) {
      throw new Error("Groq Rate Limit Reached. Please wait a moment.");
    }
    throw new Error("Failed to generate a response from Groq: " + error.message);
  }
};

/**
 * Intelligent transcript analysis using Groq
 */
export const parseUploadedTranscript = async (rawText, baseDate = null) => {
  if (!groq) throw new Error("Missing VITE_GROQ_API_KEY. Please add it to your .env.local.");

  const prompt = `
You are an expert NLP data-extraction engine.
Analyze the following raw meeting transcript and extract highly structured intelligence.
You MUST output raw JSON fulfilling this exact schema:

{
  "title": "A short 3-5 word title",
  "date": "DD/MM/YYYY",
  "duration": "e.g., 45m",
  "wordCount": [Integer],
  "overallSentiment": "positive" | "neutral" | "negative",
  "participants": ["Name1", "Name2"],
  "decisions": [{ "type": "decision", "text": "..." }],
  "actionItems": [{ "type": "action", "text": "...", "owner": "...", "date": "DD/MM/YYYY" }],
  "sentimentTimeline": [
    {
      "time": "MM:SS",
      "value": 0-100,
      "speaker": "...",
      "textSegment": "...",
      "isHighlight": true/false
    }
  ]
}

CRITICAL DATE RULES:
1. Base meeting date: ${baseDate || 'Extracted from transcript'}.
2. Calculate deadlines based on this date (e.g., "next Friday").
3. Use "-" for unknown deadlines.

CRITICAL RULES FOR sentimentTimeline:
1. Generate a timeline point roughly every 2-3 minutes of dialogue, OR at major shifts in conversation tone.
2. The "value" must be a vibe score from 0 (extreme failure/conflict) to 100 (extreme success/consensus). 50 is neutral.
3. TECHNICAL BLOCKERS ARE NEGATIVE: If the team agrees that something is "broken", "unacceptable", "cannot ship", or "delayed", the score for that segment MUST be low (0-40), even if the tone is calm. Professional consensus on a failure should NOT be scored as a positive success moment.
4. The "textSegment" MUST accurately reflect the speaker's tone, pulling a real sentence from the transcript.

RAW TRANSCRIPT:
---
${rawText.substring(0, 30000)}
---
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const textOutput = chatCompletion.choices[0]?.message?.content || "";
    
    // Groq supports response_format: json_object, so parsing should be direct.
    // But we use the regex fallback just in case of SDK variations.
    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON. Raw: " + textOutput.substring(0, 50));
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Groq Parsing Error:", error);
    if (error.status === 429) {
      // Re-throw specific error code for the UI to catch
      const err = new Error("Rate Limit");
      err.code = 429;
      throw err;
    }
    throw error;
  }
};
