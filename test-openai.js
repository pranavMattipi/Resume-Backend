require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
    try {
        console.log("Testing OpenAI connection...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Say hello!" }]
        });
        console.log("Success:", response.choices[0].message.content);
    } catch (error) {
        console.error("OpenAI Error:", error.message);
    }
}
test();
