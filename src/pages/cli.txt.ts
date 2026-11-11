import type { APIRoute } from 'astro';
import { cliPage } from '../data/cli';

/** The French home page for command-line clients: see src/data/cli.ts. */
export const GET: APIRoute = () => new Response(cliPage('fr'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
