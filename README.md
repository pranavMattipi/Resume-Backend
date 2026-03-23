# Resume-Backend (Gemini AI Powered)

A premium backend for the Resume Analyzer application, utilizing Google Gemini AI 2.0 Flash for intelligent ATS scoring and feedback. Deployed on Vercel: `https://resume-backend-one-mu.vercel.app/`.

## Features
- **AI Analysis**: Deep analysis of technical resumes using Gemini 2.0 Flash.
- **ATS Scoring**: Automated scoring based on industry standards.
- **PDF Extraction**: Robust PDF text extraction via `pdf-parse`.
- **Database**: MongoDB integration for storing analysis history.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pranavMattipi/Resume-Backend.git
   cd Resume-Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_connection_string
   PORT=8000
   ```

4. **Run the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints
- `POST /api/analyze`: Analyzes a resume PDF.
- Base URL: `https://resume-backend-one-mu.vercel.app/`

## Tech Stack
- Node.js & Express
- MongoDB & Mongoose
- Google Generative AI (@google/generative-ai)
- Multer (File Uploads)
- pdf-parse (PDF processing)
