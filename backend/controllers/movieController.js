import Movie from '../models/Movie.js';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// ─────────────────────────────────────────────────────────────
// CONTENT FILTER
// ─────────────────────────────────────────────────────────────

// Specific movie IDs to always block
const BLOCKED_IDS = new Set([
  1416148,  // I Want Your Sex
  16377,    // Country Hooker
  522931,   // Pleasure
  614917,   // Cuties
  637693,   // Swinging Safari
  181533,   // Basic Instinct 2
  809,      // Basic Instinct
  11232,    // Caligula
]);

// Title keywords — exact word match to avoid false positives
// e.g. 'adult' would block "Young Adult" so we use exact words
const BLOCKED_TITLE_WORDS = [
  'porn', 'porno', 'pornography', 'xxx',
  'hooker', 'prostitute',
  'erotic', 'erotica',
  'playboy', 'penthouse',
  'nymphomaniac',
];

// Partial match keywords (always inappropriate regardless of context)
const BLOCKED_PARTIAL = ['sex tape', 'sex scene', 'dirty whore'];

const isBlocked = (m) => {
  if (!m) return true;
  const id = Number(m.id || m._id);
  if (BLOCKED_IDS.has(id)) return true;
  if (m.adult === true) return true;

  const title = (m.title || m.name || '').toLowerCase();
  const titleWords = title.split(/\s+/);

  // Exact word match
  if (BLOCKED_TITLE_WORDS.some(kw => titleWords.includes(kw))) return true;
  // Partial match
  if (BLOCKED_PARTIAL.some(kw => title.includes(kw))) return true;

  return false;
};

// ─────────────────────────────────────────────────────────────
// CACHE — 20 min TTL
// ─────────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 20 * 60 * 1000;

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
};
const setCache = (key, data) => cache.set(key, { data, ts: Date.now() });

