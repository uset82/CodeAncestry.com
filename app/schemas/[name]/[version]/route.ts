import { NextResponse } from 'next/server';
import { getJsonSchema } from '@/lib/docs/json-schema';

/**
 * Serves the live JSON Schema documents that fixture `$schema` URLs point at.
 * Example: `/schemas/genome/v0.1.json`.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string; version: string }> },
) {
  const { name, version } = await context.params;
  const document = getJsonSchema(name);
  const expected = document ? `v${document.version}.json` : null;

  if (!document || version !== expected) {
    return NextResponse.json({ error: 'Unknown schema' }, { status: 404 });
  }

  return NextResponse.json(document.schema, {
    headers: {
      'Content-Type': 'application/schema+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
