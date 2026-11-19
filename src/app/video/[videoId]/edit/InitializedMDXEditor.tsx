"use client";
import "@mdxeditor/editor/style.css";
import type { ForwardedRef } from "react";
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
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
  return (
    <MDXEditor
      className="min-w-0 max-w-full"
      // The box grows with the text up to a cap and then scrolls; without the
      // overflow rule a long description spilled over the fields below it.
      contentEditableClassName="prose! dark:prose-invert! min-h-56 max-h-[70vh] grow overflow-y-auto wrap-break-word max-w-none! sm:min-h-80"
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [3, 4, 5, 6] }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarClassName:
            "flex-wrap! rounded-b-none! bg-content2! dark:bg-primary-100! sm:flex-nowrap!",
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
