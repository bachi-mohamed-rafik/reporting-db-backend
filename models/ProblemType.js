const mongoose = require('mongoose');

const problemTypeSchema = new mongoose.Schema({
  name: String,
  description: String
});

const ProblemType = mongoose.model('ProblemType', problemTypeSchema); // Explicitly setting the collection name
