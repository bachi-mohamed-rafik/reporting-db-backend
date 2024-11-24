const express = require('express');
const mongoose = require('mongoose');
const { db } = require('./mongodb');
const app = express();
const PORT = 3002;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const SECRET_KEY = 'your_secret_key'; // Define your JWT secret key

const { Pool } = require('pg');
const pool = new Pool({
  user: 'odoo',
  password: '$Rv@2022$$',
  host: '35.241.192.79',
  port: 5432, // default Postgres port
  database: 'prod'
});

app.use(cors());
app.use(express.json()); // Middleware to parse JSON

// MongoDB models
// problemType
const problemTypeSchema = new mongoose.Schema({
  name: String,
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }]
});
const ProblemType = mongoose.model('ProblemType', problemTypeSchema);

// problem
const problemSchema = new mongoose.Schema({
  name: String,
  description: String,
  sqlQuery: String,
  problemType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemType'
  }
});
const Problem = mongoose.model('Problem', problemSchema, 'problem');

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

// Route to fetch problems
app.get('/api/problem', async (req, res) => {
  try {
    const problems = await Problem.find();
//    const problems = await Problem.find().populate('problem_type');
    res.json(problems);
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).send("Server error");
  }
});

// Route to fetch Devis problems
app.get('/api/Devis/problems', async (req, res) => {
  try {
    const problems = await Problem.find().populate('problem_type');

    // Now use Array's filter method on the result
    const devisProblems = problems.filter(pb => pb.problem_type.name === "Devis");

    res.json(devisProblems);
  } catch (error) {
    console.error("Error fetching problems:", error);
    res.status(500).send("Server error");
  }
});

app.get('/api/fetch-data', async (req, res) => {
  const sqlQuery = req.query.sqlQuery;

  try {
    const result = await pool.query(sqlQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});


// Test route
app.get('/', (req, res) => {
  console.log("test");
  res.status(200).send("test");
});

// Load users from JSON file
const usersFilePath = path.join(__dirname, 'users.json');
const users = JSON.parse(fs.readFileSync(usersFilePath));

// Authenticate user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  try {
    // Verify the token (JWT example)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).send(decoded);
  } catch {
    res.status(401).send('Invalid token');
  }
});


mongoose.connection.once('connected', () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

