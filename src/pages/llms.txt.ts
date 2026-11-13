import type { APIRoute } from 'astro';
import { llms } from '../data/llms';
import { plain } from '../data/plaintext';

export const GET: APIRoute = () => plain(llms('fr'));
