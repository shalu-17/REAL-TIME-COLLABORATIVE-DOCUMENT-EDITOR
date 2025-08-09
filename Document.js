const mongoose = require('mongoose');

// Define the schema for Document collection
const DocumentSchema = new mongoose.Schema({
  // Use a string as the document ID (_id), required for identifying documents
  _id: {
    type: String,
    required: true,
  },
  // The document data stored in Quill Delta format (an object representing rich text)
  data: {
    type: Object, // Quill Delta format is stored as an object, not a string
    required: true,
    // Default value is an empty document with a single newline character
    default: { ops: [{ insert: '\n' }] },
  }
});

// Export the Document model to use it in other parts of the app
module.exports = mongoose.model('Document', DocumentSchema);
