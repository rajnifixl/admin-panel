"use client"

import React, { useState } from "react"
import { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Image as ImageIcon,
  Code,
  Quote,
  Undo2,
  Redo2,
  Eye,
  Maximize2,
  Minimize2,
  Palette,
  Highlighter,
  Table as TableIcon,
  Trash2,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import "./EditorToolbar.css"

interface EditorToolbarProps {
  editor: Editor
  onPreview: () => void
  onFullscreen: () => void
  isPreview: boolean
  isFullscreen: boolean
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onPreview,
  onFullscreen,
  isPreview,
  isFullscreen,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const handleAddLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
      setLinkUrl("")
      setShowLinkInput(false)
    }
  }

  const handleAddImage = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event: any) => {
          editor.chain().focus().setImage({ src: event.target.result }).run()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleAddYoutube = () => {
    const url = prompt("Enter YouTube URL:")
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      })
    }
  }

  const handleAddTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }

  const colors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"]
  const highlights = ["#FFFF00", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]

  return (
    <div className="editor-toolbar">
      {/* Text Formatting */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant={editor.isActive("bold") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("italic") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("underline") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("strike") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </Button>
      </div>

      {/* Headings */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </Button>
      </div>

      {/* Lists */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant={editor.isActive("bulletList") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("orderedList") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </Button>
      </div>

      {/* Alignment */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "center" }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "right" }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight size={16} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: "justify" }) ? "default" : "outline"}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="Justify"
        >
          <AlignJustify size={16} />
        </Button>
      </div>

      {/* Colors */}
      <div className="toolbar-group">
        <div className="color-picker-wrapper">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
          >
            <Palette size={16} />
          </Button>
          {showColorPicker && (
            <div className="color-picker">
              {colors.map((color) => (
                <button
                  key={color}
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run()
                    setShowColorPicker(false)
                  }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        <div className="color-picker-wrapper">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            title="Highlight Color"
          >
            <Highlighter size={16} />
          </Button>
          {showHighlightPicker && (
            <div className="color-picker">
              {highlights.map((color) => (
                <button
                  key={color}
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color }).run()
                    setShowHighlightPicker(false)
                  }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media & Links */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddImage}
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </Button>

        <div className="link-input-wrapper">
          <Button
            size="sm"
            variant={editor.isActive("link") ? "default" : "outline"}
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="Add Link"
          >
            <Link2 size={16} />
          </Button>
          {showLinkInput && (
            <div className="link-input">
              <Input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddLink()}
              />
              <Button size="sm" onClick={handleAddLink}>
                Add
              </Button>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleAddYoutube}
          title="Embed YouTube"
        >
          <Play size={16} />
        </Button>
      </div>

      {/* Tables & Blocks */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddTable}
          title="Insert Table"
        >
          <TableIcon size={16} />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive("blockquote") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote size={16} />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive("codeBlock") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Code size={16} />
        </Button>
      </div>

      {/* Undo/Redo */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo2 size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo2 size={16} />
        </Button>
      </div>

      {/* View Options */}
      <div className="toolbar-group">
        <Button
          size="sm"
          variant={isPreview ? "default" : "outline"}
          onClick={onPreview}
          title="Preview"
        >
          <Eye size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onFullscreen}
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>
    </div>
  )
}

// Helper icon component
const Play = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
)
