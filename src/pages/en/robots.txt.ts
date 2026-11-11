import type { APIRoute } from 'astro';
import { robots, plain } from '../../data/plaintext';

/** English version, picked by the Worker from Accept-Language. See src/data/plaintext.ts. */
export const GET: APIRoute = () => plain(robots('en'));
