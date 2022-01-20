// from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
export function escapeRegex(re: string): string {
  // $& means the whole matched string
  return re.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
