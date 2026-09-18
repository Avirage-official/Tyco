import { useId } from "react";
import styles from "./Field.module.css";

type FieldChrome = {
  label: string;
  helper?: string;
  error?: string | null;
  className?: string;
};

function Wrap({
  id,
  label,
  helper,
  error,
  className,
  children,
}: FieldChrome & { id: string; children: React.ReactNode }) {
  return (
    <div className={className ? `${styles.field} ${className}` : styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className={styles.helper} id={`${id}-helper`}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, helper?: string, error?: string | null) {
  if (error) return `${id}-error`;
  if (helper) return `${id}-helper`;
  return undefined;
}

export function Input({
  label,
  helper,
  error,
  className,
  trailing,
  id: idProp,
  ...rest
}: FieldChrome &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
    /** A control that sits inside the input's right edge — a password
     *  reveal, a unit, a clear button. Purely decorative content should
     *  carry aria-hidden. */
    trailing?: React.ReactNode;
  }) {
  const autoId = useId();
  const id = idProp ?? autoId;

  const control = (
    <input
      id={id}
      className={[styles.control, trailing ? styles.hasTrailing : "", error ? styles.invalid : ""]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, helper, error)}
      {...rest}
    />
  );

  return (
    <Wrap id={id} label={label} helper={helper} error={error} className={className}>
      {trailing ? (
        <div className={styles.adorned}>
          {control}
          <span className={styles.trailing}>{trailing}</span>
        </div>
      ) : (
        control
      )}
    </Wrap>
  );
}

export function Select({
  label,
  helper,
  error,
  className,
  id: idProp,
  children,
  ...rest
}: FieldChrome & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Wrap id={id} label={label} helper={helper} error={error} className={className}>
      <select
        id={id}
        className={[styles.control, styles.select, error ? styles.invalid : ""].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helper, error)}
        {...rest}
      >
        {children}
      </select>
    </Wrap>
  );
}

export function Textarea({
  label,
  helper,
  error,
  className,
  id: idProp,
  ...rest
}: FieldChrome & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Wrap id={id} label={label} helper={helper} error={error} className={className}>
      <textarea
        id={id}
        className={[styles.control, styles.textarea, error ? styles.invalid : ""].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helper, error)}
        {...rest}
      />
    </Wrap>
  );
}
