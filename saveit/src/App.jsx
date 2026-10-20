
import "./App.css";

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <h2>🔖 SaveIT</h2>
        <span>Your links, organized.</span>
      </nav>

      <main className="container">
        <h1>Everything worth saving.</h1>
        <p>Save it now. Find it anytime.</p>

        <div className="link-input">
          <input
            type="url"
            placeholder="Paste your link here..."
          />
          <button>Add Link</button>
        </div>

        
        <div className="about">
          <h2>Why SaveIT?</h2>

          <p>
            Ever saved a video to watch later, only to forget why you
            saved it? We've all been there.
          </p>

          <p>
            SaveIT helps you save videos, reels, and posts from across
            the internet, along with a note explaining why they matter
            to you. Everything stays organized in one place, ready to
            revisit whenever you need it.
          </p>

          <h3>How it works</h3>

          <p>
            Simply paste a link, add a title and a short note about why
            you saved it, and choose whether you want a reminder.
            SaveIT organizes your content into platform-based folders
            so you can easily find what matters.
          </p>

          <p className="about-tagline">
            Save the content. Remember why.
          </p>
        </div>


        <h2>Your folders</h2>

        <div className="folder-grid">
          <div className="folder">▶️ YouTube</div>
          <div className="folder">📸 Instagram</div>
          <div className="folder">🟠 Reddit</div>
          <div className="folder">🌐 Other Links</div>
        </div>
      </main>
    </div>
  );
}

export default App;
