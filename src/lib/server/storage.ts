import { createClient } from '@vercel/kv';
import 'server-only';

export const kv =
  process.env.KV2_KV_REST_API_URL && process.env.KV2_KV_REST_API_TOKEN
    ? createClient({
        url: process.env.KV2_KV_REST_API_URL,
        token: process.env.KV2_KV_REST_API_TOKEN,
      })
    : null;
