const { callLLM } = require("./llm");
const { EXPLAINER_PROMPT, CRITIC_PROMPT, REFINER_PROMPT } = require("./prompts");

class SimplifierAgent {
    constructor(maxIterations = 5, threshold = 8) {
        this.maxIterations = maxIterations;
        this.threshold = threshold;
    }

    async simplify(concept, userFeedback = null, previousExplanation = null, onStep) {
        let currentIteration = 1;
        let currentExplanation = previousExplanation || "";
        let feedback = null;
        let history = [];

        // If we have previous state, start from refinement
        const maxIterationsForThisRun = userFeedback ? 2 : this.maxIterations;

        while (currentIteration <= maxIterationsForThisRun) {
            // 1. Explainer / Refiner Phase
            let stepName = (currentIteration === 1 && !userFeedback) ? "Initial Explanation" : `Refinement Iteration ${currentIteration}`;
            let prompt;

            if (currentIteration === 1 && !userFeedback) {
                prompt = EXPLAINER_PROMPT.replace("{concept}", concept)
                    .replace("{previous_explanation}", "None")
                    .replace("{feedback}", "None");
            } else {
                // Use userFeedback if provided on first iteration of follow-up
                const combinedFeedback = (currentIteration === 1 && userFeedback)
                    ? `USER REQUEST: ${userFeedback}`
                    : (feedback ? feedback.suggestions.join(", ") : "");

                prompt = REFINER_PROMPT.replace("{concept}", concept)
                    .replace("{explanation}", currentExplanation)
                    .replace("{score}", feedback ? feedback.score : "N/A")
                    .replace("{issues}", feedback ? feedback.issues.join(", ") : "N/A")
                    .replace("{suggestions}", combinedFeedback);
            }

            if (onStep) onStep({ type: "thinking", role: currentIteration === 1 ? "Explainer" : "Refiner", step: stepName });
            currentExplanation = await callLLM(prompt);

            if (onStep) onStep({ type: "explanation", content: currentExplanation, iteration: currentIteration });

            // 2. Critic Phase
            if (onStep) onStep({ type: "thinking", role: "Critic", step: "Evaluating complexity..." });
            const criticPrompt = CRITIC_PROMPT.replace("{explanation}", currentExplanation);
            feedback = await callLLM(criticPrompt, true);

            if (onStep) onStep({ type: "feedback", ...feedback });

            history.push({
                iteration: currentIteration,
                explanation: currentExplanation,
                feedback: feedback
            });

            // 3. Stop Controller Phase
            if (feedback.score >= this.threshold) {
                if (onStep) onStep({ type: "stop", reason: `Threshold reached (${feedback.score}/10)` });
                break;
            }

            if (currentIteration === this.maxIterations) {
                if (onStep) onStep({ type: "stop", reason: "Maximum iterations reached" });
                break;
            }

            currentIteration++;
        }

        return { finalExplanation: currentExplanation, history };
    }
}

module.exports = SimplifierAgent;
