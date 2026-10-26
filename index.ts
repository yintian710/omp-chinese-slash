import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { CustomEditor } from "@oh-my-pi/pi-tui/prompt/custom-editor";

/** Only a leading ideographic comma is a slash-command prefix. */
export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    const previousFactory = ctx.ui.getEditorComponent();
    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      const editor = previousFactory
        ? previousFactory(tui, theme, keybindings)
        : new CustomEditor(tui, theme, keybindings);
      const handleInput = editor.handleInput.bind(editor);

      // Keep native editing, undo and completion; never intercept dialog input.
      editor.handleInput = (data: string) => {
        const cursor = editor.getCursor();
        if (cursor.line === 0 && cursor.col === 0) {
          if (data.startsWith("、")) {
            data = "/" + data.slice(1);
          } else if (data.startsWith("\x1b[200~、")) {
            data = "\x1b[200~/" + data.slice(7);
          }
        }
        handleInput(data);
      };
      return editor;
    });
  });

  // Submission fallback for RPC and non-keyboard input.
  pi.on("input", (event) => {
    if (event.text.startsWith("、")) {
      return { text: "/" + event.text.slice(1) };
    }
  });
}
