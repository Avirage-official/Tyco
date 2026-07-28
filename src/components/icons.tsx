import type { SVGProps } from "react";

/**
 * Hand-drawn-feeling icon set for Tyco: a single stroke, rounded caps,
 * every mark carries a small red dot — the brand's recurring motif.
 * Deliberately not a swap-in from a generic icon library.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconHome(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h5v-5h2v5h5v-9" />
      <circle cx="12" cy="16.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconWaves(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9c1.4-2 2.8-2 4.2 0s2.8 2 4.2 0 2.8-2 4.2 0 2.8 2 4.2 0" />
      <path d="M3 15c1.4-2 2.8-2 4.2 0s2.8 2 4.2 0 2.8-2 4.2 0 2.8 2 4.2 0" />
      <circle cx="19.6" cy="9" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconMark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5.5h9.5" />
      <path d="M9.7 5.5v13" />
      <path d="M14 13.2c1.6-1.6 3-1.6 4.6 0" />
      <circle cx="18.8" cy="16.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBag(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 8.5h11l1 12h-13z" />
      <path d="M9 8V6.8a3 3 0 0 1 6 0V8" />
      <circle cx="12" cy="13.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.3" r="3.3" />
      <path d="M5 20c1.3-3.8 4-5.6 7-5.6s5.7 1.8 7 5.6" />
      <circle cx="12" cy="8.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 5.5v13l11-6.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPause(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5.5v13" />
      <path d="M16 5.5v13" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15" />
      <path d="M13 6.5 19 12l-6 5.5" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M4 12.5h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 5.5 18.5 18.5" />
      <path d="M18.5 5.5 5.5 18.5" />
    </svg>
  );
}

export function IconSkipNext(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 5.5v13" />
      <path d="M8 12 17.5 5.8v12.4z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSkipPrevious(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 5.5v13" />
      <path d="M16 12 6.5 5.8v12.4z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShuffle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h3.2c1.8 0 2.7 1 3.8 2.6" />
      <path d="M4 17h3.2c1.8 0 2.7-1 3.8-2.6" />
      <path d="M13 8.6c1.1-1.6 2-2.6 3.8-2.6H20" />
      <path d="M13 15.4c1.1 1.6 2 2.6 3.8 2.6H20" />
      <path d="M17.2 4.5 20 7l-2.8 2.5" />
      <path d="M17.2 19.5 20 17l-2.8-2.5" />
    </svg>
  );
}

export function IconRepeat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 8h10a3 3 0 0 1 3 3v1" />
      <path d="M16.5 5.5 19 8l-2.5 2.5" />
      <path d="M18 16H8a3 3 0 0 1-3-3v-1" />
      <path d="M7.5 18.5 5 16l2.5-2.5" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 9 12 15.5 18.5 9" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 19.5c-4-2.6-8-5.7-8-9.7a4.3 4.3 0 0 1 8-2.1 4.3 4.3 0 0 1 8 2.1c0 4-4 7.1-8 9.7z" />
    </svg>
  );
}
