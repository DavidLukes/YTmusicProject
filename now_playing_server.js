// YouTube Music Now Playing Bridge Server
// Receives track data from browser extension and serves it to display clients

const express = require('express');
const cors = require('cors');

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use('/screensaver-images', express.static(path.join(__dirname, 'screensaver_images'))); // Serve screensaver images

// In-memory storage for current track data
let currentTrack = {
    title: 'Nothing Playing',
    artist: '',
    albumArt: '',
    year: '',
    currentTime: '0:00',
    totalTime: '0:00',
    progress: 0,
    isPlaying: true,
    lastUpdated: new Date().toISOString()
};

/**
 * POST /update-track
 * Receives track data from the browser extension
 */
app.post('/update-track', (req, res) => {
    try {
        const { title, artist, albumArt, year, currentTime, totalTime, progress, isPlaying } = req.body;

        // Validate required fields
        if (typeof title !== 'string') {
            return res.status(400).json({ error: 'Invalid track data: title is required' });
        }

        // Update current track
        currentTrack = {
            title: title || 'Nothing Playing',
            artist: artist || '',
            albumArt: albumArt || '',
            year: year || '',
            currentTime: currentTime || '0:00',
            totalTime: totalTime || '0:00',
            progress: progress || 0,
            isPlaying: isPlaying === true,
            lastUpdated: new Date().toISOString()
        };

        console.log(`[SERVER] Track updated: "${currentTrack.title}" by ${currentTrack.artist} [${currentTrack.currentTime}/${currentTrack.totalTime}]`);

        res.json({
            success: true,
            message: 'Track data updated successfully'
        });
    } catch (error) {
        console.error('[Server] Error updating track:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /now-playing
 * Returns the current track data to display clients
 */
app.get('/now-playing', (req, res) => {
    res.json(currentTrack);
});

/**
 * GET /
 * Simple status endpoint
 */
app.get('/', (req, res) => {
    res.json({
        service: 'YouTube Music Now Playing Server by Davidlukes',
        status: 'running',
        currentTrack: currentTrack.title,
        endpoints: {
            updateTrack: 'POST /update-track',
            getNowPlaying: 'GET /now-playing'
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  YouTube Music Now Playing Server by Davidlukes            ║
║  Status: Running                                           ║
║  Port: ${PORT}                                                ║
╟────────────────────────────────────────────────────────────╢
║  Endpoints:                                                ║
║  • POST http://localhost:${PORT}/update-track                 ║
║  • GET  http://localhost:${PORT}/now-playing                  ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    process.exit(0)

        ;
});
