import type { APIRoute } from 'astro';
import { security, plain } from '../../data/plaintext';

/** English version, picked by the Worker from Accept-Language. See src/data/plaintext.ts. */
export const GET: APIRoute = () => plain(security('en'));
