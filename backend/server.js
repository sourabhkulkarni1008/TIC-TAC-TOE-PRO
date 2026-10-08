const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Root directory containing static frontend files
const rootDir = path.resolve(__dirname, '..');

// Serve static frontend assets
app.use(express.static(rootDir));
// Health & Status API Endpoints
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'Tic-Tac-Toe Pro Backend API',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.status(200).json({
        online: true,
        message: 'Backend server is operational and connected to frontend',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend single page app for any route
app.get('*', (req, res) => {
    const indexPath = path.join(rootDir, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'index.html'), (fallbackErr) => {
                if (fallbackErr) {
                    res.status(200).send('Tic-Tac-Toe Pro Backend Service is Active.');
                }
            });
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Tic-Tac-Toe Pro Server running on port ${PORT}`);
});
