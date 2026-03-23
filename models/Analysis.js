const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
    originalFileName: {
        type: String,
        required: true
    },
    atsScore: {
        type: Number,
        required: true
    },
    strengths: [{
        type: String
    }],
    weaknesses: [{
        type: String
    }],
    suggestions: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
