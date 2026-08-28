import { cn } from '@/lib/cn';
import { FITNESS_AXES, FITNESS_AXIS_META, type FitnessAxis } from '@/lib/schema/vocabulary';

export type FitnessScores = Record<FitnessAxis, number>;

export type FitnessDelta = {
  metric: string;
  before: string;
  after: string;
  change: string;
  /** Direction of the change from the adopter's point of view. */
  direction: 'better' | 'worse' | 'neutral';
};

type Props = {
  scores: FitnessScores;
  baseline?: FitnessScores;
  deltas?: readonly FitnessDelta[];
  className?: string;
};

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 78;

function pointAt(index: number, magnitude: number): [number, number] {
  const angle = (Math.PI * 2 * index) / FITNESS_AXES.length - Math.PI / 2;
  return [CENTER + Math.cos(angle) * RADIUS * magnitude, CENTER + Math.sin(angle) * RADIUS * magnitude];
}

function polygon(scores: FitnessScores): string {
  return FITNESS_AXES.map((axis, i) => pointAt(i, Math.min(1, Math.max(0, scores[axis]))).join(','))
    .join(' ');
}

const DIRECTION_TONE: Record<FitnessDelta['direction'], string> = {
  better: 'text-acid',
  worse: 'text-rose',
  neutral: 'text-muted',
};

/**
 * A six-axis fitness profile. There is deliberately no aggregate score: a
 * change that cuts latency while harming accessibility is a trade-off, and
 * collapsing it into one number would hide exactly the thing a maintainer
 * needs to see.
 */
export function FitnessVector({ scores, baseline, deltas, className }: Props) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]', className)}>
      <figure className="m-0">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full max-w-[220px]"
          role="img"
          aria-label={FITNESS_AXES.map(
            (axis) => `${FITNESS_AXIS_META[axis].label} ${scores[axis].toFixed(2)}`,
          ).join(', ')}
        >
          {/* rings */}
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <polygon
              key={ring}
              points={FITNESS_AXES.map((_, i) => pointAt(i, ring).join(',')).join(' ')}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="0.8"
            />
          ))}

          {/* spokes */}
          {FITNESS_AXES.map((axis, i) => {
            const [x, y] = pointAt(i, 1);
            return (
              <line
                key={axis}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="var(--color-line)"
                strokeWidth="0.8"
              />
            );
          })}

          {baseline && (
            <polygon
              points={polygon(baseline)}
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          <polygon
            points={polygon(scores)}
            fill="rgb(99 231 255 / 0.14)"
            stroke="var(--color-cyan)"
            strokeWidth="1.6"
          />

          {FITNESS_AXES.map((axis, i) => {
            const [x, y] = pointAt(i, Math.min(1, Math.max(0, scores[axis])));
            return <circle key={axis} cx={x} cy={y} r="2.6" fill="var(--color-cyan)" />;
          })}

          {/* axis symbols */}
          {FITNESS_AXES.map((axis, i) => {
            const [x, y] = pointAt(i, 1.22);
            return (
              <text
                key={axis}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted font-mono"
                fontSize="10"
              >
                {FITNESS_AXIS_META[axis].symbol}
              </text>
            );
          })}
        </svg>
        <figcaption className="text-faint mt-2 font-mono text-nano uppercase">
          Fitness vector · no aggregate score
        </figcaption>
      </figure>

      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
          {FITNESS_AXES.map((axis) => {
            const meta = FITNESS_AXIS_META[axis];
            return (
              <div key={axis} className="border-line-soft flex justify-between gap-3 border-b pb-1.5">
                <dt className="text-muted text-[11px]" title={meta.description}>
                  <span className="text-faint font-mono">{meta.symbol}</span> {meta.label}
                </dt>
                <dd className="text-text-soft font-mono text-[11px] tabular-nums">
                  {scores[axis].toFixed(2)}
                </dd>
              </div>
            );
          })}
        </dl>

        {deltas && deltas.length > 0 && (
          <div>
            <h4 className="text-muted mb-2 font-mono text-nano uppercase">Measured change</h4>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="text-faint border-line border-b font-mono text-nano uppercase">
                  <th scope="col" className="py-1.5 text-left font-semibold">
                    Metric
                  </th>
                  <th scope="col" className="py-1.5 text-right font-semibold">
                    Before
                  </th>
                  <th scope="col" className="py-1.5 text-right font-semibold">
                    After
                  </th>
                  <th scope="col" className="py-1.5 text-right font-semibold">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {deltas.map((delta) => (
                  <tr key={delta.metric} className="border-line-soft border-b">
                    <th scope="row" className="text-text-soft py-1.5 text-left font-normal">
                      {delta.metric}
                    </th>
                    <td className="text-muted py-1.5 text-right font-mono tabular-nums">
                      {delta.before}
                    </td>
                    <td className="text-text-soft py-1.5 text-right font-mono tabular-nums">
                      {delta.after}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 text-right font-mono tabular-nums',
                        DIRECTION_TONE[delta.direction],
                      )}
                    >
                      {delta.change}
                      {delta.direction !== 'neutral' && (
                        <span className="ml-1.5 text-nano uppercase">{delta.direction}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
