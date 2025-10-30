# Lyrics Files

This folder contains synchronized lyrics files in JSON format.

## File Format:

Each lyrics file should be named: `{songId}.json`

Example: `local_1730312345678.json`

## JSON Structure:

```json
{
  "songId": "local_1730312345678",
  "artist": "Artist Name",
  "title": "Song Title",
  "createdAt": "2025-10-30T12:00:00.000Z",
  "lyrics": [
    { "time": 0, "text": "" },
    { "time": 5, "text": "First line of lyrics" },
    { "time": 10, "text": "Second line of lyrics" },
    { "time": 15, "text": "Third line of lyrics" }
  ]
}
```

## Time Format:

- `time`: Time in seconds when the lyric line should be displayed
- `text`: The lyric text to display (empty string for pauses)

## Demo Lyrics:

Demo lyrics are hardcoded in `src/services/lyricsApi.js` for demo songs.
You can create custom lyrics files here for your own songs.

## Tools for Creating Synchronized Lyrics:

1. **LRC Editor** - Create .lrc files and convert to JSON
2. **MiniLyrics** - Desktop app for creating synced lyrics
3. Manual timing - Play the song and note timestamps

## Converting LRC to JSON:

If you have an .lrc file, you can convert it to the JSON format:

```javascript
function lrcToJson(lrcContent) {
  const lines = lrcContent.split('\n');
  const lyrics = [];
  
  lines.forEach(line => {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      const text = match[3].trim();
      lyrics.push({ time, text });
    }
  });
  
  return { lyrics };
}
```
