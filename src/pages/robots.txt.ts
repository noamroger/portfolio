import type { APIRoute } from 'astro';
import { robots, plain } from '../data/plaintext';

/** French version, served at the usual address. See src/data/plaintext.ts. */
export const GET: APIRoute = () => plain(robots('fr'));
