require('dotenv').config(); // Load environment variables from .env file
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing
const express = require('express'); // Express framework for HTTP server
const http = require('http'); // Node's HTTP module to create server
const { Server } = require('socket.io'); // Socket.IO server for real-time communication
const mongoose = require('mongoose'); // Mongoose ORM for MongoDB
const Document = require('./models/Document'); // Document model schema

const app = express(); // Create Express app
const server = http.createServer(app); // Create HTTP server using Express app

// Initialize Socket.IO server with CORS enabled for all origins (adjust as needed for security)
const io = new Server(server, {
  cors: {
    origin: '*',  // Allow all origins; in production restrict this to your frontend URL
  }
});

const PORT = process.env.PORT || 5000; // Server port from environment or default 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab-doc-editor'; // MongoDB URI

app.use(cors()); // Enable CORS middleware globally
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB and listen for connection events
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));

// Socket.IO connection handler - runs when a new client connects
io.on('connection', socket => {
  console.log(`📡 New client connected: ${socket.id}`);

  // Listen for client requesting a document by ID
  socket.on('get-document', async (documentId) => {
    if (!documentId) {
      socket.emit('error', 'Document ID is required'); // Send error if no ID provided
      return;
    }
    // Find existing document or create a new one
    const document = await findOrCreateDocument(documentId);

    socket.join(documentId); // Join a room named by documentId for real-time collaboration
    socket.emit('load-document', document.data); // Send document data to client

    // Listen for changes sent by this client and broadcast to others in the same room
    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    // Listen for save event to update document data in MongoDB
    socket.on('save-document', async (data) => {
      try {
        await Document.findByIdAndUpdate(documentId, { data });
      } catch (err) {
        console.error('Error saving document:', err);
      }
    });
  });
});

// Helper function: Finds a document by ID or creates a new empty one if none exists
async function findOrCreateDocument(id) {
  if (!id) return;

  let document = await Document.findById(id);
  if (document) return document;

  document = new Document({ _id: id, data: '' }); // Create new doc with empty data
  await document.save();
  return document;
}

// Start the server and listen on specified port
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
