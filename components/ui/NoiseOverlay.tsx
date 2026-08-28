const NOISE_SVG = `<svg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.6'/></svg>`;

/** Film-grain wash carried over from the original prototype. Keeps the very
 *  dark surfaces from banding on cheap panels. */
export function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-99 opacity-[0.035]"
      style={{ backgroundImage: `url("data:image/svg+xml,${NOISE_SVG}")` }}
    />
  );
}
