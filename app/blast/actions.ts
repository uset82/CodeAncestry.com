'use server';

import { codeBlast, type BlastHit } from '@/lib/registry/search';

/**
 * The fingerprint comparison runs on the server so the entire gene corpus never
 * ships to the browser. Today it reads fixtures; when the engine exists this
 * becomes a call to the similarity service and nothing in the UI changes.
 */
export async function runCodeBlast(snippet: string): Promise<BlastHit[]> {
  if (snippet.trim().length === 0) return [];
  return codeBlast(snippet, 6);
}
