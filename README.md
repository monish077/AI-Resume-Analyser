# My Resume Analyzer

My Resume Analyzer is a web application that helps users analyze their resumes against job descriptions using AI. The application allows users to upload their resumes in PDF format, receive an ATS (Applicant Tracking System) score, and get feedback on how to improve their resumes.

## Project Structure

```
my-resume-analyzer
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── UploadForm.jsx
│   │   │   ├── ScoreCard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Analyzer.jsx
│   │   ├── supabaseClient.js
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend
│   ├── src
│   │   ├── controllers
│   │   │   ├── analyzeController.js
│   │   │   └── historyController.js
│   │   ├── routes
│   │   │   └── api.js
│   │   └── index.js
│   ├── package.json
│   └── .env
└── README.md
```

## Features

- **User Authentication**: Users can log in using their email and password.
- **Resume Upload**: Users can upload their resumes in PDF format.
- **ATS Score Analysis**: The application analyzes the resume against a job description and provides an ATS score along with feedback.
- **History Tracking**: Users can view their past resume analysis results.

## Technologies Used

- **Frontend**: React (with Vite), Axios, React Router, Supabase for authentication.
- **Backend**: Node.js, Express, Multer for file uploads, pdf-parse for PDF text extraction, Groq API for resume analysis, Supabase for database management.

## Setup Instructions

### Prerequisites

- Node.js and npm installed on your machine.
- A Supabase account for database and authentication.
- A Groq API key for resume analysis.

### Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd my-resume-analyzer
   ```

2. **Set up the backend**:
   - Navigate to the `backend` directory:
     ```
     cd backend
     ```
   - Install dependencies:
     ```
     npm install
     ```
   - Create a `.env` file and add your `GROQ_API_KEY` and `SUPABASE_URL`.

3. **Set up the frontend**:
   - Navigate to the `frontend` directory:
     ```
     cd ../frontend
     ```
   - Install dependencies:
     ```
     npm install
     ```

4. **Run the applications**:
   - Start the backend server:
     ```
     cd backend
     npm start
     ```
   - Start the frontend application:
     ```
     cd ../frontend
     npm run dev
     ```

## Usage

- Navigate to the frontend application in your browser.
- Log in or create an account.
- Upload your resume and enter the job description to receive your ATS score and feedback.

## License

This project is licensed under the MIT License.