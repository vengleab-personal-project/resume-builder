# AI-Powered Resume Builder

A Next.js application that parses resumes using AI and renders them in a beautiful, customizable, two-column layout.

## Features
- **AI Resume Parsing**: Upload PDF/DOCX resumes and extract structured data using OpenAI.
- **Visual Builder**: Live preview of your resume.
- **Customization**: Change accent colors and fonts.
- **Export**: Download as PDF (via Print).

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up OpenAI API Key**:
   Create a `.env.local` file in the root directory:
   ```bash
   OPENAI_API_KEY=sk-your-api-key
   ```
   *Note: If no API key is provided, the app will use mock data for demonstration.*

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## Tech Stack
- Next.js 15 (App Router)
- Tailwind CSS
- TypeScript
- Zustand (State Management)
- OpenAI API
- pdf-parse / mammoth (Text Extraction)
