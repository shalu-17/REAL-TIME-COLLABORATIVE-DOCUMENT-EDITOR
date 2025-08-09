// src/App.js
// Main application component that renders the overall layout

import React from "react";
import Editor from "./editor"; // Import the collaborative editor component
import "./styles.css";         // Import global styles

function App() {
  return (
    <div className="app-container">
      {/* Title section of the app */}
      <div className="title-box">
        <h1>My Docs</h1>
      </div>

      {/* Placeholder for feature descriptions or controls (currently empty) */}
      <div className="features-box">
        {/* Add any feature-related UI here in the future */}
      </div>

      {/* Main editor area where the Editor component is rendered */}
      <div className="editor-area">
        <Editor />
      </div>
    </div>
  );
}

export default App;
