"use client"

import { useEffect, useRef } from "react"
import { Editor } from "@tinymce/tinymce-react"
import { useTheme } from "next-themes"

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  height?: number
  label?: string
  error?: string
  required?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter content here...",
  height = 400,
  label,
  error,
  required = false,
}: RichTextEditorProps) {
  const editorRef = useRef(null)
  const { theme } = useTheme()

  // Determine skin based on theme
  const skin = theme === "dark" ? "oxide-dark" : "oxide"
  const contentCss = theme === "dark" ? "dark" : "default"

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={`border rounded-lg overflow-hidden ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}>
        <Editor
          apiKey="o56uczhvkjln1megh6rdt2yrnv494kx0zen4tj8iyx1fpor2"
          onInit={(evt, editor) => (editorRef.current = editor)}
          value={value}
          onEditorChange={(newValue) => onChange(newValue)}
          init={{
            height: height,
            menubar: true,
            skin: skin,
            content_css: contentCss,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "charmap",
              "preview",
              "anchor",
              "searchreplace",
              "visualblocks",
              "code",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "help",
              "wordcount",
              "codesample",
            ],
            toolbar:
              "undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table codesample | forecolor backcolor | removeformat | fullscreen code help",
            block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre",
            font_formats: "Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monospace; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings",
            relative_urls: false,
            remove_script_host: false,
            convert_urls: false,
            paste_as_text: false,
            paste_data_images: true,
            automatic_uploads: true,
            file_picker_types: "image media",
            file_picker_callback: (callback, value, meta) => {
  if (meta.filetype === "image") {
    const input = document.createElement("input")

    input.setAttribute("type", "file")
    input.setAttribute("accept", "image/*")

    input.onchange = () => {
      const file = input.files?.[0]

      if (!file) return

      const reader = new FileReader()

      reader.onload = () => {
        callback(reader.result as string, {
          alt: file.name,
        })
      }

      reader.readAsDataURL(file)
    }

    input.click()
  }
},
            branding: false,
            statusbar: true,
            elementpath: true,
            resize: "both",
            min_height: 300,
            max_height: 800,
            content_style: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: ${theme === "dark" ? "#e5e7eb" : "#1f2937"};
              }
              p { margin: 0 0 1em 0; }
              h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em 0; font-weight: 600; }
              h1 { font-size: 2em; }
              h2 { font-size: 1.5em; }
              h3 { font-size: 1.25em; }
              ul, ol { margin: 0 0 1em 1.5em; }
              li { margin: 0.25em 0; }
              blockquote { margin: 1em 0; padding-left: 1em; border-left: 3px solid #d1d5db; color: #6b7280; }
              code { background: ${theme === "dark" ? "#374151" : "#f3f4f6"}; padding: 0.2em 0.4em; border-radius: 3px; font-family: 'Courier New', monospace; }
              pre { background: ${theme === "dark" ? "#1f2937" : "#f9fafb"}; padding: 1em; border-radius: 6px; overflow-x: auto; }
              pre code { background: none; padding: 0; }
              table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              table td, table th { border: 1px solid #d1d5db; padding: 0.5em; }
              table th { background: ${theme === "dark" ? "#374151" : "#f3f4f6"}; font-weight: 600; }
              img { max-width: 100%; height: auto; }
              a { color: #3b82f6; text-decoration: underline; }
              a:hover { color: #1d4ed8; }
            `,
          }}
          placeholder={placeholder}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Supports rich text formatting, images, tables, code blocks, and more.
      </p>
    </div>
  )
}
