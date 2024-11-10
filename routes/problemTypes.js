const express = require('express');
const ProblemType = require('../models/ProblemType'); // Import the ProblemType model
const router = express.Router();

// Route to get all problem types
router.get('/api/problem-types', async (req, res) => {
  try {
    // Find all problem types from MongoDB
    const problemTypes = await ProblemType.find();
    
    // Send the retrieved problem types as response
    res.json(problemTypes);
  } catch (error) {
    console.error("Error fetching problem types: ", error)
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
