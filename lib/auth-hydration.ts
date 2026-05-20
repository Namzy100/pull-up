/** Client-side session restore timeouts (iOS PWA can hang on `getUser()`). */
export const SESSION_HYDRATION_TIMEOUT_MS = 3000;

export function logAuthHydration(
  event: string,
  detail?: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === "undefined") return;
  console.info("[auth-hydration]", JSON.stringify({ event, t: Date.now(), ...detail }));
}

/** Log iOS `navigator.standalone` and CSS `display-mode: standalone`. */
export function logPwaDisplayContext() {
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { standalone?: boolean };
  const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const displayFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  logAuthHydration("pwa_context", {
    navigatorStandalone: nav.standalone ?? null,
    displayModeStandalone: displayStandalone,
    displayModeFullscreen: displayFullscreen,
  });
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`timeout:${label}:${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        window.clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}

export function hydrationErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.startsWith("timeout:")) {
    return "Session restore timed out. This can happen in installed app mode — try again or sign out.";
  }
  return "Couldn’t restore your session. Try again or sign out.";
}
