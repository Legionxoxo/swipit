/**
 * Working BuzzHunt Server
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import functions directly
const { startAnalysis, getAnalysisStatus } = require('./functions/route_fns/analyzeChannel');
const { generateExport } = require('./functions/route_fns/exportData');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'BuzzHunt is running',
        timestamp: new Date().toISOString()
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'BuzzHunt API',
        version: '1.0.0',
        endpoints: {
            analyze: 'POST /api/analyze',
            status: 'GET /api/analysis/:id', 
            export: 'GET /api/export/:id/:format'
        }
    });
});

// Start analysis
app.post('/api/analyze', async (req, res) => {
    try {
        const { channelUrl } = req.body;
        
        if (!channelUrl) {
            return res.status(400).json({
                success: false,
                message: 'Channel URL is required'
            });
        }
        
        const result = await startAnalysis(channelUrl);
        
        res.json({
            success: true,
            message: 'Analysis started',
            analysisId: result.analysisId,
            estimatedTime: result.estimatedTime
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get analysis status
app.get('/api/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const analysisData = await getAnalysisStatus(id);
        
        if (!analysisData) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }
        
        res.json({
            success: true,
            data: analysisData
        });
        
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Export data
app.get('/api/export/:id/:format', async (req, res) => {
    try {
        const { id, format } = req.params;
        
        if (!['csv', 'json'].includes(format.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Format must be csv or json'
            });
        }
        
        const exportResult = await generateExport(id, format.toLowerCase());
        
        if (!exportResult) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found or not completed'
            });
        }
        
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.send(exportResult.fileContent);
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 BuzzHunt Started');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
});