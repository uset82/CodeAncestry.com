'use client';

import { useId, useState } from 'react';
import { zipStore } from '@/lib/export/zip';
import type { DataPackage } from '@/lib/registry/pack';

/**
 * NCBI-style data package download.
 *
 * One archive, named files, a README that says what each file is. Individual
 * files can also be saved on their own — a reader who only wants `genome.json`
 * should not have to unzip anything.
 */

export function ExportPanel({ pack }: { pack: DataPackage }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const readmeId = useId();
  const readme = pack.files.find((file) => file.path === 'README.txt');

  const handlePackage = () => {
    setBusy(true);
    try {
      const bytes = zipStore(pack.files.map((file) => ({ path: file.path, body: file.body })));
      save(bytes, pack.filename, 'application/zip');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (path: string, body: string) => {
    const type = path.endsWith('.json')
      ? 'application/json'
      : path.endsWith('.jsonl')
        ? 'application/jsonl'
        : 'text/plain';
    save(new TextEncoder().encode(body), path.replaceAll('/', '-'), type);
  };

  return (
    <div className="border-line bg-panel rounded-lg border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[64ch]">
          <p className="text-[15px] font-semibold tracking-tight">
            {pack.name} data package
          </p>
          <p className="text-muted mt-1.5 text-[13.5px] leading-relaxed">
            {pack.files.length} files: the genome manifest, the genes it carries, the mutations that
            touched it, evidence, attestations, reconstructed phenotypes, and a PROV graph. Git
            remains the source of truth for the code.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePackage}
          disabled={busy}
          className="border-line-strong hover:border-acid/50 hover:text-acid shrink-0 rounded-md border px-4 py-2 font-mono text-nano uppercase transition-colors disabled:opacity-60"
        >
          {busy ? 'Preparing…' : `Download ${pack.filename}`}
        </button>
      </div>

      <ul className="border-line mt-5 divide-y divide-[var(--color-line)] rounded-md border">
        {pack.files.map((file) => (
          <li key={file.path} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2">
            <div className="min-w-0">
              <p className="text-text-soft font-mono text-[12.5px]">{file.path}</p>
              <p className="text-faint text-[12.5px] leading-relaxed">{file.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleFile(file.path, file.body)}
              aria-label={`Save ${file.path}`}
              className="text-faint hover:text-acid shrink-0 font-mono text-nano uppercase transition-colors"
            >
              Save
            </button>
          </li>
        ))}
      </ul>

      {readme && (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={readmeId}
            onClick={() => setOpen((current) => !current)}
            className="text-faint hover:text-text-soft font-mono text-nano uppercase transition-colors"
          >
            {open ? 'Hide README' : 'Preview README'}
          </button>
          {open && (
            <pre
              id={readmeId}
              className="border-line bg-void text-text-soft mt-3 max-h-[28rem] overflow-auto rounded-md border p-4 font-mono text-[11.5px] leading-relaxed"
            >
              {readme.body}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function save(bytes: Uint8Array, filename: string, type: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
