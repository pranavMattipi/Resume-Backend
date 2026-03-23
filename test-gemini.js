require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        console.log("Testing Gemini connection with key:", process.env.GOOGLE_API_KEY.substring(0, 10) + "...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log("Success:", response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
    }
}
test();
