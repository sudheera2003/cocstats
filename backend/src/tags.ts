const TAG_PATTERN = /^[0289PYLQGRJCUV]{3,12}$/

/**
 * "#2pp0jccl", "2PP0JCCL" and "%232PP0JCCL" all become "#2PP0JCCL". Returns null
 * for anything that can't be a tag, so user input never reaches the API path.
 */
export function normalizeTag(input: string | undefined | null): string | null {
  if (!input) return null
  const cleaned = input
    .trim()
    .replace(/^(%23|#)/i, "")
    .toUpperCase()
    // The game never uses the letter O in tags; people type it for a zero.
    .replace(/O/g, "0")
  return TAG_PATTERN.test(cleaned) ? `#${cleaned}` : null
}

/** A tag without its #, for ids and URLs. */
export function tagId(tag: string) {
  return tag.replace(/^#/, "")
}

/** A tag as it goes into an API path. */
export function encodeTag(tag: string) {
  return encodeURIComponent(tag)
}
