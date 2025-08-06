const express = require('express');
const cors = require('cors');

console.log('Testing wildcard routes...');

try {
    const app = express();
    console.log('✓ Created app');
    
    app.use(cors());
    app.use(express.json());
    console.log('✓ Added middleware');
    
    app.get('/health', (req, res) => {
        res.json({ message: 'OK' });
    });
    console.log('✓ Added health route');
    
    const apiRoutes = require('./routes/api/index');
    app.use('/api', apiRoutes);
    console.log('✓ Added API routes');
    
    // Test the problematic 404 handler
    console.log('Adding 404 handler...');
    app.use('*', (req, res) => {
        res.status(404).json({ message: 'Not found' });
    });
    console.log('✓ Added 404 handler');
    
    console.log('Testing error handler...');
    app.use((error, req, res, next) => {
        res.status(500).json({ message: error.message });
    });
    console.log('✓ Added error handler');
    
    console.log('Success! All routes added.');
    
    // Try to start server
    console.log('Starting server...');
    const server = app.listen(3002, () => {
        console.log('Server started on port 3002');
        server.close(() => {
            console.log('Server closed successfully');
        });
    });
    
} catch (error) {
    console.error('Error:', error);
    console.error('Stack trace:', error.stack);
}