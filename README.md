# SaveIT 🔖

**Save the content. Remember why.**

SaveIT is a personal link-saving application that helps you organize useful content from different platforms in one place. Instead of losing interesting videos, posts, or links in your browser history or social media feeds, you can save them, add notes, and revisit them whenever you need.

## ✨ Features

- **Save Links:** Save links from YouTube, Instagram, Reddit, and other websites.
- **Platform-wise Organization:** Keep saved links organized into separate folders.
- **YouTube Previews:** Automatically fetch available video metadata, including titles and thumbnails.
- **Personal Notes:** Add descriptions or notes to remember why a link matters.
- **Watched Tracking:** Mark saved content as watched or unwatched.
- **Delete Links:** Remove links you no longer need.
- **Folder Limit:** Save up to five links per platform.
- **Google Authentication:** Sign in using your Google account.

## ⚙️ How It Works

1. Sign in using Google.
2. Paste the URL of the content you want to save.
3. Add a title or personal note if needed.
4. Save the link in its respective platform folder.
5. Revisit your saved content, track what you have watched, or delete links whenever you want.

SaveIT uses a React frontend to provide the interface, a FastAPI backend to handle application requests and link metadata, and Supabase for authentication and PostgreSQL database storage.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Supabase JavaScript Client

### Backend
- Python
- FastAPI
- Uvicorn

### Database & Authentication
- Supabase
- PostgreSQL
- Supabase Auth
- Google OAuth

### Tools
- Git
- GitHub

## 📁 Project Structure

```text
SaveIT/
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── supabase.js
├── assets/
│   └── logo.jpeg
├── backend/
│   ├── main.py
│   ├── youtube_utils.py
│   ├── requirements.txt
│   └── .env
├── .env
├── package.json
├── package-lock.json
└── README.md
```

## 💻 Running Locally

SaveIT is currently being developed and tested in a local environment.

### Frontend

Install the Node.js dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI development server:

```bash
uvicorn main:app --reload
```

The frontend and backend run separately on your local machine. The frontend URL is displayed in the terminal when Vite starts.

## 🔐 Configuration

SaveIT uses environment variables for Supabase configuration and backend credentials.

- Frontend configuration is stored in the root `.env` file.
- Backend configuration is stored in `backend/.env`.
- Authentication is handled through Supabase Auth and Google OAuth.

Private credentials and secret keys must not be committed to version control.

## 🎯 Project Goal

The goal of SaveIT is simple: **make saving, organizing, and revisiting useful online content easier.**

It is a personal project focused on building a practical application while learning frontend development, backend APIs, database integration, and authentication.

---

*Built with ❤️ as a personal project.*