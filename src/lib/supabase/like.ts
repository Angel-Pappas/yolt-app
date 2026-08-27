/**
 * Escape a user-supplied search term so a literal `%` or `_` in it can't act as
 * a wildcard inside a PostgREST `ilike`/`like` pattern. Shared by every list
 * query's search box.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}
