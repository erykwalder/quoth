# Quoth Plugin

This a plugin for [Obsidian](https://obsidian.md)
that allows embedding from other markdown files
with greater flexibility than the standard embed syntax.

It allows:

- Embedding parts of a single block
- Embedding multiple parts in one "quote"
- Inlining the embed so it aligns with other content
- Automatically adding source author and title to the embed

## Copying References

The simplest way to use the plugin is to use the copy reference command.
This will take a selection from source mode or preview mode
and copy a qouth code block into your clipboard
that can be pasted in other documents.
The hotkey for this is either `Ctrl-Shift-'` or `Cmd-Shift-'` depending on your OS.

## Code Blocks

Code blocks can also be constructed manually, and some functionality requires it.
All the fields in the code block can be seen below:

    ```quoth
    file: [[Source File]]
    heading: #Source Section
    ranges: "Hello " to "world.", "Foobar" to "Bizzbaz"
    join: " -- "
    display: inline
    show: author, title
    ```

| Line      | Syntax                                       | Description                                                                                                 | Default    |
| --------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| `file`    | `[[filename]]`                               | **Required.** The filename of a markdown file in internal link syntax.                                      | None       |
| `heading` | `#heading1#heading2`                         | The parent headings of an embed. These are case sensitive. Multiple can be chained for greater specificity. | None       |
| `ranges`  | `"text" to "text"` or `line:col to line:col` | The part of the document you would like to embed. Multiple ranges can be joined with `,`.                   | None       |
| `join`    | `"; "`                                       | How to combine multiple ranges.                                                                             | `" ... "`  |
| `display` | `embedded` or `inline`                       | How to display the embed.                                                                                   | `embedded` |
| `show`    | `author` and/or `title`                      | Whether to include the source author or title. Multiple options can be joined with `,`.                     | None       |

## Limitations

There are currently some limitations to the current implementation:

- Copying from preview mode only works if the underlying markdown can be
  reconstructed. Things like footnotes are not currently handled.
- The embedded content cannot contain another quoth code block, because that
  could lead to infinite recursion.
