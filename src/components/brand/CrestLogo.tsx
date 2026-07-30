import { describeArc } from "@/lib/geometry";
import styles from "./CrestLogo.module.css";

const CX = 120;
const CY = 120;

const DOT_ANGLES = [-55, 55, 150, 210, 240, 300].filter(
  (v, i, arr) => arr.indexOf(v) === i
);

export function CrestLogo({
  size = 220,
  playing = false,
  className,
}: {
  size?: number;
  playing?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      role="img"
      aria-label="Tyco Creative Collective"
      className={`${styles.crest} ${playing ? styles.playing : ""} ${className ?? ""}`}
    >
      <defs>
        <path id="arc-top" d={describeArc(CX, CY, 101, -52, 52)} />
        <path id="arc-right" d={describeArc(CX, CY, 101, 60, 120)} />
        <path id="arc-left" d={describeArc(CX, CY, 101, 300, 240)} />
        <path id="arc-bottom" d={describeArc(CX, CY, 101, 212, 148)} />
      </defs>

      <g className={styles.ring} aria-hidden>
        <circle cx={CX} cy={CY} r={110} pathLength={1} />
        <circle cx={CX} cy={CY} r={92} pathLength={1} />
      </g>

      <g className={styles.dots} aria-hidden>
        {DOT_ANGLES.map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x = CX + 101 * Math.cos(rad);
          const y = CY + 101 * Math.sin(rad);
          return <circle key={deg} cx={x} cy={y} r={2.4} />;
        })}
      </g>

      <g className={`${styles.ringText} ${styles.ringTextTop}`} aria-hidden>
        <text>
          <textPath href="#arc-top" startOffset="50%" textAnchor="middle">
            TYCO
          </textPath>
        </text>
      </g>
      <g className={`${styles.ringText} ${styles.ringTextRight}`} aria-hidden>
        <text>
          <textPath href="#arc-right" startOffset="50%" textAnchor="middle">
            COLLECTIVE
          </textPath>
        </text>
      </g>
      <g className={`${styles.ringText} ${styles.ringTextLeft}`} aria-hidden>
        <text>
          <textPath href="#arc-left" startOffset="50%" textAnchor="middle">
            CREATIVE
          </textPath>
        </text>
      </g>
      <g className={`${styles.ringText} ${styles.ringTextBottom}`} aria-hidden>
        <text>
          <textPath href="#arc-bottom" startOffset="50%" textAnchor="middle">
            EST. 2024
          </textPath>
        </text>
      </g>

      <g className={styles.crown} aria-hidden>
        <path d="M78,96 L78,72 L98,87 L120,54 L142,87 L162,72 L162,96 Z" />
        <circle cx={78} cy={72} r={2.6} className={styles.crownDot} />
        <circle cx={120} cy={54} r={2.6} className={styles.crownDot} />
        <circle cx={162} cy={72} r={2.6} className={styles.crownDot} />
      </g>

      <g className={styles.shield} aria-hidden>
        <clipPath id="shield-left-half">
          <rect x="0" y="0" width={CX} height="240" />
        </clipPath>
        <clipPath id="shield-right-half">
          <rect x={CX} y="0" width="120" height="240" />
        </clipPath>
        <path
          className={styles.shieldLeft}
          clipPath="url(#shield-left-half)"
          d="M120,96 C154,96 176,112 176,140 C176,172 152,193 120,214 C88,193 64,172 64,140 C64,112 86,96 120,96 Z"
        />
        <path
          className={styles.shieldRight}
          clipPath="url(#shield-right-half)"
          d="M120,96 C154,96 176,112 176,140 C176,172 152,193 120,214 C88,193 64,172 64,140 C64,112 86,96 120,96 Z"
        />
      </g>

      <text x={120} y={182} textAnchor="middle" className={styles.letterT} aria-hidden>
        T
      </text>
    </svg>
  );
}
