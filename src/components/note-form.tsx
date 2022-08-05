import {
  autocompletion,
  closeBrackets,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { history } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder } from "@codemirror/view";
import { parseDate } from "chrono-node";
import React from "react";
import { GlobalStateContext } from "../global-state";
import { formatDate } from "../utils/format-date";
import { Button } from "./button";

type NoteFormProps = {
  id?: string;
  defaultBody?: string;
  codeMirrorViewRef?: React.MutableRefObject<EditorView | undefined>;
  onSubmit?: (note: { id: string; body: string }) => void;
  onCancel?: () => void;
};

export function NoteForm({
  id,
  defaultBody = "",
  codeMirrorViewRef,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const globalState = React.useContext(GlobalStateContext);

  const {
    editorRef,
    view,
    value: body = "",
  } = useCodeMirror({
    defaultValue: defaultBody,
    placeholder: "Write something...",
    viewRef: codeMirrorViewRef,
  });

  function handleSubmit() {
    const note = {
      id: id ?? Date.now().toString(),
      body: body,
    };

    globalState.service?.send({
      type: "UPSERT_NOTE",
      ...note,
    });

    onSubmit?.(note);

    // If we're creating a new note, reset the form after submitting
    if (!id) {
      view?.dispatch({
        changes: [{ from: 0, to: body.length, insert: defaultBody }],
      });
    }
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={event => {
        handleSubmit();
        event.preventDefault();
      }}
      onKeyDown={event => {
        // Cancel on `escape`
        if (event.key === "Escape") {
          onCancel?.();
        }
      }}
    >
      <div
        ref={editorRef}
        className="p-2"
        onKeyDown={event => {
          // Submit on `command + enter`
          if (event.key === "Enter" && event.metaKey) {
            handleSubmit();
            event.preventDefault();
          }
        }}
      />
      <div className="self-end flex gap-2">
        {onCancel ? (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary">
          {id ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
}

// Reference: https://www.codiga.io/blog/implement-codemirror-6-in-react/
function useCodeMirror({
  defaultValue,
  placeholder: placeholderValue = "",
  viewRef: providedViewRef,
}: {
  defaultValue?: string;
  placeholder?: string;
  viewRef?: React.MutableRefObject<EditorView | undefined>;
}) {
  const [editorElement, setEditorElement] = React.useState<HTMLElement>();
  const editorRef = React.useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setEditorElement(node);
  }, []);

  const newViewRef = React.useRef<EditorView>();
  const viewRef = providedViewRef ?? newViewRef;

  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (!editorElement) return;

    const state = EditorState.create({
      doc: defaultValue,
      extensions: [
        placeholder(placeholderValue),
        history(),
        EditorView.updateListener.of(event => {
          const value = event.view.state.doc.sliceString(0);
          setValue(value);
        }),
        closeBrackets(),
        autocompletion({
          override: [dateCompletion],
          icons: false,
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorElement,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [editorElement]);

  return { editorRef, view: viewRef.current, value };
}

function dateCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/(\[\[)?\w*/);

  if (!word) {
    return null;
  }

  // Ignore words inside internal links
  if (word.text.startsWith("[[")) {
    return null;
  }

  const date = parseDate(word.text);

  if (!date) {
    return null;
  }

  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  return {
    from: word.from,
    options: [
      {
        label: formatDate(dateString),
        apply: `[[${dateString}]]`,
      },
    ],
    filter: false,
  };
}
