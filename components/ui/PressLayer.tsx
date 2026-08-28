/**
 * The press layer.
 *
 * Three fixed, non-interactive overlays that make the viewport behave like a
 * sheet coming off a press rather than a document in a browser:
 *
 *   1. paper grain   — fibre in the stock, multiplied into the ground
 *   2. margin rules  — the trim edges of the content column
 *   3. registration marks — printer's crosses at the four corners
 *
 * All of it is decorative and hidden from assistive technology. None of it
 * paints inside .instrument surfaces, which supply their own ground.
 */

const GRAIN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>`;

/** The classic four-arm cross-in-circle used to align colour plates. */
function RegistrationMark({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`text-ink-faint absolute size-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 0v8.5M12 15.5V24M0 12h8.5M15.5 12H24" />
    </svg>
  );
}

export function PressLayer() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-99">
      {/* 1 — fibre in the stock */}
      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,${GRAIN}")`, backgroundSize: '180px' }}
      />

      {/* 2 — the trim edges of the column, matching .shell-wide */}
      <div className="border-ink/8 absolute inset-y-0 left-1/2 w-[min(1440px,calc(100%-48px))] -translate-x-1/2 border-x" />

      {/* 3 — plate alignment */}
      <RegistrationMark className="top-3 left-3" />
      <RegistrationMark className="top-3 right-3" />
      <RegistrationMark className="bottom-3 left-3" />
      <RegistrationMark className="right-3 bottom-3" />
    </div>
  );
}
