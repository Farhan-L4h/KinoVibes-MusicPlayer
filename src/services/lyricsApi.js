// Lyrics API service
// Manages lyrics stored locally in project with fallback to APIs

const GENIUS_ACCESS_TOKEN = 'your_genius_access_token'; // To be configured
const MUSIXMATCH_API_KEY = 'your_musixmatch_api_key'; // To be configured
const LYRICS_BASE_PATH = '/lyrics/';

// Demo lyrics data for testing
const demoLyrics = {
  'demo1': {
    title: 'Chill Vibes',
    artist: 'Demo Artist 1', 
    lyrics: [
      { time: 0, text: '' },
      { time: 5, text: 'Walking down the empty street tonight' },
      { time: 10, text: 'City lights are shining bright' },
      { time: 15, text: 'Feel the rhythm in my soul' },
      { time: 20, text: 'Music makes me lose control' },
      { time: 25, text: '' },
      { time: 30, text: 'Chill vibes flowing through the air' },
      { time: 35, text: 'Nothing else can compare' },
      { time: 40, text: 'To this moment here with you' },
      { time: 45, text: 'All my dreams are coming true' },
      { time: 50, text: '' },
      { time: 55, text: 'Let the music take control' },
      { time: 60, text: 'Feel it deep within your soul' },
      { time: 65, text: 'Dance until the morning light' },
      { time: 70, text: 'Everything will be alright' },
      { time: 75, text: '' },
      { time: 80, text: 'Chill vibes, chill vibes' },
      { time: 85, text: 'That\'s the way we live our lives' },
      { time: 90, text: 'Chill vibes, chill vibes' },
      { time: 95, text: 'Under starlit summer skies' },
      { time: 100, text: '' }
    ]
  },
  'demo2': {
    title: 'Summer Nights',
    artist: 'Demo Artist 2',
    lyrics: [
      { time: 0, text: '' },
      { time: 8, text: 'Summer nights and neon dreams' },
      { time: 15, text: 'Nothing is quite what it seems' },
      { time: 22, text: 'Dancing under midnight stars' },
      { time: 29, text: 'Forget about tomorrow\'s scars' },
      { time: 36, text: '' },
      { time: 43, text: 'Ocean breeze and sandy toes' },
      { time: 50, text: 'Where this feeling comes and goes' },
      { time: 57, text: 'Hold me close and don\'t let go' },
      { time: 64, text: 'This is all I need to know' },
      { time: 71, text: '' },
      { time: 78, text: 'Summer nights will fade away' },
      { time: 85, text: 'But the memories will stay' },
      { time: 92, text: 'In my heart forever more' },
      { time: 99, text: 'This is what I\'m living for' },
      { time: 106, text: '' }
    ]
  },
  'demo3': {
    title: 'Midnight Drive',
    artist: 'Demo Artist 3',
    lyrics: [
      { time: 0, text: '' },
      { time: 6, text: 'Cruising down the highway fast' },
      { time: 12, text: 'Hoping this moment will last' },
      { time: 18, text: 'Radio playing our song' },
      { time: 24, text: 'We\'ve been waiting for so long' },
      { time: 30, text: '' },
      { time: 36, text: 'Midnight drive with you by my side' },
      { time: 42, text: 'Nothing left for us to hide' },
      { time: 48, text: 'Racing through the city lights' },
      { time: 54, text: 'Everything just feels so right' },
      { time: 60, text: '' },
      { time: 66, text: 'Windows down and music loud' },
      { time: 72, text: 'We can rise above the crowd' },
      { time: 78, text: 'Freedom calling out our names' },
      { time: 84, text: 'Nothing will ever be the same' },
      { time: 90, text: '' }
    ]
  },
  'demo4': {
    title: 'Ocean Waves',
    artist: 'Demo Artist 4',
    lyrics: [
      { time: 0, text: '' },
      { time: 10, text: 'Listen to the ocean waves' },
      { time: 18, text: 'Washing all my fears away' },
      { time: 26, text: 'Peaceful sounds that heal my soul' },
      { time: 34, text: 'Making broken spirits whole' },
      { time: 42, text: '' },
      { time: 50, text: 'Seagulls dancing in the sky' },
      { time: 58, text: 'Time just seems to pass me by' },
      { time: 66, text: 'Nature\'s symphony so pure' },
      { time: 74, text: 'This is what my heart lives for' },
      { time: 82, text: '' },
      { time: 90, text: 'Ocean waves, ocean waves' },
      { time: 98, text: 'Gentle rhythm that soothes and saves' },
      { time: 106, text: 'Ocean waves, ocean waves' },
      { time: 114, text: 'In your presence my soul behaves' },
      { time: 122, text: '' }
    ]
  },
  'demo5': {
    title: 'City Lights',
    artist: 'Demo Artist 5',
    lyrics: [
      { time: 0, text: '' },
      { time: 7, text: 'City lights illuminate the night' },
      { time: 14, text: 'Everything\'s gonna be alright' },
      { time: 21, text: 'Street sounds mixing with the beat' },
      { time: 28, text: 'Moving to the urban heat' },
      { time: 35, text: '' },
      { time: 42, text: 'Neon signs and busy streets' },
      { time: 49, text: 'This is where our story meets' },
      { time: 56, text: 'In the heart of downtown flow' },
      { time: 63, text: 'This is all we need to know' },
      { time: 70, text: '' },
      { time: 77, text: 'City lights, city lights' },
      { time: 84, text: 'Guiding us through sleepless nights' },
      { time: 91, text: 'City lights, city lights' },
      { time: 98, text: 'Making everything feel right' },
      { time: 105, text: '' }
    ]
  }
};

