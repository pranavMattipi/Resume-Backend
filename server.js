// Using Google Gemini API for Resume Analysis
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const analyzeRoute = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 8000;

// Routes
app.use('/api/analyze', analyzeRoute);

// Middleware
app.use(cors());
app.use(express.json());

// Favicon handler to prevent 500s on common browser requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Test Route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Resume Analyzer API is running on Vercel',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// Database connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('MONGODB_URI is missing in environment variables');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        // Do not process.exit(1) in a serverless function
    }
};

// Start database connection
connectDB();

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
