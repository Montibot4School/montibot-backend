// index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Parse incoming JSON
app.use(express.json());

// Simple health check route
app.get('/ping', (req, res) => {
  res.send('MontiBot backend active');
});

// Start the server
app.listen(port, () => {
  console.log(`MontiBot server running on port ${port}`);
});
