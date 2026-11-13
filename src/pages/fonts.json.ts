import type { APIRoute } from 'astro';
import sans from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import mono from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';

/**
 * Where the build put the two fonts of the site. The statistics dashboard is
 * rendered by the Worker, outside Astro, and cannot guess their hashed names
 * (worker/admin.js).
 */
export const GET: APIRoute = () => new Response(JSON.stringify({ sans, mono }) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
