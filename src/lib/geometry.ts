/** Small polar-to-cartesian helpers for drawing arcs (ring text paths, radial UI). */

function toXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Arc path `d` from startDeg to endDeg (0 = 12 o'clock, clockwise), radius r around (cx, cy). */
export function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = toXY(cx, cy, r, startDeg);
  const end = toXY(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}
