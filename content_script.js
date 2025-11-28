// YouTube Music Now Playing Scraper
// Runs in the YTM tab and sends track data to local server

const SERVER_URL = 'http://localhost:3000/update-track';
const POLL_INTERVAL = 1000; // Poll every 1 second

let lastTrackData = {
  title: '',
  artist: '',
  albumArt: '',
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

    // Get album art URL - YTM uses img element in the player bar
    const albumArtElement = document.querySelector('img.style-scope.ytmusic-player-bar');
    let albumArt = '';
    if (albumArtElement && albumArtElement.src) {
      // YTM provides different sizes, we want a high quality one
      albumArt = albumArtElement.src.replace(/=w\d+-h\d+/, '=w600-h600');
    }

    // Determine play/pause state - check the play button's title attribute
    const playButton = document.querySelector('#play-pause-button');
    let isPlaying = false;
    if (playButton) {
      const buttonTitle = playButton.getAttribute('title') || playButton.getAttribute('aria-label') || '';
      // If the button says "Pause", music is playing
      isPlaying = buttonTitle.toLowerCase().includes('pause');
    }

    // If no title found, treat as nothing playing
    if (!titleElement || title === '') {
      return {
        title: 'Nothing Playing',
        artist: '',
        albumArt: '',
        isPlaying: false
      };
    }

    return {
      title,
      artist,
      albumArt,
      isPlaying
    };
  } catch (error) {
    console.error('[YTM Scraper] Error scraping track data:', error);
    return {
      title: 'Nothing Playing',
      artist: '',
      albumArt: '',
      isPlaying: false
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
    } else {
      console.log('[YTM Scraper] Track data sent successfully:', trackData.title);
    }
  } catch (error) {
    console.error('[YTM Scraper] Failed to send track data:', error.message);
  }
}

/**
 * Checks if track data has changed
 */
function hasTrackChanged(newData, oldData) {
  return newData.title !== oldData.title ||
         newData.artist !== oldData.artist ||
         newData.isPlaying !== oldData.isPlaying;
}

/**
 * Main polling function
 */
function pollTrackData() {
  const currentTrackData = scrapeTrackData();

  // Only send if something changed
  if (hasTrackChanged(currentTrackData, lastTrackData)) {
    console.log('[YTM Scraper] Track changed, sending update...');
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
