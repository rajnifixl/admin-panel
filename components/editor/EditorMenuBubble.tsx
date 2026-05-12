"use client"

import React, { useEffect, useState } from "react"
import { Editor } from "@tiptap/react"
import { Bold, Italic, Underline, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import "./EditorMenuBubble.css"

interface EditorMenuBubbleProps {
  editor: Editor
}

export const EditorMenuBubble: React.FC<EditorMenuBubbleProps> = ({ editor }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const handleSelectionUpdate = () => {
      const { state } = editor
      const { from, to } = state.selection

      if (from === to) {
        setIsVisible(false)
        return
      }

      const isEmptySelection = state.doc.textBetween(from, to).length === 0
      if (isEmptySelection) {
        setIsVisible(false)
        return
      }

      setIsVisible(true)

      // Get selection coordinates
      const coords = editor.view.coordsAtPos(from)
      setPosition({
        top: coords.top - 50,
        left: coords.left,
      })
    }

    editor.on("selectionUpdate", handleSelectionUpdate)
    editor.on("update", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
      editor.off("update", handleSelectionUpdate)
    }
  }, [editor])

  if (!isVisible) return null

  return (
    <div className="editor-menu-bubble" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
      <Button
        size="sm"
        variant={editor.isActive("bold") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold size={14} />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("italic") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic size={14} />
      </Button>
      <Button
        size="sm"
        variant={editor.isActive("underline") ? "default" : "ghost"}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline size={14} />
      </Button>
      <div className="menu-divider" />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().deleteSelection().run()}
        title="Delete"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
