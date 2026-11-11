import type { APIRoute } from 'astro';
import { security, plain } from '../data/plaintext';

/** French version. The Worker answers /.well-known/security.txt with it (.gitignore leaves dot directories out). See src/data/plaintext.ts. */
export const GET: APIRoute = () => plain(security('fr'));
