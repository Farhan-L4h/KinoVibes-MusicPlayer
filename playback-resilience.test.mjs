import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Run offline: node --experimental-vm-modules --test playback-resilience.test.mjs
const flush = async () => { for (let i = 0; i < 25; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  json: async () => body, text: async () => body,
});

function clock() {
  let now = 100_000, id = 0;
  const jobs = new Map();
  const add = (fn, delay, repeat = false) => {
    jobs.set(++id, { fn, at: now + delay, delay, repeat });
    return id;
  };
  return {
    now: () => now,
    globals: {
      Date: class extends Date { static now() { return now; } },
      setTimeout: (fn, delay) => add(fn, delay), clearTimeout: (id) => jobs.delete(id),
      setInterval: (fn, delay) => add(fn, delay, true), clearInterval: (id) => jobs.delete(id),
    },
    async tick(ms) {
      const end = now + ms;
      while (true) {
        const next = [...jobs].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [key, job] = next;
        now = job.at;
        if (job.repeat) job.at += job.delay;
        else jobs.delete(key);
        job.fn();
        await flush();
      }
      now = end;
      await flush();
    },
  };
}

async function load(file, mocks = {}, globals = {}, time = clock()) {
  const context = vm.createContext({
    console: { warn() {}, error() {} }, URLSearchParams, AbortController, DOMException,
    TypeError, Blob, File, Event, EventTarget,
    fetch: () => { throw new Error('Unexpected network request'); },
    ...time.globals, ...globals,
  });
  const module = new vm.SourceTextModule(await readFile(new URL(file, import.meta.url), 'utf8'), {
    context, identifier: file,
    initializeImportMeta(meta) { meta.env = { VITE_SUPABASE_URL: 'https://offline.invalid', VITE_SUPABASE_ANON_KEY: 'anon-test' }; },
  });
  await module.link((name) => {
    assert.ok(name in mocks, `Missing mock: ${name}`);
    const exports = mocks[name];
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return { api: module.namespace, context, time };
}

function authMock() {
  const listeners = [];
  return {
    auth: { onAuthStateChange: (fn) => listeners.push(fn) },
    emit: (event, id) => listeners.forEach((fn) => fn(event, id ? { user: { id } } : null)),
  };
}

async function signedHarness(sign = async (path) => ({ data: { signedUrl: `signed:${path}` } }), remove = async () => ({})) {
  const auth = authMock();
  const calls = [];
  const client = { ...auth, storage: { from: (bucket) => ({
    createSignedUrl: (path, expiry) => { calls.push([bucket, path, expiry]); return sign(path); },
    remove,
  }) } };
  const h = await load('./src/config/supabase.js', {
    '@supabase/supabase-js': { createClient: (_url, key) => { assert.equal(key, 'anon-test'); return client; } },
  });
  auth.emit('INITIAL_SESSION', 'a');
  return { ...h, auth, calls };
}

test('signed URLs dedupe, use expiry in key, expire and bound LRU cache', async () => {
  const h = await signedHarness();
  const get = h.api.getSignedUrl;
  await Promise.all([get('music', 'a'), get('music', 'a')]);
  assert.equal(h.calls.length, 1);
  await get('music', 'a', 120);
  assert.equal(h.calls.length, 2);
  await h.time.tick(61_000);
  await get('music', 'a', 120);
  assert.equal(h.calls.length, 3);
  for (let i = 0; i < 201; i++) await get('music', `path-${i}`);
  const before = h.calls.length;
  await get('music', 'a');
  assert.equal(h.calls.length, before + 1);
});

test('signed URL auth change, sign-out and deletion invalidate in-flight requests', async () => {
  const requests = [];
  const h = await signedHarness(() => { const d = deferred(); requests.push(d); return d.promise; });
  const old = h.api.getSignedUrl('music', 'private');
  const rejected = assert.rejects(old, { name: 'AbortError' });
  h.auth.emit('SIGNED_IN', 'b');
  const fresh = h.api.getSignedUrl('music', 'private');
  requests[0].resolve({ data: { signedUrl: 'user-a' } });
  requests[1].resolve({ data: { signedUrl: 'user-b' } });
  await rejected;
  assert.equal(await fresh, 'user-b');
  h.auth.emit('TOKEN_REFRESHED', 'b');
  assert.equal(await h.api.getSignedUrl('music', 'private'), 'user-b');
  h.auth.emit('SIGNED_OUT');
  const deleted = h.api.getSignedUrl('music', 'private');
  const noDeleted = assert.rejects(deleted, { name: 'AbortError' });
  await h.api.deleteFile('music', 'private');
  requests[2].resolve({ data: { signedUrl: 'deleted' } });
  await noDeleted;
  assert.equal(h.calls.length, 3);
});

test('signed URL requests time out and can be retried', async () => {
  const h = await signedHarness(() => new Promise(() => {}));
  const rejected = assert.rejects(h.api.getSignedUrl('music', 'slow'), { name: 'TimeoutError' });
  await h.time.tick(15_000);
  await rejected;
  const again = assert.rejects(h.api.getSignedUrl('music', 'slow'), { name: 'TimeoutError' });
  await h.time.tick(15_000);
  await again;
  assert.equal(h.calls.length, 2);
});

async function lyricsHarness(fetch, sign = async () => 'private-signed') {
  const auth = authMock();
  const h = await load('./src/services/lyricsApi.js', {
    '../config/supabase': { supabase: auth, getSignedUrl: sign, uploadFile() {}, BUCKETS: { LYRICS: 'lyrics' } },
    '../lib/lrc': { isLrcFormat: (text) => text.startsWith('['), parseLrc: (text) => ({ lines: [{ text }], offsetMs: 125 }) },
    '../lib/utils': { cleanTitle: (text) => text },
    './supabaseMusicApi': { ensureYouTubeTrack() {} },
  }, { fetch });
  auth.emit('INITIAL_SESSION', 'a');
  return { ...h, auth };
}
const lyricTrack = { id: 'lyrics-1', title: 'Song', artist: 'Artist' };

test('private lyric signing failure never falls back to public URL or LRCLIB', async () => {
  let fetches = 0, signs = 0;
  const h = await lyricsHarness(() => { fetches++; }, async () => { signs++; throw new TypeError('Failed to fetch'); });
  const track = { ...lyricTrack, lyricsPath: 'private/lrc', lyricsUrl: 'public-legacy' };
  await assert.rejects(h.api.fetchLyrics(track), /Failed to fetch/);
  await assert.rejects(h.api.fetchLyrics(track), /Failed to fetch/);
  assert.equal(fetches, 0);
  assert.equal(signs, 2);
});

test('lyrics do not cache failures/null; successful requests dedupe and retain shape', async () => {
  let count = 0;
  const h = await lyricsHarness(async () => {
    count++;
    if (count === 1) throw new TypeError('offline');
    if (count === 2) return response({}, 404);
    return response({ plainLyrics: 'words' });
  });
  await assert.rejects(h.api.fetchLyrics(lyricTrack), /offline/);
  assert.equal(await h.api.fetchLyrics(lyricTrack), null);
  const [a, b] = await Promise.all([h.api.fetchLyrics(lyricTrack), h.api.fetchLyrics(lyricTrack)]);
  assert.equal(a, b);
  assert.equal(a.plain, 'words');
  assert.equal(a.synced, null);
  assert.equal(a.source, 'lrclib');
  assert.equal(a.baseOffsetMs, 0);
  await h.api.fetchLyrics(lyricTrack);
  assert.equal(count, 3);
});

test('forced lyrics supersede pending work and auth changes clear private lyrics', async () => {
  const pending = [];
  const h = await lyricsHarness((_url, options) => {
    const d = deferred(); pending.push({ ...d, signal: options.signal }); return d.promise;
  });
  const track = { ...lyricTrack, lyricsPath: 'private/lrc' };
  const old = assert.rejects(h.api.fetchLyrics(track), { name: 'AbortError' });
  await flush();
  const fresh = h.api.fetchLyrics(track, { force: true });
  await flush();
  assert.equal(pending[0].signal.aborted, true);
  pending[1].resolve(response('[00:01]new'));
  assert.equal((await fresh).baseOffsetMs, 125);
  pending[0].resolve(response('old'));
  await old;
  assert.equal((await h.api.fetchLyrics(track)).synced[0].text, '[00:01]new');
  h.auth.emit('SIGNED_OUT');
  const next = h.api.fetchLyrics(track);
  await flush();
  assert.equal(pending.length, 3);
  pending[2].resolve(response('after login'));
  assert.equal((await next).plain, 'after login');
});

test('lyrics timeout includes signing, and cancelled callers do not cancel shared work', async () => {
  const h = await lyricsHarness(async () => response('unused'), () => new Promise(() => {}));
  const timeout = assert.rejects(h.api.fetchLyrics({ ...lyricTrack, lyricsPath: 'slow' }), { name: 'TimeoutError' });
  await h.time.tick(12_000);
  await timeout;
  const d = deferred();
  const h2 = await lyricsHarness(() => d.promise);
  const controller = new AbortController();
  const first = assert.rejects(h2.api.fetchLyrics(lyricTrack, { signal: controller.signal }), { name: 'AbortError' });
  const second = h2.api.fetchLyrics(lyricTrack);
  controller.abort();
  d.resolve(response({ plainLyrics: 'shared' }));
  await first;
  assert.equal((await second).plain, 'shared');
});

test('successful lyrics cache is bounded and includes changed paths', async () => {
  let calls = 0;
  const h = await lyricsHarness(async (url) => { calls++; return response(url === 'private-signed' ? 'ok' : { plainLyrics: 'ok' }); });
  for (let i = 0; i < 101; i++) await h.api.fetchLyrics({ ...lyricTrack, id: String(i) });
  await h.api.fetchLyrics({ ...lyricTrack, id: '0' });
  assert.equal(calls, 102);
  const a = await h.api.fetchLyrics({ ...lyricTrack, lyricsPath: 'first' });
  const b = await h.api.fetchLyrics({ ...lyricTrack, lyricsPath: 'second' });
  assert.notEqual(a, b);
});

async function ytHarness(fetch) { return load('./src/services/ytApi.js', {}, { fetch }); }

test('cached YouTube searches still cancel older requests; aborted bodies never cache', async () => {
  const d = deferred();
  let slowSignal, calls = 0;
  const h = await ytHarness(async (url, { signal }) => {
    calls++;
    if (url.includes('q=slow') && calls === 2) { slowSignal = signal; return { ok: true, json: () => d.promise }; }
    return response({ items: [url] });
  });
  await h.api.searchYouTube('cached');
  const stale = assert.rejects(h.api.searchYouTube('slow'), { name: 'AbortError' });
  await flush();
  await h.api.searchYouTube('cached');
  assert.equal(slowSignal.aborted, true);
  d.resolve({ items: ['stale'] });
  await stale;
  await h.api.searchYouTube('slow');
  assert.equal(calls, 3);
});

test('YouTube suggestions cancel on short input and external abort, without caching errors', async () => {
  const signals = [];
  const h = await ytHarness((_url, { signal }) => {
    signals.push(signal);
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  });
  const old = assert.rejects(h.api.suggestYouTube('older'), { name: 'AbortError' });
  await h.api.suggestYouTube('');
  await old;
  const external = new AbortController();
  const cancelled = assert.rejects(h.api.suggestYouTube('newer', { signal: external.signal }), { name: 'AbortError' });
  external.abort();
  await cancelled;
  const timed = assert.rejects(h.api.searchYouTube('slow'), { name: 'TimeoutError' });
  await h.time.tick(12_000);
  await timed;
  assert.ok(signals.every((signal) => signal.aborted));
});

test('YouTube metadata cache has TTL and bounded capacity', async () => {
  let calls = 0;
  const h = await ytHarness(async () => { calls++; return response({ items: ['ok'], suggestions: ['ok'] }); });
  for (let i = 0; i < 101; i++) await h.api.searchYouTube(String(i));
  await h.api.searchYouTube('0');
  assert.equal(calls, 102);
  await h.api.suggestYouTube('cached');
  await h.api.suggestYouTube('cached');
  assert.equal(calls, 103);
  await h.time.tick(300_001);
  await h.api.suggestYouTube('cached');
  assert.equal(calls, 104);
});

async function musicHarness(resolve = async () => 'audio.mp3') {
  const time = clock(), instances = [], writes = [], data = new Map(), invalidated = [];
  let mediaActions, counted = 0;
  class FakeHowl {
    constructor(options) {
      this.options = options; this.position = 0; this.loaded = false; this.playCalls = 0;
      this._sounds = [{ _node: Object.assign(new EventTarget(), { readyState: 2 }) }]; instances.push(this);
    }
    state() { return this.loaded ? 'loaded' : 'loading'; }
    duration() { return 180; }
    seek(value) { if (value !== undefined) this.position = value; return this.position; }
    volume() {}
    play() { this.playCalls++; if (this.loaded) this.options.onplay(); }
    pause() { this.options.onpause(); }
    stop() {}
    unload() { this.unloaded = true; }
    ready() { this.loaded = true; this.options.onload(); this.options.onplay(); }
    native(type) { this._sounds[0]._node.dispatchEvent(new Event(type)); }
  }
  const yt = {
    pauses: 0, plays: 0, ready: false, time: 0,
    isReady() { return this.ready; }, pause() { this.pauses++; }, play() { this.plays++; },
    seek(t) { this.time = t; }, getTime() { return this.time; }, getDuration() { return 180; }, setVolume() {},
  };
  const create = (init) => {
    let state;
    const set = (patch) => { state = { ...state, ...patch }; };
    const get = () => state;
    state = init(set, get);
    return { getState: get, setState: set };
  };
  const h = await load('./src/stores/music.js', {
    zustand: { create }, howler: { Howl: FakeHowl },
    '../services/supabaseMusicApi': { resolveAudioUrl: resolve, incrementPlayCount: async () => { counted++; } },
    '../config/supabase': { getSignedUrl: resolve, invalidateSignedUrl: (...args) => invalidated.push(args), BUCKETS: { MUSIC: 'music' } },
    '../player/youtube': { ytPlayer: yt },
    '../player/spotify': { spotifyPlayer: { pause() {}, play: async () => {}, seek() {}, setVolume() {}, getTime() { return 0; }, getDuration() { return 0; } } },
    '../player/analyser': { probeCors: async () => 'none', withCorsAudio: (_c, fn) => fn(), tapHowl: () => false, markLive: () => {} },
    '../services/spotifyApi': { isSpotifyConfigured: () => false, isSpotifyConnected: () => false, getSpotifyTrackPreview: async () => null },
    '../services/ytApi': { getRelatedYouTube: async () => [], getRelatedByQuery: async () => [] },
    '../player/mediaSession': { updateMediaMetadata() {}, updateMediaPosition() {}, clearMediaSession() {}, bindMediaActions: (actions) => { mediaActions = actions; } },
    '../services/lyricsApi': { getLyricsOffset: () => 0 }, '../lib/lrc': { findActiveLine: () => -1 },
    './toast': { toast: { error() {}, info() {}, success() {} } },
  }, { localStorage: {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => { data.set(key, value); writes.push({ key, value: JSON.parse(value), at: time.now() }); },
    removeItem: (key) => data.delete(key),
  } }, time);
  return { ...h, state: h.api.useMusicStore.getState, set: h.api.useMusicStore.setState,
    instances, writes, data, invalidated, mediaActions, yt, counted: () => counted };
}
const audioTrack = { id: 'song-a', source: 'upload', title: 'A', duration: 180, audioPath: 'user/song.mp3' };

test('audio retries are bounded, refresh signed URLs and preserve position without recounting plays', async () => {
  const h = await musicHarness();
  await h.state().playTrack(audioTrack);
  h.instances[0].ready();
  h.instances[0].position = 42;
  for (let i = 0; i < 3; i++) {
    h.instances[i].options.onloaderror(null, 2);
    assert.equal(h.state().status, 'buffering');
    await h.time.tick([1000, 2000, 4000][i]);
    h.instances[i + 1].ready();
    assert.equal(h.instances[i + 1].seek(), 42);
  }
  h.instances[3].options.onloaderror(null, 2);
  await h.time.tick(60_000);
  assert.equal(h.instances.length, 4);
  assert.equal(h.state().status, 'error');
  assert.equal(h.state().isPlaying, false);
  assert.equal(h.invalidated.length, 3);
  assert.equal(h.counted(), 1);
  await h.state().togglePlay();
  h.instances[4].ready();
  assert.equal(h.instances[4].seek(), 42);
  assert.equal(h.state().status, 'playing');
});

test('pause/new track/stop cancel queued retries and stale native callbacks', async () => {
  for (const action of ['pause', 'new', 'stop']) {
    const h = await musicHarness();
    await h.state().playTrack(audioTrack);
    const old = h.instances[0];
    old.options.onloaderror(null, 2);
    if (action === 'pause') h.state().pause();
    if (action === 'new') await h.state().playTrack({ ...audioTrack, id: 'song-b' });
    if (action === 'stop') h.state().stopAndClear();
    await h.time.tick(5000);
    old.native('waiting'); old.options.onplay();
    assert.equal(h.instances.length, action === 'new' ? 2 : 1);
    assert.equal(h.state().status, action === 'new' ? 'loading' : action === 'stop' ? 'idle' : 'paused');
  }
});

test('pause during URL resolution cancels autoplay and retains explicit resume position', async () => {
  const d = deferred();
  const h = await musicHarness(() => d.promise);
  const pending = h.state().playTrack(audioTrack);
  h.state().seekTo(23);
  h.state().pause();
  d.resolve('signed.mp3');
  await pending;
  assert.equal(h.instances.length, 0);
  assert.equal(h.state().isPlaying, false);
  await h.state().play();
  h.instances[0].ready();
  assert.equal(h.instances[0].seek(), 23);
});

test('audio uses native buffering events and times out stalled loads without leaking listeners', async () => {
  const h = await musicHarness();
  await h.state().playTrack(audioTrack);
  const old = h.instances[0];
  old.ready(); old.position = 12;
  old.native('waiting');
  assert.equal(h.state().status, 'buffering');
  old.native('playing');
  assert.equal(h.state().status, 'playing');
  old.native('stalled');
  await h.time.tick(21_000);
  assert.equal(h.instances.length, 2);
  old.native('playing');
  assert.equal(h.state().status, 'buffering');
  h.instances[1].ready();
  assert.equal(h.state().currentTime, 12);
  assert.equal(h.instances[1].options.html5, true);
  assert.equal(h.instances[1].options.onwaiting, undefined);
});

test('autoplay errors do not retry automatically and explicit play reuses the loaded node', async () => {
  const h = await musicHarness();
  await h.state().playTrack(audioTrack);
  h.instances[0].loaded = true;
  h.instances[0].options.onplayerror(null, 'NotAllowedError');
  await h.time.tick(60_000);
  assert.equal(h.instances.length, 1);
  assert.equal(h.state().status, 'error');
  h.state().togglePlay();
  assert.equal(h.instances[0].playCalls, 2);
  assert.equal(h.state().status, 'playing');
});

test('decode failures are terminal; ambiguous signed URL failures get only one renewal', async () => {
  const h = await musicHarness();
  await h.state().playTrack(audioTrack);
  h.instances[0].options.onloaderror(null, 3);
  await h.time.tick(8000);
  assert.equal(h.instances.length, 1);
  await h.state().play();
  h.instances[1].options.onloaderror(null, 4);
  await h.time.tick(1000);
  h.instances[2].options.onloaderror(null, 4);
  await h.time.tick(8000);
  assert.equal(h.instances.length, 3);
  assert.equal(h.state().status, 'error');
});

test('session writes are at most every five seconds, unchanged polling is silent, stop clears trailing writes', async () => {
  const h = await musicHarness();
  await h.state().playTrack(audioTrack);
  h.instances[0].ready();
  await h.time.tick(10_000);
  assert.equal(h.writes.filter((w) => w.key === 'kv-session').length, 1);
  for (let i = 0; i < 48; i++) {
    h.instances[0].position = i / 4;
    await h.time.tick(250);
  }
  h.state().pause();
  await h.time.tick(5000);
  const writes = h.writes.filter((w) => w.key === 'kv-session');
  for (let i = 1; i < writes.length; i++) assert.ok(writes[i].at - writes[i - 1].at >= 5000);
  assert.equal(writes.at(-1).value.currentTime, 47 / 4);
  h.state().seekTo(50); h.state()._persistSession(); h.state().stopAndClear();
  await h.time.tick(5000);
  assert.equal(h.data.has('kv-session'), false);
});

test('MediaSession play is play-only; queue, repeat-one, shuffle and YT seek contracts survive', async () => {
  const h = await musicHarness();
  const b = { ...audioTrack, id: 'song-b' };
  await h.state().playTrack(audioTrack, [audioTrack, b]);
  h.instances[0].ready();
  h.mediaActions.play();
  assert.equal(h.state().isPlaying, true);
  assert.equal(h.instances[0].playCalls, 1);
  h.set({ repeat: 'one' });
  h.instances[0].options.onend();
  assert.equal(h.state().currentTrack.id, audioTrack.id);
  h.set({ repeat: 'off' });
  h.state().addToQueue(b); h.state().nextTrack(); await flush();
  assert.equal(h.state().currentTrack.id, b.id);
  assert.equal(h.state().queue.length, 0);
  h.set({ shuffle: true }); h.state().nextTrack(); await flush();
  assert.equal(h.state().currentTrack.id, audioTrack.id);
  const yt = { id: 'yt:abc', source: 'youtube', videoId: 'abc' };
  await h.state().playTrack(yt);
  h.state().seekTo(99); h.state().pause(); h.state().play();
  await h.state().playTrack({ ...yt, id: 'yt:def', videoId: 'def' });
  h.state().ytHooks.onPlaying();
  assert.equal(h.yt.time, 0);
  const nonce = h.state().ytLoadNonce;
  h.state().ytHooks.onError('API_LOAD');
  h.state().togglePlay();
  assert.equal(h.state().ytLoadNonce, nonce + 1);
});

async function playerHarness() {
  const players = [], scripts = [], errors = [];
  const window = { location: { origin: 'https://offline.invalid' } };
  const document = {
    createElement: () => ({ remove() { this.removed = true; } }),
    head: { appendChild: (tag) => scripts.push(tag) },
  };
  const h = await load('./src/player/youtube.js', {}, { window, document });
  const install = () => {
    window.YT = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3 },
      Player: class {
        constructor(_id, options) { this.options = options; this.id = options.videoId; this.loads = []; this.cues = []; this.plays = 0; players.push(this); }
        setVolume() {} playVideo() { this.plays++; } pauseVideo() { this.paused = true; }
        loadVideoById(id) { this.id = id; this.loads.push(id); }
        cueVideoById(id) { this.id = id; this.cues.push(id); }
        getVideoData() { return { video_id: this.id }; } getDuration() { return 180; }
        destroy() { this.destroyed = true; }
      },
    };
    window.onYouTubeIframeAPIReady?.();
  };
  return { ...h, window, scripts, players, install, errors, hooks: { onError: (code) => errors.push(code) } };
}

