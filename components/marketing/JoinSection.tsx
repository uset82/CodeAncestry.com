import { FinalSequence } from '@/components/viz/close/FinalSequence';
import { CloseCtas } from '@/components/viz/close/CloseCtas';
import { Eyebrow, Section } from './Section';
import { WaitlistForm } from './Waitlist';

/**
 * Homepage 17 — the close. Beat 11, same zoomOut as origin.
 * The helix is the whole network, calm. This strand is the argument.
 */

export function JoinSection() {
  return (
    <Section id="join" beat={11} beatSide="left" className="min-h-screen">
      <div className="max-w-[640px]">
        <Eyebrow index="17">Close</Eyebrow>
        <p className="text-text-soft mt-6 leading-relaxed">
          The specimen on this beat is the whole family, pulled back. The alpha is the first real
          repository — proposed genes, stated evidence, nothing published without you.
        </p>
      </div>

      <FinalSequence className="relative mt-8 max-w-[640px] list-none pl-6" />

      <h2 id="close-thesis" className="text-headline mt-8 max-w-[640px] text-balance">
        Every machine
        <br />
        <span className="text-emphasis">has ancestors.</span>
      </h2>

      <p className="text-muted mt-5 max-w-[560px] font-mono text-nano uppercase">
        The alpha is an invite to connect a repository. Not a login.
      </p>

      <CloseCtas className="mt-6 flex flex-wrap items-center gap-3" />

      <div id="waitlist" className="mt-12 max-w-[560px] scroll-mt-28">
        <WaitlistForm />
      </div>

      <div className="border-line/60 mt-10 max-w-[560px] border-t pt-6">
        <p className="text-muted font-mono text-nano uppercase">What the alpha will not do</p>
        <ul className="text-muted mt-3 space-y-1.5 text-[13.5px]">
          <li>Write to your repository, open pull requests, or push commits.</li>
          <li>Publish anything about a private project without explicit consent.</li>
          <li>Store agent reasoning traces or prompt contents.</li>
          <li>Adopt a change into any project on its own.</li>
        </ul>
      </div>

      <p className="text-muted mt-16 max-w-[560px] font-mono text-nano uppercase">
        Git tracks code. CodeAncestry tracks evolution.
      </p>
    </Section>
  );
}
