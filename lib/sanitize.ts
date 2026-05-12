import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (html: string): string => {
  if (!html) return ""

  const config = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "iframe",
      "span",
      "div",
    ],
    ALLOWED_ATTR: [
      "href",
      "title",
      "target",
      "rel",
      "src",
      "alt",
      "width",
      "height",
      "style",
      "class",
      "data-*",
      "colspan",
      "rowspan",
      "align",
    ],
    ALLOW_DATA_ATTR: true,
  }

  return DOMPurify.sanitize(html, config)
}

/**
 * Extract plain text from HTML
 */
export const extractPlainText = (html: string): string => {
  if (!html) return ""

  // Remove HTML tags
  const plainText = html.replace(/<[^>]*>/g, "")
  // Decode HTML entities
  const decoded = plainText
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  return decoded.trim()
}

/**
 * Get word count from HTML content
 */
export const getWordCount = (html: string): number => {
  const plainText = extractPlainText(html)
  const words = plainText.split(/\s+/).filter((word) => word.length > 0)
  return words.length
}

/**
 * Get character count from HTML content
 */
export const getCharacterCount = (html: string): number => {
  const plainText = extractPlainText(html)
  return plainText.length
}

/**
 * Generate excerpt from HTML content
 */
export const generateExcerpt = (html: string, length: number = 150): string => {
  const plainText = extractPlainText(html)

  if (plainText.length <= length) {
    return plainText
  }

  // Find the last space within the length limit
  const truncated = plainText.substring(0, length)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace)
  }

  return truncated
}

/**
 * Convert HTML to plain text
 */
export const htmlToPlainText = (html: string): string => {
  return extractPlainText(html)
}

/**
 * Check if HTML content is safe
 */
export const isHTMLSafe = (html: string): boolean => {
  if (!html) return true

  const sanitized = sanitizeHTML(html)
  return sanitized === html
}

/**
 * Validate HTML content
 */
export const validateHTML = (
  html: string,
  options?: {
    minLength?: number
    maxLength?: number
    allowedTags?: string[]
  }
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!html) {
    errors.push("Content is empty")
    return { valid: false, errors }
  }

  const plainText = extractPlainText(html)

  if (options?.minLength && plainText.length < options.minLength) {
    errors.push(`Content must be at least ${options.minLength} characters`)
  }

  if (options?.maxLength && plainText.length > options.maxLength) {
    errors.push(`Content must not exceed ${options.maxLength} characters`)
  }

  if (!isHTMLSafe(html)) {
    errors.push("Content contains potentially unsafe HTML")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Convert markdown to HTML (basic implementation)
 */
export const markdownToHTML = (markdown: string): string => {
  if (!markdown) return ""

  let html = markdown

  // Headers
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>")

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>")

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
  html = html.replace(/_(.+?)_/g, "<em>$1</em>")

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>")
  html = `<p>${html}</p>`

  return sanitizeHTML(html)
}

/**
 * Strip HTML tags
 */
export const stripHTMLTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, "")
}

/**
 * Get reading time in minutes
 */
export const getReadingTime = (html: string, wordsPerMinute: number = 200): number => {
  const wordCount = getWordCount(html)
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Truncate HTML content while preserving tags
 */
export const truncateHTML = (html: string, length: number): string => {
  const plainText = extractPlainText(html)

  if (plainText.length <= length) {
    return html
  }

  const truncated = plainText.substring(0, length)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}

/**
 * Merge multiple HTML contents
 */
export const mergeHTML = (contents: string[]): string => {
  return contents.map((content) => sanitizeHTML(content)).join("<br/>")
}

/**
 * Compare two HTML contents (ignoring formatting)
 */
export const compareHTML = (html1: string, html2: string): boolean => {
  const text1 = extractPlainText(html1).toLowerCase()
  const text2 = extractPlainText(html2).toLowerCase()
  return text1 === text2
}

/**
 * Get HTML statistics
 */
export const getHTMLStats = (html: string) => {
  return {
    wordCount: getWordCount(html),
    characterCount: getCharacterCount(html),
    readingTime: getReadingTime(html),
    paragraphs: (html.match(/<p>/g) || []).length,
    headings: (html.match(/<h[1-6]>/g) || []).length,
    links: (html.match(/<a/g) || []).length,
    images: (html.match(/<img/g) || []).length,
    tables: (html.match(/<table/g) || []).length,
  }
}
