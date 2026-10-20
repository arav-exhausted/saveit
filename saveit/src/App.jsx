
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
