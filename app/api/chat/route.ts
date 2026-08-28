import { OpenRouter, stepCountIs, type Item } from '@openrouter/agent';
import { z } from 'zod';
import { systemInstructions } from '@/lib/chat/knowledge';
import { registryTools } from '@/lib/chat/tools';

/**
 * The assistant endpoint.
 *
 * The key lives only on the server. The browser never sees it, and neither does
 * any client bundle — that is the whole reason this route exists rather than
 * calling OpenRouter from the component.
 */

export const runtime = 'nodejs';
/* Streaming, so nothing here can be cached. */
export const dynamic = 'force-dynamic';

const MODEL = 'openrouter/free';

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(6000),
      }),
    )
    .min(1)
    .max(40),
});

type ChatTurn = z.infer<typeof requestSchema>['messages'][number];

/**
 * The browser posts flat chat turns; `callModel` wants Responses-style items.
 * Assistant turns need the fuller message envelope, user turns do not.
 */
function toItems(messages: ChatTurn[]): Item[] {
  return messages.map((message, index) =>
    message.role === 'user'
      ? { role: 'user' as const, content: message.content }
      : {
          type: 'message' as const,
          id: `msg_${index}`,
          role: 'assistant' as const,
          status: 'completed' as const,
          content: [{ type: 'output_text' as const, text: message.content }],
        },
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          'The assistant is not configured. Set OPENROUTER_API_KEY in .env.local and restart the server.',
      },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const openrouter = new OpenRouter({ apiKey });

  try {
    const result = openrouter.callModel({
      model: MODEL,
      instructions: systemInstructions(),
      input: toItems(parsed.messages),
      tools: registryTools,
      // A bounded loop: enough rounds to look something up and follow it up,
      // few enough that a confused model cannot spin.
      stopWhen: [stepCountIs(8)],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const delta of result.getTextStream()) {
            controller.enqueue(encoder.encode(delta));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The model stream failed.';
          controller.enqueue(encoder.encode(`\n\n[The assistant stopped: ${message}]`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        void result.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown failure.';
    return Response.json({ error: `Could not reach the model: ${message}` }, { status: 502 });
  }
}
