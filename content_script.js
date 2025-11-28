// YouTube Music Now Playing Scraper
// Runs in the YTM tab and sends track data to local server

const SERVER_URL = 'https://192.168.1.181:3000/update-track';
const POLL_INTERVAL = 1000; // Poll every 1 second

let lastTrackData = {
    title: '',
    artist: '',
    albumArt: '',
    year: '',
    isPlaying: false
};

/**
 * Scrapes the current track information from the YouTube Music DOM
 */
function scrapeTrackData() {
    try {
        // Get song title - YTM uses this class for the title
        const titleElement = document.querySelector('.title.style-scope.ytmusic-player-bar');
        const title = titleElement ? titleElement.textContent.trim() : 'Nothing Playing';

        // Get artist name - YTM uses byline for artist info
        const artistElement = document.querySelector('.byline.style-scope.ytmusic-player-bar');
        let artist = 'Unknown Artist';
        if (artistElement) {
            // The byline can contain multiple links (artist, album), we want the first one
            const artistLink = artistElement.querySelector('a');
            artist = artistLink ? artistLink.textContent.trim() : artistElement.textContent.trim();
        }

        // Get year - YTM sometimes includes year in the byline text
        let year = '';
        if (artistElement) {
            const bylineText = artistElement.textContent;
            // Look for a 4-digit year (1900-2099)
            const yearMatch = bylineText.match(/\b(19\d{2}|20\d{2})\b/);
            if (yearMatch) {
                year = yearMatch[1];
            }
        }

        // Get album art URL - YTM uses img element in the player bar
        const albumArtElement = document.querySelector('img.style-scope.ytmusic-player-bar');
        let albumArt = '';
        if (albumArtElement && albumArtElement.src) {
            // YTM provides different sizes, we want a high quality one
            albumArt = albumArtElement.src.replace(/=w\d+-h\d+/, '=w600-h600');
        }

        // Get time info
        const timeElement = document.querySelector('.time-info.style-scope.ytmusic-player-bar');
        let currentTime = '0:00';
        let totalTime = '0:00';
        let progress = 0;

        if (timeElement) {
            const timeText = timeElement.textContent.trim();
            const parts = timeText.split(' / ');
            if (parts.length === 2) {
                currentTime = parts[0];
                totalTime = parts[1];

                // Calculate progress percentage
                const parseTime = (timeStr) => {
                    const [mins, secs] = timeStr.split(':').map(Number);
                    return mins * 60 + secs;
                };

                const currentSecs = parseTime(currentTime);
                const totalSecs = parseTime(totalTime);

                if (totalSecs > 0) {
                    progress = (currentSecs / totalSecs) * 100;
                }
            }
        }

        // Determine play/pause state
        // Primary method: Check the video element
        const videoElement = document.querySelector('video');
        let isPlaying = false;

        if (videoElement) {
            isPlaying = !videoElement.paused;
        } else {
            // Fallback: Check the play button's title attribute
            const playButton = document.querySelector('#play-pause-button, .play-pause-button');
            if (playButton) {
                const buttonTitle = playButton.getAttribute('title') || playButton.getAttribute('aria-label') || '';
                // If the button says "Pause", music is playing
                isPlaying = buttonTitle.toLowerCase().includes('pause');
            }
        }

        // Get like status
        // Get like status
        // Try multiple selectors for robustness
        const likeButton = document.querySelector('.like.ytmusic-like-button-renderer') ||
            document.querySelector('ytmusic-like-button-renderer .like') ||
            document.querySelector('ytmusic-like-button-renderer button');

        let isLiked = false;
        if (likeButton) {
            // Check aria-pressed (standard)
            if (likeButton.getAttribute('aria-pressed') === 'true') {
                isLiked = true;
            }
            // Check aria-label (sometimes changes to "Unlike")
            else if (likeButton.getAttribute('aria-label') === 'Unlike') {
                isLiked = true;
            }
        }

        // If no title found, treat as nothing playing
        if (!titleElement || title === '') {
            return {
                title: 'Nothing Playing',
                artist: '',
                albumArt: '',
                year: '',
                currentTime: '0:00',
                totalTime: '0:00',
                progress: 0,
                isPlaying: false
            };
        }

        return {
            title,
            artist,
            albumArt,
            year,
            currentTime,
            totalTime,
            progress,
            isPlaying,
            isLiked
        };
    } catch (error) {
        console.error('[YTM Scraper] Error scraping track data:', error);
        return {
            title: 'Nothing Playing',
            artist: '',
            albumArt: '',
            year: '',
            currentTime: '0:00',
            totalTime: '0:00',
            progress: 0,
            isPlaying: false,
            isLiked: false
        };
    }
}

/**
 * Sends track data to the local server
 */
async function sendTrackData(trackData) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(trackData)
        });

        if (!response.ok) {
            console.error('[YTM Scraper] Server responded with error:', response.status);
        }
    } catch (error) {
        // Silent fail to avoid console spam
    }
}

/**
 * Checks if track data has changed
 */
function hasTrackChanged(newData, oldData) {
    return newData.title !== oldData.title ||
        newData.artist !== oldData.artist ||
        newData.isPlaying !== oldData.isPlaying ||
        newData.isLiked !== oldData.isLiked ||
        newData.currentTime !== oldData.currentTime; // Check time changes too
}

/**
 * Main polling function
 */
function pollTrackData() {
    const currentTrackData = scrapeTrackData();

    // Always send update if playing to keep time in sync
    // Or if track info changed
    if (currentTrackData.isPlaying || hasTrackChanged(currentTrackData, lastTrackData)) {
        sendTrackData(currentTrackData);
        lastTrackData = currentTrackData;
    }
}

// Wait for the page to be fully loaded before starting
function initialize() {
    console.log('[YTM Scraper] Initializing YouTube Music scraper...');

    // Send initial state
    const initialData = scrapeTrackData();
    sendTrackData(initialData);
    lastTrackData = initialData;

    // Start polling
    setInterval(pollTrackData, POLL_INTERVAL);
    console.log('[YTM Scraper] Polling started (interval: ' + POLL_INTERVAL + 'ms)');
}

// Start the scraper when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
