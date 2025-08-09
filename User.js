const mongoose = require('mongoose');

// Define the schema for User collection
const UserSchema = new mongoose.Schema({
  // Username field - must be unique, required, and trimmed of whitespace
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  // Email field - must be unique, required, and trimmed
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  // Password field - required (should store hashed password for security)
  password: { 
    type: String, 
    required: true 
  },
}, { 
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true 
});

// Export the User model to use in other parts of the app
module.exports = mongoose.model('User', UserSchema);
