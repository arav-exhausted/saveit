
import "./App.css";
import { useState, useEffect } from "react";

import saveitlogo from "../assets/logo.jpeg";


const folders = [
  { name: "YouTube", icon: "▶️" },
  { name: "Instagram", icon: "📸" },
  { name: "Reddit", icon: "🟠" },
  { name: "Other Links", icon: "🌐" },
];

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [notification, setNotification] = useState(false);

  const [savedLinks, setSavedLinks] = useState([]);


  const [youtubeMetadata, setYoutubeMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState("");

  const handleSave = (e) => {
    e.preventDefault();

    const trimmedLink = link.trim();
    if (!trimmedLink) return;

    let normalizedUrl;
    let platform = "Other Links";

    try {
      normalizedUrl = new URL(
        trimmedLink.startsWith("http")
          ? trimmedLink
          : `https://${trimmedLink}`
      ).href;

      const hostname = new URL(normalizedUrl).hostname.toLowerCase();

      if (
        hostname === "youtube.com" ||
        hostname.endsWith(".youtube.com") ||
        hostname === "youtu.be"
      ) {
        platform = "YouTube";
      } else if (
        hostname === "instagram.com" ||
        hostname.endsWith(".instagram.com")
      ) {
        platform = "Instagram";
      } else if (
        hostname === "reddit.com" ||
        hostname.endsWith(".reddit.com")
      ) {
        platform = "Reddit";
      }
      else{
        platform = "Other Links"
      }
    } catch {
      setMetadataError("Please enter a valid URL.");
      return;
    }

    if (metadataLoading) {
      setMetadataError("Please wait while the video details are fetched.");
      return;
    }

    const finalTitle = title.trim() || youtubeMetadata?.title || "";
    if (!finalTitle) {
      setMetadataError("Please enter a title for this link.");
      return;
    }

    const newLink = {
      id: Date.now(),
      platform,
      title: finalTitle,
      note: note.trim(),
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      url: youtubeMetadata?.url || normalizedUrl,
      thumbnail: platform === "YouTube" ? (youtubeMetadata?.thumbnail || "") : "",
      watched: false,
      notification,
    };

    setSavedLinks((current) => [...current, newLink]);
    setLink("");
    setTitle("");
    setNote("");
    setNotification(false);
    setYoutubeMetadata(null);
    setMetadataError("");
    setShowPopup(false);
  };

  const openFolder = (folderName) => {
    setSelectedFolder(folderName);
  };

  const closeFolder = () => {
    setSelectedFolder(null);
  };

  const toggleWatched = (id) => {
    setSavedLinks((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, watched: !item.watched }
          : item
      )
    );
  };

  const deleteLink = (id) => {
    setSavedLinks((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const folderLinks = savedLinks
    .filter((item) => item.platform === selectedFolder)
    .sort((a, b) => a.id - b.id);


  
  useEffect(() => {
    const trimmedLink = link.trim();

    if (!trimmedLink) {
      setYoutubeMetadata(null);
      setMetadataError("");
      setMetadataLoading(false);
      setTitle("");
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(
        trimmedLink.startsWith("http")
          ? trimmedLink
          : `https://${trimmedLink}`
      );
    } catch {
      return;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const isYouTube =
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be";

    if (!isYouTube) {
      setYoutubeMetadata(null);
      setMetadataError("");
      setMetadataLoading(false);
      setTitle("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setMetadataLoading(true);
      setMetadataError("");
      setYoutubeMetadata(null);
      setTitle("");

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/youtube/metadata",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmedLink }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not fetch YouTube details.");
        }

        if (!cancelled) {
          setYoutubeMetadata(data);
          setTitle(data.title || "");
        }
      } catch (error) {
        if (!cancelled) {
          setYoutubeMetadata(null);
          setMetadataError(
            error.message || "Could not connect to the SaveIT backend."
          );
        }
      } finally {
        if (!cancelled) {
          setMetadataLoading(false);
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [link]);


  return (
    <div className="app">
      <nav className="navbar">
        <h1>🔖 SaveIT</h1>
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
            Save the content. Remember WHY.
          </p>
        </div>

        <h2>Your folders</h2>

        <div className="folder-grid">
          {folders.map((folder) => (
            <button
              type="button"
              className="folder"
              key={folder.name}
              onClick={() => openFolder(folder.name)}
            >
              <span className="folder-icon">{folder.icon}</span>
              <span>{folder.name}</span>
              <span className="folder-arrow">↗</span>
            </button>
          ))}
        </div>
      </main>

      {/* ADD LINK POPUP */}
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


              
              {metadataLoading && (
                <p className="metadata-loading">Fetching YouTube details...</p>
              )}

              {metadataError && (
                <p className="metadata-error">{metadataError}</p>
              )}

              {youtubeMetadata && (
                <div className="youtube-preview">
                  {youtubeMetadata.thumbnail && (
                    <img
                      src={youtubeMetadata.thumbnail}
                      alt="YouTube thumbnail"
                    />
                  )}

                  <div>
                    <strong>{youtubeMetadata.title}</strong>
                    <p>{youtubeMetadata.channel_title}</p>
                  </div>
                </div>
              )}


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

      {/* FOLDER POPUP */}
      {selectedFolder && (
        <div
          className="modal-overlay"
          onClick={closeFolder}
        >
          <div
            className="folder-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="folder-modal-header">
              <div className="folder-heading">
                <span className="folder-modal-icon">
                  {folders.find(
                    (f) => f.name === selectedFolder
                  )?.icon}
                </span>

                <h2>{selectedFolder}</h2>
                <p>Your saved links, all in one place.</p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={closeFolder}
                aria-label="Close folder"
              >
                ✕
              </button>
            </div>

            <div className="folder-modal-content">
              {folderLinks.length > 0 ? (
                folderLinks.map((item) => (
                  <article
                    className={`saved-link-row ${
                      item.watched ? "is-watched" : ""
                    }`}
                    key={item.id}
                  >
                    
                    <a
                      className="saved-thumbnail"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.title}`}
                    >
                      <img
                        src={item.thumbnail || saveitlogo}
                        alt={item.title || "SaveIT"}
                        className="link-thumbnail"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = "true";
                            e.currentTarget.src = saveitlogo;
                          }
                        }}
                      />
                    </a>


                    <div className="saved-link-info">
                      <div className="saved-title-line">
                        <h3>{item.title}</h3>
                        {item.watched && (
                          <span className="watched-badge">
                            Watched
                          </span>
                        )}
                      </div>

                      <p className="saved-link-note">
                        {item.note || "No personal note added."}
                      </p>

                      <p className="saved-link-date">
                        Saved on {item.date}
                      </p>

                      <div className="saved-link-actions">
                        <a
                          className="open-link-btn"
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link ↗
                        </a>

                        <label className="watched-control">
                          <input
                            type="checkbox"
                            checked={item.watched}
                            onChange={() =>
                              toggleWatched(item.id)
                            }
                          />
                          <span>Watched</span>
                        </label>

                        <button
                          type="button"
                          className="delete-link-btn"
                          onClick={() => deleteLink(item.id)}
                          aria-label={`Delete ${item.title}`}
                        >
                          <span aria-hidden="true">🗑</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-folder">
                  <div className="empty-folder-icon">🔖</div>
                  <h3>No links saved yet</h3>
                  <p>
                    Your {selectedFolder} links will appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="folder-modal-footer">
              <span>
                {folderLinks.length}{" "}
                {folderLinks.length === 1 ? "link" : "links"}
                {" · "}
                {folderLinks.filter((item) => item.watched).length} watched
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
