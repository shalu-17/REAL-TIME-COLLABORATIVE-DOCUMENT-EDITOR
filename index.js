import React from 'react';
import ReactDOM from 'react-dom/client'; // Import ReactDOM client for rendering
import App from './App'; // Import the main App component
import './index.css'; // Import global CSS styles

// Create a React root and attach it to the DOM element with id 'root'
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component inside the root
root.render(<App />);
