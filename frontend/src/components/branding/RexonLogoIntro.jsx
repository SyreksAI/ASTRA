import { useEffect, useState } from 'react';
import './RexonLogoIntro.scss';

/**
 * Splash / loader: orbit draws → ball → ELARA letters → teal on ball + X stroke.
 */
export default function RexonLogoIntro({ className = '', replayKey = 0, onComplete }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(false);
    const t = window.setTimeout(() => {
      setDone(true);
      onComplete?.();
    }, 1900);
    return () => window.clearTimeout(t);
  }, [replayKey, onComplete]);

  return (
    <div
      className={`rexon-logo-intro ${className} ${done ? 'rexon-logo-intro--done' : ''}`}
      role="img"
      aria-label="Elara"
    >
      <svg viewBox="0 0 720 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="160" fill="#000000" />
        <g transform="translate(52 80)">
          <ellipse
            className="rexon-logo-intro__ring"
            cx="0"
            cy="0"
            rx="50"
            ry="21"
            stroke="#FFFFFF"
            strokeWidth="5.5"
            transform="rotate(-28)"
          />
          <circle className="rexon-logo-intro__ball" cx="33" cy="-27" r="8.5" fill="#C5C5C5" />
        </g>
        <text
          className="rexon-logo-intro__letter rexon-logo-intro__letter--r"
          x="138"
          y="102"
          fontFamily="Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="68"
          fontWeight="700"
          letterSpacing="3"
          fill="#C5C5C5"
        >
          R
        </text>
        <text
          className="rexon-logo-intro__letter rexon-logo-intro__letter--e"
          x="198"
          y="102"
          fontFamily="Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="68"
          fontWeight="700"
          letterSpacing="3"
          fill="#C5C5C5"
        >
          E
        </text>
        <g className="rexon-logo-intro__letter rexon-logo-intro__letter--x" transform="translate(262 102)">
          <path
            className="rexon-logo-intro__x-teal"
            d="M-2 -32 L34 32"
            stroke="#C5C5C5"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            className="rexon-logo-intro__x-white"
            d="M-2 32 L34 -32"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </g>
        <text
          className="rexon-logo-intro__letter rexon-logo-intro__letter--o"
          x="312"
          y="102"
          fontFamily="Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="68"
          fontWeight="700"
          letterSpacing="3"
          fill="#C5C5C5"
        >
          O
        </text>
        <text
          className="rexon-logo-intro__letter rexon-logo-intro__letter--n"
          x="382"
          y="102"
          fontFamily="Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="68"
          fontWeight="700"
          letterSpacing="3"
          fill="#C5C5C5"
        >
          N
        </text>
      </svg>
    </div>
  );
}
