import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
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

  const result = {
    podcasts: podcasts?.data || [],
    reports: reports?.data || [],
    articles: articles?.data || [],
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


