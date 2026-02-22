require("dotenv").config();

async function callLLM(prompt, isJson = false) {
    const model = process.env.OLLAMA_MODEL || "llama3";
    const host = process.env.OLLAMA_HOST || "http://localhost:11434";

    try {
        const response = await fetch(`${host}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                format: isJson ? "json" : undefined,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        let text = data.response.trim();

        if (isJson) {
            try {
                return JSON.parse(text);
            } catch (parseError) {
                // Fallback: try to extract JSON from text if it's wrapped in triple backticks
                const jsonMatch = text.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw parseError;
            }
        }

        return text;
    } catch (error) {
        console.error("Ollama Call Error:", error);
        throw error;
    }
}

module.exports = { callLLM };
