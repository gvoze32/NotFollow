// File-upload plumbing for the export-based pages (instagram/tiktok/x).
// Element ids come from `components/upload/UploadCard.astro` / `FileInput.astro`.

import { setError } from "./results";

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("the file is not valid JSON");
  }
}

/** Read a nested property from parsed JSON; `undefined` once a step is not an object. */
export function at(value: unknown, ...path: (string | number)[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

/**
 * Parse the input's current selection whenever it changes and return a getter
 * for the parsed value. Each selection replaces the previous one; an invalid or
 * empty selection yields `null`, and reads from superseded selections are
 * dropped.
 */
export function bindFileInput<T>(
  inputId: string,
  label: string,
  parse: (contents: string[]) => T
): () => T | null {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  let value: T | null = null;
  let selection = 0;

  input?.addEventListener("change", async () => {
    const current = ++selection;
    value = null;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    try {
      const contents = await Promise.all(files.map((file) => file.text()));
      if (current !== selection) return;
      value = parse(contents);
      setError("");
    } catch (error) {
      if (current !== selection) return;
      console.error(`Error reading ${label}:`, error);
      setError(`Could not read ${label}: ${(error as Error).message}.`);
    }
  });

  return () => value;
}

/** Run `handler` when the "Check Non-Followers" button is clicked. */
export function onCheck(handler: () => void) {
  document.getElementById("check-button")?.addEventListener("click", handler);
}
