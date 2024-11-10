const express = require('express');
const mongoose = require('mongoose');
const { db } = require('./mongodb');
const app = express();
const PORT = 3002;

// MongoDB model
const problemTypeSchema = new mongoose.Schema({
  name: String,
  description: String
});
const ProblemType = mongoose.model('ProblemType', problemTypeSchema, 'problem_types');

// Middleware to parse JSON
app.use(express.json());

// Route to fetch problem types
app.get('/api/problem-types', async (req, res) => {
  try {
    const problemTypes = await ProblemType.find();
    res.json(problemTypes);
  } catch (error) {
    console.error("Error fetching problem types:", error);
    res.status(500).send("Server error");
  }
});

// Route to test
app.get('/', async (req, res) => {
  try {
    console.error("test");
    res.status(500).send("test");
  } catch (error) {
    console.error("Error fetching problem types:", error);
    res.status(500).send("Server error");
  }
});

mongoose.connection.once('connected', () => {
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
