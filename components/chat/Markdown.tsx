import { Fragment, type ReactNode } from 'react';

/**
 * A deliberately small markdown renderer for assistant replies.
 *
 * Models reach for fenced code, bold, inline code, headings and lists, and very
 * little else in a chat panel. Handling exactly that costs a few hundred bytes
 * and keeps the output styled like the rest of the site, where a full markdown
 * pipeline would ship a parser and a stylesheet we would then have to override.
 *
 * Written to tolerate partial input: text arrives token by token, so an unclosed
 * fence or a dangling asterisk must render as something reasonable.
 */

type Block =
  | { kind: 'code'; language: string; content: string }
  | { kind: 'heading'; content: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; content: string };

const FENCE = /^```([\w+-]*)\s*$/;
const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  /* Reversed so the next line is a pop, which keeps every read checked. */
  const pending = source.replace(/\r\n/g, '\n').split('\n').reverse();
  const peek = () => pending.at(-1);

  while (pending.length > 0) {
    const line = pending.pop() as string;

    const fence = FENCE.exec(line);
    if (fence) {
      const body: string[] = [];
      // An unterminated fence still renders, so a streaming block looks right.
      while (pending.length > 0 && !/^```\s*$/.test(peek() ?? '')) {
        body.push(pending.pop() as string);
      }
      pending.pop();
      blocks.push({ kind: 'code', language: fence[1] ?? '', content: body.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: 'heading', content: heading[1] ?? '' });
      continue;
    }

    const first = BULLET.exec(line) ?? NUMBERED.exec(line);
    if (first) {
      const ordered = BULLET.exec(line) === null;
      const items = [first[1] ?? ''];
      for (;;) {
        const next = peek();
        if (next === undefined) break;
        const match = ordered ? NUMBERED.exec(next) : BULLET.exec(next);
        if (!match) break;
        items.push(match[1] ?? '');
        pending.pop();
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    if (line.trim() === '') continue;

    // Gather consecutive non-blank lines that do not open another block.
    const paragraph = [line];
    for (;;) {
      const next = peek();
      if (
        next === undefined ||
        next.trim() === '' ||
        FENCE.test(next) ||
        HEADING.test(next) ||
        BULLET.test(next) ||
        NUMBERED.test(next)
      ) {
        break;
      }
      paragraph.push(pending.pop() as string);
    }
    blocks.push({ kind: 'paragraph', content: paragraph.join('\n') });
  }

  return blocks;
}

/** Bold and inline code, applied in one pass so neither can swallow the other. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*/g;

  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) out.push(text.slice(cursor, match.index));

    const code = match[1];
    if (code !== undefined) {
      out.push(
        <code
          key={key++}
          className="border-line bg-panel-2 text-cyan rounded border px-1 py-0.5 font-mono text-[12.5px]"
        >
          {code}
        </code>,
      );
    } else {
      out.push(
        <strong key={key++} className="text-text font-semibold">
          {match[2]}
        </strong>,
      );
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, index) => {
        if (block.kind === 'code') {
          return (
            <pre
              key={index}
              className="border-line bg-void overflow-x-auto rounded-md border px-3 py-2.5"
            >
              <code className="text-text-soft font-mono text-[12.5px] leading-relaxed">
                {block.content}
              </code>
            </pre>
          );
        }

        if (block.kind === 'heading') {
          return (
            <p key={index} className="text-text mt-1 text-[14px] font-semibold tracking-[-0.01em]">
              {inline(block.content)}
            </p>
          );
        }

        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return (
            <List
              key={index}
              className={`text-text-soft flex flex-col gap-1.5 pl-5 text-[14px] leading-relaxed ${
                block.ordered ? 'list-decimal' : 'list-disc'
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="marker:text-faint">
                  {inline(item)}
                </li>
              ))}
            </List>
          );
        }

        return (
          <p key={index} className="text-text-soft text-[14px] leading-relaxed">
            {block.content.split('\n').map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
