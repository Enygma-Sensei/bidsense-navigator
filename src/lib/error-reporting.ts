/**
 * Neutral error reporter — forwards errors to the browser console.
 * Drop-in replacement for the previous Lovable-specific hook.
 * No vendor dependency, no telemetry outside your own browser devtools.
 */

type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context: ErrorContext = {}): void {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[BidSense error]", message, { context, stack });
}

// Backwards-compatible alias used by __root.tsx
export { reportError as reportLovableError };
