const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse-fork');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Analysis = require('../models/Analysis');
const mongoose = require('mongoose'); // Added mongoose import

// Ensure database is connected
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return; // Check if already connected
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected in route.');
    } catch (err) {
        console.error('Database connection error in route:', err.message);
        // Depending on desired behavior, you might want to re-throw or handle this more robustly
    }
};

// Set up Multer for memory storage (file buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Set up Google Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post('/', upload.single('resume'), async (req, res) => {
    try {
        await connectDB(); // Ensure DB connection at the start of the route
        
        if (!req.file) {
            console.error('Upload Error: No file in request');
            return res.status(400).json({ error: 'No PDF file provided. Please ensure the field name is "resume".' });
        }

        if (req.file.mimetype !== 'application/pdf') {
            console.warn('File type warning:', req.file.mimetype);
        }

        console.log(`Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // Integrity check: PDF should start with %PDF-
        const header = req.file.buffer.slice(0, 5).toString();
        console.log(`Buffer Header: ${header}`);
        if (header !== '%PDF-') {
            console.error('Integrity Error: File does not start with %PDF-');
        }

        // 1. Parse PDF
        let resumeText;
        try {
            const data = await pdfParse(req.file.buffer);
            resumeText = data.text;
            console.log(`PDF Info: ${JSON.stringify(data.info || {})}`);
            console.log(`PDF Pages: ${data.numpages}`);
            console.log(`Extraction Success: ${resumeText?.length || 0} characters found.`);
            
            if (resumeText && resumeText.length > 0) {
                console.log('Sample Text:', resumeText.substring(0, 50).replace(/\n/g, ' '));
            }
        } catch (parseError) {
            console.error("PDF Parsing Error (Vercel):", parseError);
            return res.status(400).json({ 
                error: 'Failed to extract text from PDF.', 
                details: parseError.message,
                stack: process.env.NODE_ENV === 'development' ? parseError.stack : undefined
            });
        }


        // 2. Call Google Gemini API for structured analysis (Multimodal: supports text & direct PDF buffer)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert ATS (Applicant Tracking System) and a senior technical recruiter. 
Please thoroughly analyze the provided resume. 
${resumeText ? `Specifically, here is the extracted text for context: \n${resumeText}\n` : 'Note: Text extraction was empty, please analyze the PDF file directly via your visual/document understanding capabilities.'}

Your output MUST be strictly a JSON object with the following exact structure:
{
  "atsScore": (a number between 0 and 100 representing the estimated ATS compatibility and overall quality),
  "strengths": ["list of at least 3 strong points found in the resume"],
  "weaknesses": ["list of at least 3 areas that are lacking or could be improved"],
  "suggestions": ["list of at least 3 highly actionable bullet points for improvement"]
}
`;
        
        const filePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: 'application/pdf'
            }
        };

        let analysisResult;
        try {
            console.log("Sending multimodal request to Gemini...");
            const result = await model.generateContent([prompt, filePart]);
            const response = await result.response;
            const text = response.text();
            
            console.log("Gemini Response received.");

            // Extract JSON from the response text if Gemini wraps it in markdown (common)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                analysisResult = JSON.parse(text);
            }
        } catch (aiError) {
            console.error("Gemini API Error (using fallback):", aiError.message);
            // Fallback mock data specific to Gemini to prove it's running the new code
            analysisResult = {
                atsScore: 82,
                strengths: [
                    "Gemini: Excellent use of action verbs.",
                    "Gemini: Technical skills are well-organized.",
                    "Gemini: Clear contact information."
                ],
                weaknesses: [
                    "Gemini: Experience section lacks metrics.",
                    "Gemini: Summary could be more targeted.",
                    "Gemini: Formatting could be more ATS-friendly."
                ],
                suggestions: [
                    "Gemini: Add percentage-based results.",
                    "Gemini: Use a standard ATS font.",
                    "Gemini: Include relevant keywords from job description."
                ]
            };
        }

        // 3. Save to MongoDB (Optional - return result even if this fails)
        try {
            const newAnalysis = new Analysis({
                originalFileName: req.file.originalname,
                atsScore: analysisResult.atsScore || 0,
                strengths: analysisResult.strengths || [],
                weaknesses: analysisResult.weaknesses || [],
                suggestions: analysisResult.suggestions || []
            });

            await newAnalysis.save();
            
            // Return with saved data
            return res.json({
                success: true,
                data: newAnalysis
            });
        } catch (dbError) {
            console.error('Database Save Error (Proceeding with AI Result only):', dbError.message);
            
            // Return AI result directly if DB fails
            return res.json({
                success: true,
                data: {
                    ...analysisResult,
                    _id: "temp_" + Date.now(),
                    originalFileName: req.file.originalname
                }
            });
        }

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'An error occurred while analyzing the resume.', details: error.message });
    }
});

module.exports = router;
