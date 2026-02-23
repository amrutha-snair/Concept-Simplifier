# Concept Simplifier Agent

An autonomous, multi-agent feedback loop designed to simplify complex technical concepts into beginner-friendly explanations. Powered by **Node.js**, **React**, and **Ollama** for a completely private, local-first experience.



---

## The Agentic Core

Unlike a standard "one-shot" AI prompt, this system implements a **recursive refinement loop**. It simulates four cognitive modules to ensure the final output is high-quality and jargon-free.

### 🧠 Internal Roles
1.  The Explainer (Master Mentor)**: Generates the initial narrative and analogy.
2.  The Complexity Critic (Brutal Evaluator)**: Analyzes the draft for jargon, dry writing, and "textbook" vibes. Returns a score (0-10).
3.  The Refiner (World-Class Editor)**: Rewrites the explanation based on specific feedback from the Critic.
4.  The Stop Controller**: An autonomous gatekeeper that only releases the explanation once it hits a "beginner-ready" threshold (Score ≥ 8).

---

## ✨ Features

- **Autonomous Refinement**: The agent self-corrects and iterates until the goal is met.
- **Conversational UI**: A sleek, chat-like interface to interact with the agent.
- **Human-in-the-Loop (HITL)**: Don't like the result? Tell the agent "make it even simpler" or "use a soccer analogy" to trigger a fresh refinement loop based on your feedback.
- **Real-Time Transparency**: Watch the agent's internal reasoning with the live "Thinking" indicator and debug logs.
- **100% Private**: Runs entirely on your local machine via Ollama. No API keys, no data tracking.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Vanilla CSS (Modern/Premium UI)
- **Backend**: Node.js, Express, SSE (Server-Sent Events) for real-time streaming.
- **LLM Engine**: Ollama (Recommended: `llama3`, `mistral`, or `gpt-oss`).

---

## 📦 Installation & Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Ollama** installed and running.
- Pull a model:
  ```bash
  ollama pull llama3
  ```

### 2. Configuration
Create a `.env` file in the `backend/` directory:
```env
OLLAMA_MODEL=llama3
OLLAMA_HOST=http://localhost:11434
PORT=3001
```

### 3. Install & Run
Run the following command in the root directory:
```bash
# Install dependencies for both folders
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# Start the dev environment (Concurrent Backend + Frontend)
npm run dev
```

---

## 📖 How it Works: The Loop

1.  **User Input**: "Explain AWS VPC to me."
2.  **Explainer** writes a draft based on a house analogy.
3.  **Critic** finds the word "encapsulation" and gives it a 6/10.
4.  **Refiner** deletes the technical jargon and makes the story smoother.
5.  **Critic** re-evaluates. Score is now 9/10.
6.  **Stop Controller** ends the loop and sends the final explanation to your chat.

---

