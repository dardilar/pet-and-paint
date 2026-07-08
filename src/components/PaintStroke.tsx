// PaintStroke.tsx — "paint-a-pet-by-numbers" reveal animation.
// Inline SVG + animated stroke-dashoffset (self-drawing line technique), CSS easing only.
// No animation libraries.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

interface PaintStrokeProps {
  /** Region colors: [head, ears, cheek patch] */
  palette?: string[];
  /** Main stroke duration in seconds */
  durationS?: number;
  showNumbers?: boolean;
  trigger?: 'scroll' | 'load';
  width?: string;
}

interface Region {
  clips: string[];
  path: string;
  w: number;
  dur: number;
  delay: number;
}

function PaintStroke({
  palette = ['#D98E4A', '#E8A0A6', '#9BB39A'],
  durationS = 2.6,
  showNumbers = true,
  trigger = 'scroll',
  width = '520px',
}: PaintStrokeProps) {
  const EASE = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)';

  // ---- Geometry (viewBox 0 0 420 360) --------------------------------------
  // Region outlines (also used as clip paths so paint stays "inside the lines")
  const HEAD_OUTLINE =
    'M 130 105 L 105 30 L 185 68 Q 210 60 235 68 L 315 30 L 290 105 ' +
    'Q 340 155 340 215 Q 340 320 210 320 Q 80 320 80 215 Q 80 155 130 105 Z';
  const EAR_L = 'M 133 96 L 117 48 L 172 80 Z';
  const EAR_R = 'M 287 96 L 303 48 L 248 80 Z';
  const CHEEK =
    'M 116 228 Q 148 202 184 226 Q 198 246 180 264 Q 146 278 120 260 Q 104 242 116 228 Z';

  // Serpentine "painting" paths — slightly wobbly rows, revealed by dashoffset
  const HEAD_PAINT =
    'M 152 86 Q 210 72 270 86 Q 322 102 332 138 Q 210 118 90 142 ' +
    'Q 74 166 88 190 Q 210 172 334 194 Q 350 218 336 242 Q 210 226 90 250 ' +
    'Q 76 272 92 294 Q 210 284 324 296';
  const EARS_PAINT =
    'M 130 90 Q 120 64 119 52 Q 140 68 160 78 ' +
    'M 290 90 Q 300 64 301 52 Q 280 68 260 78';
  const CHEEK_PAINT =
    'M 122 232 Q 150 214 178 230 Q 186 244 172 256 Q 148 266 128 254';

  // ---- Timing ---------------------------------------------------------------
  const d1 = durationS;
  const d2 = Math.max(0.6, durationS * 0.45);
  const d3 = Math.max(0.5, durationS * 0.4);
  const t0 = 0.15;
  const regions: Region[] = [
    { clips: [HEAD_OUTLINE], path: HEAD_PAINT, w: 54, dur: d1, delay: t0 },
    { clips: [EAR_L, EAR_R], path: EARS_PAINT, w: 24, dur: d2, delay: t0 + d1 + 0.25 },
    { clips: [CHEEK],        path: CHEEK_PAINT, w: 30, dur: d3, delay: t0 + d1 + 0.25 + d2 + 0.3 },
  ];

  // ---- Trigger --------------------------------------------------------------
  const [playing, setPlaying] = useState(trigger === 'load');
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (trigger !== 'scroll') return;
    const el = rootRef.current;
    if (!el || !('IntersectionObserver' in window)) { setPlaying(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setPlaying(true); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  const replay = () => {
    setPlaying(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setPlaying(true)));
  };

  // Unique ids so several instances can coexist
  const uid = useMemo(() => 'pp' + Math.random().toString(36).slice(2, 8), []);
  const fid = uid + '-rough';
  const cid = (i: number) => uid + '-clip' + i;

  const vars = (r: Region): CSSProperties =>
    ({ '--d': r.dur + 's', '--dl': r.delay + 's' }) as CSSProperties;
  const color = (i: number) => palette[i % palette.length];
  const INK = '#3b3327';
  const PAPER = '#fdfbf5';

  const css = `
.${uid}-root svg { display: block; overflow: visible; }
.${uid}-root .pp-paint { stroke-dasharray: 100; stroke-dashoffset: 100; }
.${uid}-root.playing .pp-paint { animation: ppDraw var(--d) ${EASE} var(--dl) forwards; }
.${uid}-root .pp-brush { opacity: 0; offset-rotate: 0deg; }
.${uid}-root.playing .pp-brush {
  animation: ppMove var(--d) ${EASE} var(--dl) both,
             ppShow var(--d) linear var(--dl) both;
}
@keyframes ppDraw { to { stroke-dashoffset: 0; } }
@keyframes ppMove { from { offset-distance: 0%; } to { offset-distance: 100%; } }
@keyframes ppShow { 0%, 100% { opacity: 0; } 5%, 95% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .${uid}-root .pp-paint { stroke-dashoffset: 0 !important; animation: none !important; }
  .${uid}-root .pp-brush { display: none !important; }
}`;

  return (
    <div
      ref={rootRef}
      className={uid + '-root' + (playing ? ' playing' : '')}
      onClick={replay}
      style={{ width, maxWidth: '100%', cursor: 'pointer' }}
      title="Click to replay"
    >
      <style>{css}</style>
      <svg viewBox="0 0 420 360" width="100%" role="img"
           aria-label="A numbered cat outline being painted in by a brush">
        <defs>
          <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="8" />
          </filter>
          {regions.map((r, i) => (
            <clipPath id={cid(i)} key={i}>
              {r.clips.map((d, j) => <path key={j} d={d} />)}
            </clipPath>
          ))}
        </defs>

        {/* paper */}
        <path d={HEAD_OUTLINE} fill={PAPER} />

        {/* paint-by-numbers digits (get covered as paint arrives) */}
        {showNumbers && (
          <g fontFamily="'Courier New', monospace" fontWeight="700" fill="#b6a98f" textAnchor="middle">
            <text x="252" y="190" fontSize="30">1</text>
            <text x="139" y="80" fontSize="17">2</text>
            <text x="281" y="80" fontSize="17">2</text>
            <text x="150" y="248" fontSize="20">3</text>
          </g>
        )}

        {/* paint strokes: soft wide underlay + solid core, roughened for a hand-painted edge */}
        <g filter={'url(#' + fid + ')'}>
          {regions.map((r, i) => (
            <g key={i} clipPath={'url(#' + cid(i) + ')'}>
              <path className="pp-paint" d={r.path} pathLength="100" fill="none"
                    stroke={color(i)} strokeWidth={r.w * 1.3} strokeOpacity="0.4"
                    strokeLinecap="round" strokeLinejoin="round" style={vars(r)} />
              <path className="pp-paint" d={r.path} pathLength="100" fill="none"
                    stroke={color(i)} strokeWidth={r.w * 0.85} strokeOpacity="0.95"
                    strokeLinecap="round" strokeLinejoin="round" style={vars(r)} />
            </g>
          ))}
        </g>

        {/* printed outline + face, always on top like ink */}
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d={HEAD_OUTLINE} />
          <path d={EAR_L} />
          <path d={EAR_R} />
          <path d={CHEEK} />
        </g>
        <g fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round">
          <path d="M 157 180 q 13 -14 26 0" />
          <path d="M 237 180 q 13 -14 26 0" />
          <path d="M 210 222 q 0 12 -14 16" />
          <path d="M 210 222 q 0 12 14 16" />
          <path d="M 92 218 L 34 208" strokeWidth="3.5" />
          <path d="M 94 236 L 36 238" strokeWidth="3.5" />
          <path d="M 328 218 L 386 208" strokeWidth="3.5" />
          <path d="M 326 236 L 384 238" strokeWidth="3.5" />
        </g>
        <path d="M 199 208 L 221 208 L 210 222 Z" fill={INK} />

        {/* the brush — one per region, faded in only for its own segment */}
        {regions.map((r, i) => (
          <g key={i} className="pp-brush"
             style={{ offsetPath: "path('" + r.path + "')", ...vars(r) }}>
            <g transform="rotate(26)">
              <path d="M 0 3 C -8 -5 -11 -16 -10 -27 L 10 -27 C 11 -16 8 -5 0 3 Z" fill="#4a3a2b" />
              <path d="M 0 3 C -6 -3 -8 -9 -8.5 -14 L 8.5 -14 C 8 -9 6 -3 0 3 Z" fill={color(i)} />
              <rect x="-10.5" y="-45" width="21" height="19" rx="3" fill="#a7adb6" />
              <rect x="-10.5" y="-31" width="21" height="3" fill="#8c929c" />
              <rect x="-7" y="-128" width="14" height="85" rx="7" fill="#c79a63" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default PaintStroke;
