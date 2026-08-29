import { Eyebrow, Section } from './Section';

/**
 * A 3D anchor with no invented product copy. The section body arrives in the
 * phase named here; the helix pose is already specified.
 */
export function BeatScaffold({
  beat,
  id,
  index,
  title,
  arrives,
}: {
  beat: number;
  id?: string;
  index: string;
  title: string;
  arrives: string;
}) {
  return (
    <Section beat={beat} beatSide="left" id={id} className="min-h-screen">
      <Eyebrow index={index}>{arrives}</Eyebrow>
      <h2 className="text-title mt-4 max-w-[560px] text-balance">{title}</h2>
      <p className="text-faint mt-4 max-w-[480px] text-[14px] leading-relaxed">
        Anchor only. The section body is specified for a later phase; writing it
        now would be a fake page.
      </p>
    </Section>
  );
}
