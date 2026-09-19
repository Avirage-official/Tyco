import { isKnownCountry } from "./countries";

export type WelcomeAnswers = {
  displayName: string;
  /** Day, month and year as typed — turned into a real date here. */
  day: string;
  month: string;
  year: string;
  country: string;
};

/**
 * Every rule lives here, split per question so a step can check its own
 * answer before it advances. Validating only on the last step would let
 * "31 February" through and then report it two screens later, while the
 * member is looking at a different question.
 *
 * The database keeps its own copy of these rules, because RLS lets a member
 * write their profile row directly and not only through the server action.
 */
export function validateName(displayName: string): string | null {
  const name = displayName.trim();
  if (name.length < 1) return "Tell us what to call you.";
  if (name.length > 60) return "That name is too long.";
  return null;
}

export function validateDateOfBirth(parts: {
  day: string;
  month: string;
  year: string;
}): { dateOfBirth: string } | { error: string } {
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);

  if (!parts.day || !parts.month || !parts.year) {
    return { error: "Enter the day, month and year." };
  }
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { error: "Enter your date of birth as numbers." };
  }
  if (year < 1900) return { error: "Check the year." };

  // Round-tripping through Date catches the impossible combinations a range
  // check cannot — 31 February, 31 April — because the constructor rolls
  // them into the next month and the parts stop matching.
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { error: "That date doesn't exist." };
  }
  if (parsed.getTime() > Date.now()) return { error: "That date is in the future." };

  return { dateOfBirth: parsed.toISOString().slice(0, 10) };
}

export function validateCountry(country: string): string | null {
  return isKnownCountry(country) ? null : "Choose where you're based.";
}

/** The whole set, re-checked on the server before anything is written. */
export function validate(answers: WelcomeAnswers): { dateOfBirth: string } | { error: string } {
  const nameError = validateName(answers.displayName);
  if (nameError) return { error: nameError };

  const dob = validateDateOfBirth(answers);
  if ("error" in dob) return dob;

  const countryError = validateCountry(answers.country);
  if (countryError) return { error: countryError };

  return dob;
}
