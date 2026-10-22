
import "./App.css";
import { useState, useEffect } from "react";
import saveitlogo from "../assets/logo.jpeg";
import { supabase } from "./supabase";

const API_URL = "https://saveit-7cg1.onrender.com";

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
  const [errorMessage, setErrorMessage] = useState("");

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedLinks, setSavedLinks] = useState([]);

  const [youtubeMetadata, setYoutubeMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState("");

  // Get the current session's access token for authenticated API requests.
  const getAuthHeaders = async (includeJson = false) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error("Could not verify your login session.");
    }

    if (!session?.access_token) {
      throw new Error("Please log in to continue.");
    }

    return {
      ...(includeJson ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  // Monitor login/logout and restore an existing session.
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          setUser(session?.user ?? null);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error("Session error:", error);

        if (mounted) {
          setUser(null);
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google.
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Google login failed:", error.message);
      window.alert(error.message);
    }
  };

  // Sign out.
  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      window.alert(error.message);
      return;
    }

    setUser(null);
    setSavedLinks([]);
    setSelectedFolder(null);
    setShowPopup(false);
  };

  // Convert an API link row to the frontend format.
  const formatLink = (item) => ({
    id: item.id,
    platform: item.platform,
    title: item.title,
    note: item.description || "",
    date: new Date(item.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    url: item.url,
    thumbnail: item.thumbnail_url || "",
    watched: item.watched,
  });

  // Load saved links when the logged-in user changes.
  useEffect(() => {
    let cancelled = false;

    const loadLinks = async () => {
      if (!user) {
        setSavedLinks([]);
        return;
      }

      try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${API_URL}/links`, {
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Failed to load saved links."
          );
        }

        if (!cancelled) {
          setSavedLinks(
            Array.isArray(data.links) ? data.links.map(formatLink) : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Could not load links:", error);
          setSavedLinks([]);
        }
      }
    };

    loadLinks();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch YouTube metadata when a YouTube URL is entered.
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
      setYoutubeMetadata(null);
      setMetadataError("");
      setMetadataLoading(false);
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
        const response = await fetch(`${API_URL}/youtube/metadata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedLink }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Could not fetch YouTube details."
          );
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

  // Save a link.
  const handleSave = async (e) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage("Please log in to save links.");
      return;
    }

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

    const folderCount = savedLinks.filter(
      (item) => item.platform === platform
    ).length;

    if (folderCount >= 5) {
      setErrorMessage(`You can save only 5 links in ${platform}!`);
      return;
    }

    setErrorMessage("");

    try {
      const headers = await getAuthHeaders(true);

      const response = await fetch(`${API_URL}/links`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: normalizedUrl,
          platform,
          title: finalTitle,
          description: note.trim(),
          thumbnail_url:
            platform === "YouTube" ? youtubeMetadata?.thumbnail || null : null,
          watched: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not save link."
        );
      }

      setSavedLinks((current) => [...current, formatLink(data.link)]);

      setLink("");
      setTitle("");
      setNote("");
      setYoutubeMetadata(null);
      setMetadataError("");
      setErrorMessage("");
      setShowPopup(false);
    } catch (error) {
      console.error("Save failed:", error);
      setErrorMessage(error.message || "Could not save link.");
    }
  };

  const openFolder = (folderName) => {
    setSelectedFolder(folderName);
  };

  const closeFolder = () => {
    setSelectedFolder(null);
  };

  // Toggle watched status.
  const toggleWatched = async (id) => {
    const item = savedLinks.find((saved) => saved.id === id);

    if (!item) return;

    try {
      const headers = await getAuthHeaders(true);

      const response = await fetch(`${API_URL}/links/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ watched: !item.watched }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not update watched status."
        );
      }

      setSavedLinks((current) =>
        current.map((saved) =>
          saved.id === id
            ? { ...saved, watched: data.link.watched }
            : saved
        )
      );
    } catch (error) {
      console.error("Watched update failed:", error);
      window.alert(error.message || "Could not update watched status.");
    }
  };

  // Delete a saved link.
  const deleteLink = async (id) => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_URL}/links/${id}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not delete link."
        );
      }

      setSavedLinks((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error("Delete failed:", error);
      window.alert(error.message || "Could not delete link.");
    }
  };

  const folderLinks = savedLinks
    .filter((item) => item.platform === selectedFolder)
    .sort((a, b) => a.id - b.id);

  // Auth loading screen.
  if (authLoading) {
    return <div className="app">Loading SaveIT...</div>;
  }

  // Logged-out screen.
  if (!user) {
    return (
      <div className="app">
        <nav className="navbar">
          <h1>🔖 SaveIT</h1>
        </nav>

        <main className="container">
          <h1>Everything worth saving.</h1>
          <p>Save it now. Find it anytime.</p>

          <button type="button" className="loginbtn" onClick={loginWithGoogle}>
            Continue with Google
          </button>
        </main>
      </div>
    );
  }

  // Logged-in dashboard.
  return (
    <div className="app">
      <nav className="navbar">
        <h1>🔖 SaveIT</h1>
        <button type="button" className="loginbtn" onClick={logout}>
          Logout
        </button>
      </nav>

      <main className="container">
        <h1>Everything worth saving.</h1>
        <p>Save it now. Find it anytime.</p>

        <form
          className="link-input"
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMessage("");
            setMetadataError("");
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

          <p className="about-tagline">Save the content. Remember WHY.</p>
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
              <br />
              <span className="folder-link-count">
                {
                  savedLinks.filter(
                    (item) => item.platform === folder.name
                  ).length
                }
                /5 saved
              </span>
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

            {errorMessage && (
              <p className="metadata-error">{errorMessage}</p>
            )}

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
                <p className="metadata-loading">
                  Fetching YouTube details...
                </p>
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

              <button className="save-btn" type="submit">
                Save Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOLDER POPUP */}
      {selectedFolder && (
        <div className="modal-overlay" onClick={closeFolder}>
          <div
            className="folder-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="folder-modal-header">
              <div className="folder-heading">
                <span className="folder-modal-icon">
                  {folders.find((f) => f.name === selectedFolder)?.icon}
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
                          <span className="watched-badge">Watched</span>
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
                            onChange={() => toggleWatched(item.id)}
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
                  <p>Your {selectedFolder} links will appear here.</p>
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
