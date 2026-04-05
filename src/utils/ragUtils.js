import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Splits a long transcript text into manageable chunks.
 * We chunk by ~150 words cleanly on sentence boundaries.
 */
export function chunkText(text, maxWords = 150) {
  if (!text) return [];
  
  // Split on basic punctuation boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    const nextChunk = currentChunk ? currentChunk + " " + sentence : sentence;
    if (nextChunk.split(" ").length > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = nextChunk;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}

/**
 * Calls Gemini text-embedding-004 to create the raw numeric vector.
 */
export async function generateEmbedding(text) {
  if (!genAI) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
  }
  
  // Using the new text-embedding-004 model
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  const embedding = result.embedding;
  return embedding.values; // Array of floats
}

/**
 * Computes cosine similarity between two numeric arrays.
 * Returns a score between -1 and 1 (closer to 1 represents higher similarity).
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Processes an array of chunk objects { text, vector, metadata } 
 * and finds the top K chunks related to the user's query vector.
 */
export function findTopChunks(queryVector, allChunks, topK = 5) {
  const scoredChunks = allChunks.map(chunk => {
    return {
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.vector)
    };
  });
  
  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);
  
  return scoredChunks.slice(0, topK);
}
