const express = require("express");
const cors = require("cors");
const SimplifierAgent = require("./agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/simplify", async (req, res) => {
    const { concept, feedback: userFeedback, lastExplanation } = req.query;

    if (!concept) {
        return res.status(400).send({ error: "Concept is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const agent = new SimplifierAgent();

    try {
        await agent.simplify(concept, userFeedback, lastExplanation, (step) => {
            res.write(`data: ${JSON.stringify(step)}\n\n`);
        });
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch (error) {
        console.error("Agent Error:", error);
        res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
    } finally {
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});
