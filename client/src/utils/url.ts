export function isNonEmptyUrl(s: string): boolean {
  try {
    return !!new URL(s);
  } catch {
    return false;
  }
}
