const express = require('express');

console.log('Testing individual route patterns...');

try {
    const router = express.Router();
    console.log('✓ Created router');
    
    // Test each route pattern individually
    router.get('/', (req, res) => { res.send('ok'); });
    console.log('✓ Basic route');
    
    router.get('/:id', (req, res) => { res.send('ok'); });
    console.log('✓ Single param route');
    
    router.get('/:id/:format', (req, res) => { res.send('ok'); });
    console.log('✓ Double param route');
    
    console.log('All routes added successfully');
    
} catch (error) {
    console.error('Error adding routes:', error);
}

// Test importing the actual route files
console.log('\nTesting route file imports...');

try {
    const analyzeRoutes = require('./routes/api/analyze');
    console.log('✓ Analyze routes imported');
} catch (error) {
    console.error('✗ Error importing analyze routes:', error);
}

try {
    const exportRoutes = require('./routes/api/export');
    console.log('✓ Export routes imported');
} catch (error) {
    console.error('✗ Error importing export routes:', error);
}

try {
    const apiRoutes = require('./routes/api/index');
    console.log('✓ API index routes imported');
} catch (error) {
    console.error('✗ Error importing API index routes:', error);
}