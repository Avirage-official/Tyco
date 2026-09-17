import Image from "next/image";
import styles from "./CoverImage.module.css";

/**
 * The one way to render a content image. Wraps next/image in fill mode so
 * the parent decides the size (usually via aspect-ratio), always carries
 * real alt text, and degrades to a flat surface when there is no source
 * rather than to a broken image.
 *
 * `sizes` should describe the rendered width at each breakpoint so
 * next/image can pick the right source — e.g. "(min-width: 900px) 33vw,
 * 100vw" for a three-up grid.
 */
export function CoverImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const frameClass = className ? `${styles.frame} ${className}` : styles.frame;

  if (!src) {
    return <div className={`${frameClass} ${styles.placeholder}`} role="img" aria-label={alt} />;
  }

  return (
    <div className={frameClass}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={styles.img} />
    </div>
  );
}
