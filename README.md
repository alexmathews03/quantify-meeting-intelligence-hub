# QUANTIFY 

<div align="center">

### 🌐 [**Try the Live App →  quantify-meeting-intelligence-hub.vercel.app**](https://quantify-meeting-intelligence-hub.vercel.app)

</div>

[![Demo Video](https://img.shields.io/badge/▶_Watch_Demo_Video-Click_Here-ff0000?style=for-the-badge&logo=youtube&logoColor=white)](https://drive.google.com/file/d/1Sb1hDNkM7FTJ7Wi1cfHCHdCWAuh3PrDr/view?usp=sharing)
[![Approach Document](https://img.shields.io/badge/📄_Read_Approach_Doc-Click_Here-0052CC?style=for-the-badge)](https://docs.google.com/document/d/1oglNd46Cm_AHSFLN655OMRf_KTNw_ij5DOJrC6ubeh4/edit?usp=sharing)
[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://quantify-meeting-intelligence-hub.vercel.app)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3-orange?style=for-the-badge)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**QUANTIFY** is a high-performance meeting intelligence platform designed to transform the noise of raw dialogue into structured, actionable data. It eliminates the "Double Work" cycle by distilling expansive transcripts into a single, authoritative source of truth.

---

## The Problem

Modern organizations generate dozens of expansive meeting transcripts weekly, often exceeding twenty pages in length. Critical outcomes—decisions, action items, and strategic reasoning—are frequently buried in pages of dialogue, forcing teams into a painful **"Double Work"** cycle of re-discussing things that were already decided instead of executing on them.

## The Solution

QUANTIFY is an intelligent meeting intelligence platform that automatically distills raw conversation into structured, actionable data. By utilizing high-performance language models to extract key points and visualize interaction sentiment, it eliminates administrative overhead and ensures teams move from discussion to delivery without friction.

---

## System Architecture

```mermaid
graph LR
    Input[Raw Transcript .vtt/.txt] --> EmbedStore[(Vector Embeddings)]
    Input --> Engine(QUAN AI Engine)
    Engine --> Logic{Distillation Layer}
    Logic --> Items[Action Items & Decisions]
    Logic --> Sentiment[Sentiment Analytics]
    Logic --> Context[Meeting Specific Recall]
    EmbedStore --> GlobalRAG{Global Workspace RAG}
    GlobalRAG --> GlobalContext[Cross-Meeting Recall]
    Items & Sentiment & Context & GlobalContext --> Workspace[QUANTIFY Workspace]
    style Engine fill:#7a6818,stroke:#1a1a1a,stroke-width:2px
    style Workspace fill:#1c1d66,stroke:#1a1a1a,stroke-width:2px
```

---

## Core Functionality

| **The Landing Page** | **The Digital Desk** |
| :---: | :---: |
| <img src="screenshots/home.png" height="250" alt="Homepage Preview" /> | <img src="docs/screenshots/feature_desk.png" height="250" alt="Your Desk" /> |
| **The Front Door**: A beautifully animated welcome section. | **Centralized Hub**: A persistent, 'Post-it' style meeting registry. |
| **Distilled Intelligence** | **Atmospheric Awareness** |
| <img src="docs/screenshots/feature_summary.png" height="250" /> | <img src="docs/screenshots/feature_vibe.png" height="250" /> |
| **Outcomes & Assignments**: Automated extraction of decisions and tasks. | **Sentiment Analytics**: Visualize interaction peaks and blockers. |
| **Master Task Board** | **Workspace Health (Analytics)** |
| <img src="screenshots/action_board.png" height="250" alt="Master Task Board" /> | <img src="screenshots/workspace_health.png" height="250" alt="Workspace Health" /> |
| **Action Items Central**: Master checklist tracking everyone's assignments. | **Organizational Analytics**: Graphs team morale and task velocity. |
| **Global RAG Chatbot** | **Instant Recall (QUAN)** |
| <img src="screenshots/quan.png" height="250" alt="Global Chatbot" /> | <img src="docs/screenshots/feature_chat.png" height="250" alt="Oracle Chat" /> |
| **Cross-Meeting Intelligence**: True math-based vector searches! | **Meeting Context**: Chat with meeting data for deep clarification. |

---

## Tech Stack

**Programming Languages:**
*   **JavaScript (ES6+)**: Core application logic.
*   **HTML5 / CSS3**: Custom structural UI and "Sketchbook Aesthetic" styling.

**Frameworks:**
*   **React 18**: Component-based UI rendering.
*   **Vite**: Ultra-fast frontend build tooling and hot-module replacement.
*   **Framer Motion**: Complex 3D UI animations and viewport transitions.
*   **Recharts**: SVG-based data visualization for Health Analytics.

**Databases:**
*   **Firebase (Cloud Firestore)**: NoSQL document-based database used to store extracted AI JSON outputs, metadata, and mathematical vector embeddings.

### 🧠 The Vector RAG Architecture
To power our "Global Intelligence Chatbot" (QUAN) across all of an organization's meetings, we built a client-side Retrieval-Augmented Generation (RAG) pipeline:
*   **Google Gemini SDK (text-embedding-004)**: Generates 1,536-dimensional mathematical vector embeddings for every meeting paragraph chunk. This enables blazing-fast Cosine Similarity searches across the entire workspace history to find relevant context.
*   **Groq SDK (Llama 3.3 70B)**: Receives the retrieved vector context and uses its high-speed LPU inference to instantly distill, synthesize, and cite the exact meeting the answer came from.

---

## Setup Instructions

### 1. Initialize Registry
```bash
git clone <repository-url>
cd quantify-desk
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_GROQ_API_KEY=your_groq_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### 3. Launch Workspace
```bash
npm run dev
```

---

## License
MIT © 2026 QUANTIFY Team
