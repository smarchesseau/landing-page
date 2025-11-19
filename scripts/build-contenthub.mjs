import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outFile = resolve(repoRoot, './assets/contenthub.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchTop() {
  const [podcasts, reports, articles] = await Promise.all([
    supabase
      .from('podcasts')
      .select('id, title, title_multilingual, summary, summary_multilingual, link, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('scientific_reports')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('generated_articles')
      .select('id, title, summary, created_at, status')
      .in('status', ['reviewed', 'published'])
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  // Build image mapping from assets/articles/ by fuzzy title match
  const imagesDir = resolve(repoRoot, './assets/articles');
  let imageFiles = [];
  try {
    imageFiles = readdirSync(imagesDir)
      .filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));
  } catch {
    imageFiles = [];
  }

  const usedImages = new Set();
  const imagePath = (f) => `assets/articles/${f}`;

  // Ordered fallback list (only one-time use, in order)
  const fallbackList = [
    'WorkLife.PNG',
    'Market.png',
    'woman-white-laboratory-robe-examines-salad-cabbage-greenhouse-using-tablet.jpg',
    'smart-farming-with-agriculture-iot.jpg',
    'image-with-field-windmill-agricultural-concept.jpg'
  ].filter(f => imageFiles.includes(f)); // keep only existing

  const normalize = (s) => {
    if (!s) return '';
    try {
      return s
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
        .toLowerCase()
        .replace(/[\s_]+/g, ' ')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch {
      return s.toString().toLowerCase();
    }
  };

  const tokenize = (s) => normalize(s).split(' ').filter(Boolean);

  const pickTitleString = (t) => {
    if (!t) return '';
    if (typeof t === 'string') return t;
    return t.en || t.fr || t.es || Object.values(t)[0] || '';
  };

  const scoreMatch = (titleTokens, fileTokens) => {
    if (fileTokens.length === 0 || titleTokens.length === 0) return 0;
    const titleSet = new Set(titleTokens);
    let hits = 0;
    for (const tok of fileTokens) {
      if (tok.length <= 2) continue; // ignore tiny tokens
      if (titleSet.has(tok)) hits += 2;
      // partial: token contained in any title token
      else if ([...titleSet].some(t => t.includes(tok) || tok.includes(t))) hits += 1;
    }
    return hits;
  };

  const bestImageForTitle = (title) => {
    if (!imageFiles.length) return null;
    const titleTokens = tokenize(title);
    let best = null;
    let bestScore = 0;
    for (const file of imageFiles) {
      if (usedImages.has(file)) continue; // avoid duplicates
      const base = file.replace(/\.[^.]+$/, '');
      const fileTokens = tokenize(base);
      const sc = scoreMatch(titleTokens, fileTokens);
      if (sc > bestScore) {
        bestScore = sc;
        best = file;
      }
    }
    // Require minimal score to avoid mismatches
    if (best && bestScore >= 2) {
      usedImages.add(best);
      return imagePath(best);
    }
    return null;
  };

  const nextFallbackImage = () => {
    for (const f of fallbackList) {
      if (!usedImages.has(f)) {
        usedImages.add(f);
        return imagePath(f);
      }
    }
    return null;
  };

  const enrichedReports = (reports?.data || []).map(r => {
    const t = pickTitleString(r.title);
    const chosen = bestImageForTitle(t) || nextFallbackImage();
    return { ...r, image: chosen };
  });
  const enrichedArticles = (articles?.data || []).map(a => {
    const t = pickTitleString(a.title);
    const chosen = bestImageForTitle(t) || nextFallbackImage();
    return { ...a, image: chosen };
  });

  const result = {
    podcasts: podcasts?.data || [],
    reports: enrichedReports,
    articles: enrichedArticles,
    generated_at: new Date().toISOString(),
  };
  return result;
}

try {
  const data = await fetchTop();
  mkdirSync(resolve(repoRoot, './assets'), { recursive: true });
  writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${outFile}`);
} catch (e) {
  console.error('Failed to build contenthub.json', e);
  process.exit(1);
}


