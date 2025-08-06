const express = require('express');
const cors = require('cors');

console.log('Creating minimal Express app...');

try {
    const app = express();
    console.log('✓ Created app');
    
    app.use(cors());
    console.log('✓ Added CORS');
    
    app.use(express.json());
    console.log('✓ Added JSON parser');
    
    app.get('/health', (req, res) => {
        res.json({ message: 'OK' });
    });
    console.log('✓ Added health route');
    
    // Try importing just the API routes index
    console.log('Importing API routes...');
    const apiRoutes = require('./routes/api/index');
    console.log('✓ API routes imported');
    
    // This is where the error might occur
    console.log('Mounting API routes...');
    app.use('/api', apiRoutes);
    console.log('✓ API routes mounted');
    
    console.log('Success! App created without errors.');
    
} catch (error) {
    console.error('Error creating app:', error);
    console.error('Stack trace:', error.stack);
}