// Fetch lyrics from Genius API (with fallback to demo)
export const fetchLyricsFromGenius = async (artist, title) => {
  try {
    if (!GENIUS_ACCESS_TOKEN) {
      throw new Error('Genius API not configured');
    }

    // Search for song on Genius
    const searchResponse = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(artist + ' ' + title)}`,
      {
        headers: {
          'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Genius search failed');
    }

    const searchData = await searchResponse.json();
    
    if (searchData.response.hits.length === 0) {
      throw new Error('No lyrics found');
    }

    const songId = searchData.response.hits[0].result.id;
    
    // Note: Genius API doesn't provide synchronized lyrics timestamps
    // This would require additional processing or different API
    
    return {
      lyrics: searchData.response.hits[0].result.lyrics || 'Lyrics not available',
      synchronized: false
    };

  } catch (error) {
    console.error('Genius API error:', error);
    throw error;
  }
};

// Fetch synchronized lyrics from local files or demo
export const fetchSynchronizedLyrics = async (songId) => {
  try {
    // Try to load lyrics from local file first
    const localLyricsPath = `${LYRICS_BASE_PATH}${songId}.json`;
    try {
      const response = await fetch(localLyricsPath);
      if (response.ok) {
        const lyricsData = await response.json();
        return {
          lyrics: lyricsData.lyrics,
          synchronized: true,
          source: 'local'
        };
      }
    } catch {
      console.log('No local lyrics file found, checking demo data...');
    }
    
    // Check if we have demo lyrics
    if (demoLyrics[songId]) {
      return {
        lyrics: demoLyrics[songId].lyrics,
        synchronized: true,
        source: 'demo'
      };
    }

    // In a real implementation, you would use APIs like:
    // - Musixmatch API (has synchronized lyrics)
    // - Spotify Web API (limited lyrics access)
    // - LyricFind API (commercial)
    
    throw new Error('Synchronized lyrics not available');

  } catch (error) {
    console.error('Synchronized lyrics error:', error);
    
    // Return basic unsynchronized lyrics as fallback
    return {
      lyrics: [
        { time: 0, text: 'Lyrics not available for this song' },
        { time: 5, text: 'Please check back later or try another track' }
      ],
      synchronized: false,
      source: 'fallback'
    };
  }
};

// Save synchronized lyrics to local file
export const saveLyricsLocally = async (songId, artist, title, lyrics) => {
  const lyricsData = {
    songId,
    artist,
    title,
    lyrics,
    createdAt: new Date().toISOString()
  };
  
  const fileName = `${songId}.json`;
  const jsonString = JSON.stringify(lyricsData, null, 2);
  
  // Store in localStorage as reference
  const pendingLyrics = JSON.parse(localStorage.getItem('pending_lyrics_files') || '[]');
  pendingLyrics.push({
    fileName,
    songId,
    artist,
    title,
    data: lyricsData,
    timestamp: Date.now()
  });
  localStorage.setItem('pending_lyrics_files', JSON.stringify(pendingLyrics));
  
  console.log(`✅ Lyrics queued for ${title} by ${artist}`);
  console.log(`⚠️  Save to: public/lyrics/${fileName}`);
  console.log('Content:', jsonString);
  
  return fileName;
};

// Get current lyric line based on playback time
export const getCurrentLyricLine = (lyrics, currentTime) => {
  if (!lyrics || lyrics.length === 0) return null;

  // Find the most recent lyric that should be displayed
  let currentLyric = null;
  let nextLyric = null;

  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) {
      currentLyric = lyrics[i];
      nextLyric = lyrics[i + 1] || null;
    } else {
      break;
    }
  }

  return {
    current: currentLyric,
    next: nextLyric,
    progress: nextLyric ? 
      Math.min(1, (currentTime - currentLyric.time) / (nextLyric.time - currentLyric.time)) : 
      1
  };
};

// Search for lyrics with multiple providers
export const searchLyrics = async (artist, title, songId = null) => {
  const providers = [
    () => fetchSynchronizedLyrics(songId, artist, title),
    () => fetchLyricsFromGenius(artist, title)
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result.lyrics && result.lyrics.length > 0) {
        return result;
      }
    } catch {
      continue; // Try next provider
    }
  }

  // Final fallback
  return {
    lyrics: [
      { time: 0, text: `Lyrics for "${title}" by ${artist}` },
      { time: 5, text: 'are not available at this time.' },
      { time: 10, text: '' },
      { time: 15, text: 'Enjoy the music! 🎵' }
    ],
    synchronized: true,
    source: 'fallback'
  };
};

// Configuration check
export const isLyricsApiConfigured = () => {
  return {
    genius: !!GENIUS_ACCESS_TOKEN,
    musixmatch: !!MUSIXMATCH_API_KEY
  };
};