// ─────────────────────────────────────────────────────────────
// TMDB HELPER — adult always off, retry on network errors
// ─────────────────────────────────────────────────────────────
const tmdb = async (path, params = {}, retries = 3) => {
  try {
    return await axios.get(`${TMDB_BASE_URL}${path}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'en-US',
        include_adult: false,
        ...params,
      },
      timeout: 10000,
    });
  } catch (error) {
    const retryCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];
    if (retries > 0 && (retryCodes.includes(error.code) || !error.response)) {
      await new Promise(r => setTimeout(r, 600));
      return tmdb(path, params, retries - 1);
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// NORMALIZE helpers
// ─────────────────────────────────────────────────────────────
const normalize = (m) => ({
  _id:          String(m.id),
  id:           m.id,
  title:        m.title || m.name,
  overview:     m.overview,
  description:  m.overview,
  poster:       m.poster_path,
  poster_path:  m.poster_path,
  backdrop:     m.backdrop_path,
  backdrop_path:m.backdrop_path,
  releaseDate:  m.release_date || m.first_air_date,
  vote_average: m.vote_average,
  genre:        m.genre_ids,
  trailerLink:  '',
});

// normalize + filter blocked in one step
const safeNormalize = (list) =>
  (list || []).filter(m => !isBlocked(m)).map(normalize);

// fetch single movie + trailer, with adult block check
const fetchWithTrailer = async (id, lang = 'en-US') => {
  const res = await tmdb(`/movie/${id}`, { append_to_response: 'videos', language: lang });
  const m = res.data;
  if (isBlocked(m)) return null;
  const trailer =
    m.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
    m.videos?.results?.find(v => v.type === 'Teaser'  && v.site === 'YouTube') ||
    m.videos?.results?.find(v => v.site === 'YouTube');
  return {
    _id:          String(m.id),
    id:           m.id,
    title:        m.title || m.name,
    overview:     m.overview,
    description:  m.overview,
    poster:       m.poster_path,
    poster_path:  m.poster_path,
    backdrop:     m.backdrop_path,
    backdrop_path:m.backdrop_path,
    releaseDate:  m.release_date,
    vote_average: m.vote_average,
    genre:        m.genres?.map(g => g.name) || [],
    trailerLink:  trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
  };
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/english
// ONLY original_language === 'en'
// ─────────────────────────────────────────────────────────────
const getEnglishMovies = async (req, res, next) => {
  const cached = getCached('english');
  if (cached) return res.json(cached);
  try {
    const calls = [];
    for (let p = 1; p <= 3; p++) {
      calls.push(
        tmdb('/discover/movie', { with_original_language: 'en', sort_by: 'popularity.desc', page: p }),
        tmdb('/movie/now_playing', { region: 'US', with_original_language: 'en', page: p }),
        tmdb('/movie/upcoming',    { region: 'US', with_original_language: 'en', page: p }),
        tmdb('/movie/top_rated',   { with_original_language: 'en', page: p }),
      );
    }
    const results = await Promise.allSettled(calls);

    const allMovies = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => safeNormalize(
        r.value.data.results.filter(m => m.original_language === 'en')
      ));

    const seen = new Set();
    const unique = allMovies.filter(m => {
      if (seen.has(m._id)) return false;
      seen.add(m._id); return true;
    });

    const chunk = Math.ceil(unique.length / 4);
    const result = {
      popular:    unique.slice(0, chunk),
      nowPlaying: unique.slice(chunk, chunk * 2),
      upcoming:   unique.slice(chunk * 2, chunk * 3),
      topRated:   unique.slice(chunk * 3),
    };
    setCache('english', result);
    res.json(result);
  } catch (error) {
    console.error('English Movies Error:', error.message);
    res.json({ popular: [], nowPlaying: [], upcoming: [], topRated: [] });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/south
// ONLY te, ta, kn, ml original language — bahut saari movies
// ─────────────────────────────────────────────────────────────
const getSouthMovies = async (req, res, next) => {
  const cached = getCached('south');
  if (cached) return res.json(cached);

  const SOUTH_LANGS = ['te', 'ta', 'kn', 'ml'];

  // ✅ Curated recent South hits (2024-2026)
  const RECENT_IDS = [
    1022453, 1235877, 1265827, 1232232, 1208735, 1263029, 1213243,
    1022796, 927342,  968051,  1138194, 900667,  1080880, 1172491,
    1120762, 1323269, 1300854, 1215153, 1186532, 1219685,
  ];

  // ✅ All-time South blockbusters
  const CLASSIC_IDS = [
    579974,  // RRR — Telugu
    587412,  // KGF Chapter 2 — Kannada
    690957,  // Pushpa: The Rise — Telugu
    934632,  // Pushpa: The Rule — Telugu
    763215,  // Adipurush — Telugu/Sanskrit (NOT Hindi)
    820060,  // KGF Chapter 1 — Kannada
    400160,  // Baahubali 2 — Telugu
    297762,  // Baahubali 1 — Telugu
    343668,  // Enthiran — Tamil
    457136,  // 2.0 — Tamil
    440472,  // Mersal — Tamil
    496086,  // Sarkar — Tamil
    525661,  // Thalapathy Vijay: Master — Tamil
    844403,  // Beast — Tamil
    882598,  // Varisu — Tamil
  ];

  try {
    const [recentRes, classicRes, discoverRes] = await Promise.all([
      Promise.allSettled(RECENT_IDS.map(id => fetchWithTrailer(id))),
      Promise.allSettled(CLASSIC_IDS.map(id => fetchWithTrailer(id))),
      // Fetch 3 pages per language = 12 calls = ~240+ movies
      Promise.allSettled(
        SOUTH_LANGS.flatMap(lang =>
          [1, 2, 3].map(p =>
            tmdb('/discover/movie', {
              with_original_language: lang,
              sort_by: 'popularity.desc',
              'vote_count.gte': 30,
              page: p,
            })
          )
        )
      ),
    ]);

    const seen = new Set();
    const dedup = (arr) => arr
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)
      .filter(m => m && !isBlocked(m))
      .filter(m => { if (seen.has(m._id)) return false; seen.add(m._id); return true; });

    const recent  = dedup(recentRes);
    const classic = dedup(classicRes);

    // Discover — strictly south lang filter
    const discoverAll = discoverRes
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => safeNormalize(
        r.value.data.results.filter(m => SOUTH_LANGS.includes(m.original_language))
      ))
      .filter(m => { if (seen.has(m._id)) return false; seen.add(m._id); return true; });

    // Split discover into popular + topRated
    const half = Math.ceil(discoverAll.length / 2);
    const popular  = discoverAll.slice(0, half);
    const topRated = discoverAll.slice(half);

    const result = { recent, classic, popular, topRated };
    setCache('south', result);
    res.json(result);
  } catch (error) {
    console.error('South Movies Error:', error.message);
    res.json({ recent: [], classic: [], popular: [], topRated: [] });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/hindi-featured
// ONLY original_language === 'hi'
// ─────────────────────────────────────────────────────────────
const getFeaturedHindiMovies = async (req, res, next) => {
  const cached = getCached('hindi-featured');
  if (cached) return res.json(cached);

  // ✅ Verified Hindi films only
  const IDS = [
    1241634,  // Saiyaara (2025)
    1213898,  // Border 2 (2026)
    1444466,  // Awarapan 2 (2026)
    1239134,  // Bhooth Bangla (2026)
    1339876,  // Mardaani 3 (2026)
    1407523,  // Tu Meri Main Tera (2025)
    1446616,  // Tu Yaa Main (2026)
    1015981,  // Jolly LLB 3 (2025)
  ];

  try {
    const results = await Promise.allSettled(IDS.map(id => fetchWithTrailer(id, 'hi-IN')));
    const movies = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)
      .filter(m => m && !isBlocked(m));
    setCache('hindi-featured', movies);
    res.json(movies);
  } catch (error) {
    console.error('Hindi Featured Error:', error.message);
    res.json([]);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/hindi
// ONLY original_language === 'hi' — bahut saari movies
// ─────────────────────────────────────────────────────────────
const getHindiMovies = async (req, res, next) => {
  const cached = getCached('hindi');
  if (cached) return res.json(cached);

  // ✅ Verified Hindi films only
  const FEATURED_IDS = [
    1241634,  // Saiyaara (2025)
    1213898,  // Border 2 (2026)
    1239134,  // Bhooth Bangla (2026)
    1339876,  // Mardaani 3 (2026)
    1407523,  // Tu Meri Main Tera (2025)
    1446616,  // Tu Yaa Main (2026)
    1257960,  // Sikandar (2025)
    1146210,  // Housefull 5 (2025)
    1015981,  // Jolly LLB 3 (2025)
    1444466,  // Awarapan 2 (2026)
  ];

  try {
    // Fetch featured with trailers
    const featuredResults = await Promise.allSettled(
      FEATURED_IDS.map(id => fetchWithTrailer(id, 'hi-IN'))
    );
    const featured = featuredResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)
      .filter(m => m && !isBlocked(m));

    const featuredIdSet = new Set(featured.map(m => m._id));

    // 5 pages × 3 sort orders = 15 calls → ~300 movies strictly Hindi
    const pageCalls = [];
    for (let p = 1; p <= 5; p++) {
      pageCalls.push(
        tmdb('/discover/movie', {
          with_original_language: 'hi',
          sort_by: 'popularity.desc',
          'vote_count.gte': 10,
          page: p,
        }),
        tmdb('/discover/movie', {
          with_original_language: 'hi',
          sort_by: 'release_date.desc',
          'vote_count.gte': 5,
          page: p,
        }),
        tmdb('/discover/movie', {
          with_original_language: 'hi',
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100,
          page: p,
        }),
      );
    }

    const pageResults = await Promise.allSettled(pageCalls);

    // Double guard: TMDB param + explicit .filter()
    const allOthers = pageResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => safeNormalize(
        (r.value?.data?.results || []).filter(m => m.original_language === 'hi')
      ));

    const seen = new Set(featuredIdSet);
    const unique = allOthers.filter(m => {
      if (seen.has(m._id)) return false;
      seen.add(m._id); return true;
    });

    const chunk = Math.max(1, Math.ceil(unique.length / 4));
    const result = {
      featured,
      popular:    unique.slice(0, chunk),
      nowPlaying: unique.slice(chunk, chunk * 2),
      upcoming:   unique.slice(chunk * 2, chunk * 3),
      topRated:   unique.slice(chunk * 3),
    };
    setCache('hindi', result);
    res.json(result);
  } catch (error) {
    console.error('Hindi Movies Error:', error.message);
    res.json({ featured: [], popular: [], nowPlaying: [], upcoming: [], topRated: [] });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/trending
// Mixed — for Home page
// ─────────────────────────────────────────────────────────────
const getTrendingMovies = async (req, res, next) => {
  const cached = getCached('trending');
  if (cached) return res.json(cached);
  try {
    const [weekRes, topRes, nowRes, upRes] = await Promise.allSettled([
      tmdb('/trending/movie/week'),
      tmdb('/movie/top_rated'),
      tmdb('/movie/now_playing', { region: 'IN' }),
      tmdb('/movie/upcoming',    { region: 'IN' }),
    ]);

    const seen = new Set();
    const dedup = (list) => safeNormalize(list).filter(m => {
      if (seen.has(m._id)) return false;
      seen.add(m._id); return true;
    });

    const result = {
      thisWeek:   dedup(weekRes.status === 'fulfilled' ? weekRes.value.data.results : []),
      topRated:   dedup(topRes.status  === 'fulfilled' ? topRes.value.data.results  : []),
      nowPlaying: dedup(nowRes.status  === 'fulfilled' ? nowRes.value.data.results  : []),
      upcoming:   dedup(upRes.status   === 'fulfilled' ? upRes.value.data.results   : []),
    };
    setCache('trending', result);
    res.json(result);
  } catch (error) {
    console.error('Trending Error:', error.message);
    res.json({ thisWeek: [], topRated: [], nowPlaying: [], upcoming: [] });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/popular
// ─────────────────────────────────────────────────────────────
const getPopularMovies = async (req, res, next) => {
  try {
    const page     = req.query.page || 1;
    const cacheKey = `popular-${page}`;
    const cached   = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await tmdb('/movie/popular', { page });
    const result   = safeNormalize(data.results);
    setCache(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Popular Error:', error.message);
    res.json([]);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/search
// ─────────────────────────────────────────────────────────────
const searchMovies = async (req, res, next) => {
  try {
    const query = req.query.query?.trim();
    if (!query) return res.json([]);

    const { data } = await tmdb('/search/movie', { query, page: 1, include_adult: false });
    const results  = safeNormalize(data.results)
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 20);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/movies/:id
// ─────────────────────────────────────────────────────────────
const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (/^[a-f\d]{24}$/i.test(id)) {
      const local = await Movie.findById(id);
      if (local) return res.json(local);
    }

    const cacheKey = `movie-${id}`;
    const cached   = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [enRes, hiRes] = await Promise.allSettled([
      tmdb(`/movie/${id}`, { append_to_response: 'videos', language: 'en-US' }),
      tmdb(`/movie/${id}`, { append_to_response: 'videos', language: 'hi-IN' }),
    ]);

    const data = enRes.status === 'fulfilled' ? enRes.value.data : hiRes.value?.data;
    if (!data) { res.status(404); throw new Error('Movie not found'); }

    const allVideos = [
      ...(enRes.status === 'fulfilled' ? enRes.value.data.videos?.results || [] : []),
      ...(hiRes.status === 'fulfilled' ? hiRes.value.data.videos?.results || [] : []),
    ];

    const clip =
      allVideos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
      allVideos.find(v => v.type === 'Teaser'  && v.site === 'YouTube') ||
      allVideos.find(v => v.site === 'YouTube');

    const movie = {
      _id:          String(data.id),
      title:        data.title,
      overview:     data.overview,
      description:  data.overview,
      poster:       data.poster_path,
      backdrop:     data.backdrop_path,
      backdrop_path:data.backdrop_path,
      releaseDate:  data.release_date,
      vote_average: data.vote_average,
      genre:        data.genres?.map(g => g.name),
      trailerLink:  clip ? `https://www.youtube.com/watch?v=${clip.key}` : '',
    };

    setCache(cacheKey, movie);
    res.json(movie);
  } catch (error) {
    next(error);
  }
};

export {
  getEnglishMovies, getSouthMovies, getFeaturedHindiMovies,
  getHindiMovies,  getTrendingMovies, getPopularMovies,
  searchMovies,    getMovieById,
};
