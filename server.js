const express = require('express');
const path = require('path');
const app = express();

// Define the port the app will run on. Use Heroku's dynamic port or 8080 for local test.
const port = process.env.PORT || 8080;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'Public')));

// Optional: Handle 404s by sending index.html (for SPA-like behavior if needed, though not strictly required for your current setup)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Serving static files from ${path.join(__dirname, 'public')}`);
});
