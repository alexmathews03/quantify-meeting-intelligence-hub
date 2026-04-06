# Approach Document: QUANTIFY

## 1. Solution Design
QUANTIFY was designed to solve the "Double Work" cycle of modern team meetings by transforming lengthy, unstructured transcripts into highly structured, actionable intelligence. The architecture features a clear separation of data ingestion, AI distillation, and user presentation:

**1. Data Ingestion & Chunking**
Users upload transcripts (`.txt` or `.vtt`). The application immediately parses the text on the client-side. To power the global RAG (Retrieval-Augmented Generation) system, the transcript is intelligently chunked into overlapping ~150-word paragraphs, ensuring no context is cut mid-sentence.

**2. AI Distillation & Vectorization**
The raw text is sent to the **Groq Llama 3.3 70B** model, prompting an advanced NLP extraction that strictly returns a JSON schema containing `title`, `participants`, `decisions`, `actionItems` (mapped to owners and deadlines), and a `sentimentTimeline`. Simultaneously, the client uses the **Google Gemini API** (`text-embedding-004`) to generate a 1,536-dimensional vector embedding for every text chunk, which are stored identically to the metadata in Firebase.

**3. The Digital Desk & Global Intelligence**
The front-end renders these extracted JSON objects as interactive post-it notes, Kanban boards, and organizational health metrics. Furthermore, the embedded "Workspace QUAN" chatbot utilizes client-side **Cosine Similarity calculations** to perform an ultra-fast vector search across all historical chunks, passing only the most mathematically relevant paragraphs to Groq to synthesize accurate, precise answers.

## 2. Tech Stack Choices
* **Frontend**: **React + Vite**. Chosen for rapid prototyping, robust component state management (essential for the complex Dashboard UI), and blazing-fast hot-reloading during the hackathon constraints.
* **Database & Auth**: **Firebase (Firestore)**. As a NoSQL document database, Firestore aligns perfectly with the JSON-output format of the LLM pipelines, allowing us to drop perfectly structured meeting objects right into the database without building an intermediate ORM.
* **LLM Engine**: **Groq (Llama 3.3 70B)**. Processing 20+ page transcripts requires massive token windows. Groq was chosen because its LPU inference engine returns results near-instantaneously, making the extraction process feel like magic rather than a loading screen.
* **Vector Embeddings**: **Google Gemini SDK**. Selected due to its powerful `text-embedding-004` model which perfectly captures semantic meaning for our RAG pipeline.
* **Styling & Visualization**: **CSS + Recharts**. The visual aesthetic (Sketchbook theme) was custom-built in CSS to avoid the generic look of Tailwind templates, while Recharts provided a lightweight, reliable way to graph the AI's numerical sentiment scores.

## 3. Future Improvements (With More Time)
If given more time to transition this hackathon prototype into an enterprise-ready Product, we would prioritize the following:

**1. Live Audio Ingestion & Automated Platform Sync**
Rather than forcing users to manually drag-and-drop `.vtt` file downloads, we would implement the browser-native `Web Speech API` for a simple "Record" button to live-transcribe in-person meetings. Furthermore, we would build deep integrations with platforms like Zoom, Google Meet, and Microsoft Teams. By utilizing models like OpenAI Whisper, QUANTIFY could automatically pull, transcribe, and distill recorded cloud meetings the second the call ends, ensuring true zero-friction adoption.

**2. Enterprise Role-Based Access Control (RBAC)**
Currently, the RAG chatbot can search all meetings. In a corporate environment, this is an HR liability (e.g., retrieving salary info from private 1-on-1s). We would implement strict Firestore Security Rules and pass document-level permissions into the Vector retrieval function, ensuring the AI only answers based on transcripts the user has clearance to view.

**3. Hierarchical "Map-Reduce" Summarization**
Cosine similarity vector retrieval is incredible for granular details, but fails at macro-summarization (e.g., "Summarize all decisions made in Q3"). With more time, we would build a background cloud function that recursively summarizes meeting-summaries into weekly, monthly, and quarterly reports to solve the context window limit at an enterprise scale.
