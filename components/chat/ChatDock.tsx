'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Markdown } from '@/components/chat/Markdown';
import { cn } from '@/lib/cn';

/**
 * The site assistant.
 *
 * A docked panel rather than a modal: a visitor can keep reading the CodeTree
 * while asking about it. Answers stream in, and the transcript is a live region
 * so a screen reader hears the reply without having to hunt for it.
 */

type Turn = { role: 'user' | 'assistant'; content: string };

const OPENERS = [
  'What is CodeAncestry & Code DNA?',
  'How is semantic lineage different from Git?',
  'How does Agent DNA track AI code authoring?',
  'Explore the KEYLIT demo family lineage',
];

export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Follow the newest text while a reply streams in.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      setError(null);
      setDraft('');
      setBusy(true);

      const history: Turn[] = [...turns, { role: 'user', content: question }];
      setTurns([...history, { role: 'assistant', content: '' }]);

      const controller = new AbortController();
      abort.current = controller;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? `The assistant returned ${response.status}.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setTurns([...history, { role: 'assistant', content: answer }]);
        }

        if (answer.trim() === '') {
          setTurns([
            ...history,
            { role: 'assistant', content: 'The model returned nothing. Try asking again.' },
          ]);
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          setTurns(history);
        } else {
          setTurns(history);
          setError(caught instanceof Error ? caught.message : 'Something went wrong.');
        }
      } finally {
        setBusy(false);
        abort.current = null;
      }
    },
    [busy, turns],
  );

  const stop = () => abort.current?.abort();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          // Focus the field on open, once the panel has mounted.
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          /* A tab clipped to the corner of the sheet, not a floating bubble. */
          'fixed right-4 bottom-4 z-90 flex items-center gap-2.5 border px-4 py-3 transition-all sm:right-6 sm:bottom-6',
          open
            ? 'border-ink bg-paper-2 text-ink shadow-[2px_2px_0_0_var(--color-rule-strong)]'
            : 'border-ink bg-ink text-paper shadow-[3px_3px_0_0_var(--color-rule-strong)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_var(--color-rule-strong)]',
        )}
      >
        <span aria-hidden="true" className="font-mono text-[13px]">
          {open ? '✕' : '⌘'}
        </span>
        <span className="font-mono text-nano uppercase">{open ? 'Close' : 'Ask anything'}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="CodeAncestry assistant"
          className={cn(
            'border-line bg-paper fixed z-90 flex flex-col rounded-xl border shadow-2xl',
            'inset-x-3 bottom-20 max-h-[min(640px,78vh)]',
            'sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[420px]',
          )}
        >
          <header className="border-line flex items-start justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="text-[14.5px] leading-tight font-semibold tracking-[-0.02em]">
                CodeAncestry assistant
              </p>
              <p className="text-faint mt-0.5 font-mono text-nano uppercase">
                openrouter/free · reads the live registry
              </p>
            </div>
            {turns.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  stop();
                  setTurns([]);
                  setError(null);
                }}
                className="text-faint hover:text-text font-mono text-nano uppercase"
              >
                Clear
              </button>
            )}
          </header>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {turns.length === 0 ? (
              <div>
                <p className="text-text-soft text-[14px] leading-relaxed">
                  Ask about software lineage, or about anything else. The assistant can query this
                  site&apos;s registry directly, so it answers with real accessions rather than
                  guesses.
                </p>
                <ul className="mt-4 flex flex-col gap-1.5">
                  {OPENERS.map((opener) => (
                    <li key={opener}>
                      <button
                        type="button"
                        onClick={() => void send(opener)}
                        className="border-line bg-panel hover:border-line-strong hover:bg-panel-2 w-full rounded-md border px-3 py-2 text-left text-[13.5px] transition-colors"
                      >
                        {opener}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ol className="flex flex-col gap-4">
                {turns.map((turn, i) => (
                  <li key={i}>
                    <p
                      className={cn(
                        'font-mono text-nano uppercase',
                        turn.role === 'user' ? 'text-cyan' : 'text-acid',
                      )}
                    >
                      {turn.role === 'user' ? 'You' : 'Assistant'}
                    </p>
                    {turn.content ? (
                      <div className="mt-1.5">
                        {turn.role === 'assistant' ? (
                          <Markdown source={turn.content} />
                        ) : (
                          <p className="text-text-soft text-[14px] leading-relaxed whitespace-pre-wrap">
                            {turn.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-faint mt-1.5 text-[14px]">
                        <span className="animate-pulse">Thinking…</span>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {error && (
              <p className="border-rose/40 bg-rose/10 text-rose mt-4 rounded-md border px-3 py-2 text-[13px]">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
            className="border-line border-t px-4 py-3"
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">
              Ask the CodeAncestry assistant
            </label>
            <textarea
              id={`${panelId}-input`}
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              rows={2}
              placeholder="Ask anything…"
              className="border-line bg-panel-2 text-text placeholder:text-faint focus:border-acid/50 w-full resize-none rounded-md border px-3 py-2 text-[14px] outline-none"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-faint text-[11.5px]">
                Enter to send, Shift+Enter for a new line.
              </p>
              {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  className="border-amber/40 bg-amber/10 text-amber rounded-md border px-3 py-1.5 font-mono text-nano uppercase"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={draft.trim() === ''}
                  className="border-acid/40 bg-acid/12 text-acid enabled:hover:bg-acid/20 rounded-md border px-3 py-1.5 font-mono text-nano uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
