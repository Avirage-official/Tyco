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

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M19.5 19.5 15.4 15.4" />
      <circle cx="10.8" cy="10.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5 9.5 17 19 6.5" />
    </svg>
  );
}

export function IconBoat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 17V5" />
      <path d="M12 6.5 18 14.5H12Z" />
      <path d="M3.5 17c2 1.6 4.6 2.4 8.5 2.4s6.5-.8 8.5-2.4" />
      <circle cx="12" cy="5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
