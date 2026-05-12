"use client"

import React, { useCallback, useState, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import Youtube from "@tiptap/extension-youtube"
import { EditorToolbar } from "./EditorToolbar"
import { EditorMenuBubble } from "./EditorMenuBubble"
import "./RichTextEditor.css"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
  autosave?: boolean
  autosaveInterval?: number
  onAutosave?: (value: string) => void
  showPreview?: boolean
  disabled?: boolean
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  height = "400px",
  autosave = false,
  autosaveInterval = 30000,
  onAutosave,
  showPreview = false,
  disabled = false,
}) => {
  const [isPreview, setIsPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)

      // Update word and character count
      const text = editor.getText()
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
      setCharCount(text.length)
    },
    editable: !disabled,
  })

  // Autosave functionality
  useEffect(() => {
    if (!autosave || !editor) return

    const interval = setInterval(() => {
      if (onAutosave && editor.getHTML() !== value) {
        onAutosave(editor.getHTML())
      }
    }, autosaveInterval)

    return () => clearInterval(interval)
  }, [autosave, autosaveInterval, editor, onAutosave, value])

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return <div className="editor-loading">Loading editor...</div>
  }

  const containerClass = `editor-container ${isFullscreen ? "fullscreen" : ""}`

  return (
    <div className={containerClass}>
      <EditorToolbar
        editor={editor}
        onPreview={() => setIsPreview(!isPreview)}
        onFullscreen={() => setIsFullscreen(!isFullscreen)}
        isPreview={isPreview}
        isFullscreen={isFullscreen}
      />

      <div className="editor-wrapper" style={{ height: isFullscreen ? "100vh" : height }}>
        {isPreview ? (
          <div className="editor-preview">
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        ) : (
          <>
            <EditorContent
              editor={editor}
              className="editor-content"
              placeholder={placeholder}
            />
            <EditorMenuBubble editor={editor} />
          </>
        )}
      </div>

      <div className="editor-status-bar">
        <div className="status-info">
          <span className="word-count">Words: {wordCount}</span>
          <span className="char-count">Characters: {charCount}</span>
        </div>
        {autosave && <span className="autosave-indicator">Autosave enabled</span>}
      </div>
    </div>
  )
}
