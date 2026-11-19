"use client";
import "@mdxeditor/editor/style.css";
import type { ForwardedRef } from "react";
import { useTheme } from "next-themes";
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  BlockTypeSelect,
} from "@mdxeditor/editor";

export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  // The editor has its own dark palette for its toolbar icons and popups;
  // without it the icons are dark on dark and disabled ones look enabled.
  const { resolvedTheme } = useTheme();
  return (
    <MDXEditor
      className={`min-w-0 max-w-full ${resolvedTheme === "dark" ? "dark-theme" : ""}`}
      // The box grows with the text up to a cap and then scrolls; without the
      // overflow rule a long description spilled over the fields below it.
      contentEditableClassName="prose! dark:prose-invert! min-h-56 max-h-[70vh] grow overflow-y-auto wrap-break-word max-w-none! sm:min-h-80"
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [3, 4, 5, 6] }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        // Links are common in descriptions; without these two the editor
        // stops drawing at the first one and the toolbar's link button is dead.
        linkPlugin(),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName:
            "flex-wrap! rounded-b-none! bg-default! text-foreground! sm:flex-nowrap! [&_button:disabled]:opacity-40",
          toolbarContents: () => (
            <>
              <BlockTypeSelect />
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <CreateLink />
              <ListsToggle />
            </>
          ),
        }),
      ]}
      {...props}
      ref={editorRef}
    />
  );
}
