import { useEffect, useMemo, useRef } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  FORMAT_TEXT_COMMAND,
} from 'lexical'
import type { EditorState } from 'lexical'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'

type RichTextEditorProps = {
  initialText?: string
  placeholder?: string
  onChange: (value: { lexicalJson: string; text: string }) => void
}

function EditorInitPlugin({ initialText }: { initialText?: string }) {
  const [editor] = useLexicalComposerContext()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current || !initialText) {
      return
    }
    initialized.current = true
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(initialText))
      root.append(paragraph)
    })
  }, [editor, initialText])

  return null
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        B
      </button>
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        I
      </button>
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      >
        U
      </button>
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        • List
      </button>
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        1. List
      </button>
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
      >
        Clear list
      </button>
      <button
        type="button"
        className="editor-toolbar-button"
        onClick={() => {
          const url = window.prompt('Enter link URL')
          if (url) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
          }
        }}
      >
        Link
      </button>
    </div>
  )
}

export function RichTextEditor({
  initialText,
  placeholder,
  onChange,
}: RichTextEditorProps) {
  const theme = useMemo(
    () => ({
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-bold',
        italic: 'editor-italic',
        underline: 'editor-underline',
      },
      list: {
        nested: {
          listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
      },
      link: 'editor-link',
    }),
    [],
  )

  const config = useMemo(
    () => ({
      namespace: 'course-editor',
      theme,
      onError: (error: Error) => console.error(error),
      nodes: [ListNode, ListItemNode, LinkNode],
    }),
    [theme],
  )

  return (
    <LexicalComposer initialConfig={config}>
      <EditorInitPlugin initialText={initialText} />
      <ToolbarPlugin />
      <div className="editor-shell">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">{placeholder}</div>}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin
          onChange={(editorState: EditorState) => {
            editorState.read(() => {
              const root = $getRoot()
              const text = root.getTextContent()
              const json = JSON.stringify(editorState.toJSON())
              onChange({ lexicalJson: json, text })
            })
          }}
        />
      </div>
    </LexicalComposer>
  )
}