test('YouTube API loading times out, reports retryable failure and supports explicit retry', async () => {
  const h = await playerHarness();
  const first = h.api.ytPlayer.mount('frame', 'a', h.hooks);
  await h.time.tick(15_000); await first;
  assert.deepEqual(h.errors, ['API_LOAD']);
  assert.equal(h.scripts[0].removed, true);
  const second = h.api.ytPlayer.mount('frame', 'a', h.hooks);
  h.install(); await second;
  assert.equal(h.players.length, 1);
});

test('YouTube pending mounts respect pause/destroy and latest video; obsolete events are ignored', async () => {
  const h = await playerHarness();
  const old = h.api.ytPlayer.mount('frame', 'a', h.hooks);
  const latest = h.api.ytPlayer.mount('frame', 'b', h.hooks);
  h.api.ytPlayer.pause();
  h.install(); await Promise.all([old, latest]);
  const player = h.players[0];
  player.options.events.onReady({ target: player });
  assert.deepEqual(player.cues, ['b']);
  assert.equal(player.loads.length, 0);
  h.api.ytPlayer.play(); assert.equal(player.plays, 1);
  h.api.ytPlayer.destroy();
  player.options.events.onError({ target: player, data: 100 });
  assert.equal(h.errors.length, 0);
  const h2 = await playerHarness();
  const pending = h2.api.ytPlayer.mount('frame', 'a', h2.hooks);
  h2.api.ytPlayer.destroy(); h2.install(); await pending;
  assert.equal(h2.players.length, 0);
});
