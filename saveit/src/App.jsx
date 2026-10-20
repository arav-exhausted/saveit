
import "./App.css";
import { useState } from "react";

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [notification, setNotification] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();

    console.log({
      link,
      title,
      note,
      notification,
    });

    alert("Link details captured! Backend comes next.");

    setLink("");
    setTitle("");
    setNote("");
    setNotification(false);
    setShowPopup(false);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <h2>🔖 SaveIT</h2>
        <span>Your links, organized.</span>
      </nav>

      <main className="container">
        <h1>Everything worth saving.</h1>
        <p>Save it now. Find it anytime.</p>

        <form
          className="link-input"
          onSubmit={(e) => {
            e.preventDefault();
            setShowPopup(true);
          }}
        >
          <input
            type="url"
            placeholder="Paste your link here..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
          />

          <button type="submit">Add Link</button>
        </form>

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

      {showPopup && (
        <div
          className="modal-overlay"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="link-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowPopup(false)}
              aria-label="Close popup"
            >
              ✕
            </button>

            <h2>Save a new link</h2>

            <p className="modal-subtitle">
              Save it now. Remember why later.
            </p>

            <form onSubmit={handleSave}>
              <label htmlFor="saved-link">Link URL</label>
              <input
                id="saved-link"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />

              <label htmlFor="saved-title">Title</label>
              <input
                id="saved-title"
                type="text"
                placeholder="Give your link a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <label htmlFor="saved-note">
                Why are you saving this?
              </label>

              <textarea
                id="saved-note"
                placeholder="Add a personal note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />

              <label className="notification-option">
                <span>
                  <strong>Remind me later</strong>
                  <small>
                    Get a reminder to revisit this link
                  </small>
                </span>

                <input
                  type="checkbox"
                  checked={notification}
                  onChange={(e) =>
                    setNotification(e.target.checked)
                  }
                />
              </label>

              <button className="save-btn" type="submit">
                Save Link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
