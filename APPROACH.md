# Approach Document: QUANTIFY

## 1. Solution Design
QUANTIFY fixes the classic problem of the "Double Work" loop. Instead of making people re-read 20-page meeting transcripts to figure out what they are supposed to do, our app turns raw conversation into organized data. Here is how it breaks down:

**1. Data Ingestion**
People just upload their meeting transcripts (`.txt` or `.vtt`). The app chops the text up into smaller chunks without cutting off sentences so it's easier to search later.

**2. AI Data Extraction & Vectorization**
We send the raw text to the **Groq Llama 3.3 70B** model. It reads the whole meeting and spits out a clean JSON object containing the decisions made, tasks assigned (with who is doing them and when), and the overall "vibe" or sentiment of the meeting. At the exact same time, we use **Google Gemini** to turn all that text into mathematical numbers (called vector embeddings) and save it in our Firebase database.

**3. The Digital Desk**
The front-end takes that JSON data and turns it into cool, interactive post-it notes and Kanban boards. We also built a "Global Chatbot". When you ask it a question, it uses Math (Cosine Similarity) on those Gemini vectors to search through months of meetings instantly and pull the exact paragraph you need to give you an answer.

---

## 2. Tech Stack Choices
* **Frontend**: **React + Vite**. We chose Vite because it builds incredibly fast, and React makes it super easy to manage the complex states needed for the Dashboard.
* **Database**: **Firebase (Firestore)**. Since our AI outputs perfect JSON objects, using a NoSQL database like Firestore let us just drop the data straight in without needing a clunky backend server.
* **AI Engine**: **Groq (Llama 3.3 70B)**. Processing 20+ pages of text takes a lot of computing power. We went with Groq because their specialized chips return answers almost instantly.
* **Search Architecture**: **Google Gemini SDK**. We used their `text-embedding-004` model because it's great at understanding the actual meaning of paragraphs, which powers our intelligent chatbot.
* **Styling & Charts**: **Vanilla CSS + Recharts**. We wrote custom CSS to get that specific "Sketchbook" aesthetic without using generic templates, and Recharts was the simplest way to graph our team sentiment data.

---

## 3. Future Improvements (If we had more time)

**1. Live Audio Recording**
Instead of forcing people to upload files, we want to add a simple "Record" button using the browser's `Web Speech API`. You could just set your laptop on the table during an in-person meeting and get live, organized notes.

**2. Automatic Zoom & Google Meet Integration**
We want to build a deep integration with Zoom or Google Meet. When your call finishes, the app would automatically grab the recording and use a model like OpenAI Whisper to transcribe and upload it into Quantify without you doing anything. 

**3. Sync with Jira & Google Calendar**
Right now, the tasks just live in our app. If we had more time, we'd add API connections so the action items we extract automatically turn into Jira tickets or Google Calendar deadlines. It would completely eliminate manual data entry.

**4. Employee Performance Meter**
Since we are already tracking who is assigned what task, we'd like to build an analytics plugin for managers that calculates an "execution score". It would track how many action items an employee is assigned versus how many they actually complete on time.
