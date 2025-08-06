const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Test the routes individually
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Basic route works' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});