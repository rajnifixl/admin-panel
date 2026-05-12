"use client"

import React, { useState, useEffect } from "react"
import { RichTextEditor } from "./RichTextEditor"
import { sanitizeHTML, getWordCount, getCharacterCount, generateExcerpt } from "@/lib/sanitize"
import "./EditorField.css"

interface EditorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  hint?: string
  showCharCount?: boolean
  showWordCount?: boolean
  showExcerpt?: boolean
  maxLength?: number
  minLength?: number
  height?: string
  autosave?: boolean
  autosaveInterval?: number
  onAutosave?: (value: string) => void
  disabled?: boolean
}

export const EditorField: React.FC<EditorFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  hint,
  showCharCount = false,
  showWordCount = false,
  showExcerpt = false,
  maxLength,
  minLength,
  height = "400px",
  autosave = false,
  autosaveInterval = 30000,
  onAutosave,
  disabled = false,
}) => {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [excerpt, setExcerpt] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  // Extract plain text and update counts
  useEffect(() => {
    const plainText = value.replace(/<[^>]*>/g, "").trim()
    const words = plainText.split(/\s+/).filter(Boolean).length
    const chars = plainText.length

    setWordCount(words)
    setCharCount(chars)

    // Validation
    if (minLength && chars < minLength) {
      setValidationError(`Minimum ${minLength} characters required`)
    } else if (maxLength && chars > maxLength) {
      setValidationError(`Maximum ${maxLength} characters allowed`)
    } else {
      setValidationError(null)
    }

    // Generate excerpt
    if (showExcerpt) {
      setExcerpt(generateExcerpt(value, 150))
    }
  }, [value, minLength, maxLength, showExcerpt])

  const handleChange = (newValue: string) => {
    // Sanitize HTML
    const sanitized = sanitizeHTML(newValue)
    onChange(sanitized)
  }

  const isValid = !validationError && (!required || value.trim().length > 0)

  return (
    <div className={`editor-field ${error || validationError ? "error" : ""}`}>
      <div className="editor-field-header">
        <label className="editor-field-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
        {hint && <p className="editor-field-hint">{hint}</p>}
      </div>

      <RichTextEditor
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        height={height}
        autosave={autosave}
        autosaveInterval={autosaveInterval}
        onAutosave={onAutosave}
        disabled={disabled}
      />

      <div className="editor-field-footer">
        <div className="editor-field-stats">
          {showWordCount && <span className="stat">Words: {wordCount}</span>}
          {showCharCount && <span className="stat">Characters: {charCount}</span>}
          {maxLength && (
            <span className={`stat ${charCount > maxLength ? "error" : ""}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>

        {(error || validationError) && (
          <p className="editor-field-error">{error || validationError}</p>
        )}
      </div>

      {showExcerpt && excerpt && (
        <div className="editor-field-excerpt">
          <p className="excerpt-label">Preview:</p>
          <p className="excerpt-text">{excerpt}...</p>
        </div>
      )}
    </div>
  )
}
