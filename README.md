# YouTube Music Now Playing Display System
Made with ❤ by Davidlukes
A self-hosted, real-time "Now Playing" system that displays album art, track title, and artist name from your active YouTube Music web player without relying on third-party scrobblers.

## Architecture

The system consists of three components:

1. **Browser Extension (Scraper)** - Runs inside the YouTube Music tab to scrape track data
2. **Node.js Server (Bridge)** - Receives data from the extension and serves it to display clients
3. **Display Client (Viewer)** - A web page that shows the now playing information

## Setup Instructions

### 1. Install Server Dependencies

```bash
cd d:\Projects\YTmusicProject
npm install
```

### 2. Start the Node.js Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 3. Install the Browser Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `d:\Projects\YTmusicProject` folder
5. The extension should now appear in your extensions list

### 4. Open YouTube Music

1. Navigate to `https://music.youtube.com`
2. Start playing a song
3. The extension will automatically start scraping and sending data to the server

### 5. Open the Display Client

1. Open `display_client.html` in a browser (can be on the same machine or a different device like a Raspberry Pi)
2. The display will automatically connect to `http://localhost:3000` and start showing now playing information

**Note:** If accessing from a different device, you'll need to:
- Update the `SERVER_URL` in `display_client.html` to use your server's IP address (e.g., `http://192.168.1.100:3000/now-playing`)
- Update the `SERVER_URL` in `content_script.js` to match (e.g., `http://192.168.1.100:3000/update-track`)

## File Structure

```
YTmusicProject/
├── manifest.json           # Chrome extension configuration
├── content_script.js       # Scraper that runs on YouTube Music
├── now_playing_server.js   # Express server (bridge)
├── display_client.html     # Display interface
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## How It Works

1. **Scraping**: The content script (`content_script.js`) runs on YouTube Music and polls the DOM every second for track information
2. **Data Transfer**: When a track changes or playback state changes, the extension sends a POST request to the local server
3. **Storage**: The server stores the latest track data in memory
4. **Display**: The display client polls the server every 3 seconds and updates the UI with the latest track information

## Features

- ✅ Real-time track updates
- ✅ Album art display with high-quality images
- ✅ Play/pause state indication with visual effects
- ✅ Animated pulsing glow when playing
- ✅ Responsive design for various screen sizes
- ✅ Clean "Nothing Playing" state
- ✅ Error handling and connection status
- ✅ No external dependencies (except Tailwind CSS via CDN)

## Customization

### Change Polling Intervals

**Content Script** (`content_script.js`):
```javascript
const POLL_INTERVAL = 1000; // Change to desired milliseconds
```

**Display Client** (`display_client.html`):
```javascript
const POLL_INTERVAL = 3000; // Change to desired milliseconds
```

### Change Server Port

**Server** (`now_playing_server.js`):
```javascript
const PORT = 3000; // Change to desired port
```

Remember to update the URLs in `content_script.js` and `display_client.html` accordingly.

### Customize Display Styling

The display client uses Tailwind CSS and custom CSS. You can modify the styles in the `<style>` section of `display_client.html`.

## Troubleshooting

### Extension not scraping data
- Check the browser console on YouTube Music for error messages
- Verify the extension is enabled and has permissions
- Ensure you're on `music.youtube.com` (not regular YouTube)

### Display shows "Connection Error"
- Verify the Node.js server is running
- Check that the `SERVER_URL` in `display_client.html` is correct
- Ensure CORS is enabled on the server (it should be by default)

### Track data not updating
- Check the server console for incoming requests
- Verify the content script is running (check browser console)
- Try refreshing the YouTube Music tab

## License

MIT
