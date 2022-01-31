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
    path: [[Filename#Heading]]
    ranges: "Hello " to "world.", "Foobar" to "Bizzbaz"
    join: " -- "
    display: inline
    show: author, title
    ```

### Fields

> #### `path`
>
> **Syntax:** `[[filename#subpath]]`
>
> **subpath syntax**:
>
> - A heading: `#Some heading`
> - A block id: `#^blockid`
> - A list item: `#-Some list item`
>
> **Default:** None
>
> **Description:** **Required**. The path to the content you want to include,
> formatted like an obsidian link. Additionally supports specifying a list
> item. Multiple headings or multiple list items can be chained in the subpath.

> #### `ranges`
>
> **Syntax:** `range, range`
>
> **range syntax:**
>
> - `"text" to "text"`
> - `"whole quote"`
> - `line:col to line:col`
> - `after "text"`
> - `after line:col`
>
> **Default:** None
>
> **Description:** A subselection of the path you would like to embed.
> Multiple ranges are joined by `, `.

> #### `join`
>
> **Syntax:** `"string"`
>
> **Default:** `" ... "`
>
> **Description:** How to combine multiple ranges.
> This field is only used if there are 2 or more ranges specified.

> #### `display`
>
> **Syntax:**
>
> - `embedded`
> - `inline`
>
> **Default:** `embedded`
>
> **Description:** How to display the embed.

> #### `show`
>
> **Syntax:** `option, option`
>
> **options:**
>
> - `author`
> - `title`
>
> **Default:** None
>
> **Description:** Whether to include the source author or title.
> Multiple options can be joined with `, `.

### Deprecated Fields

| Line      | Syntax               | Description                                                                                                                                   | Default |
| --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `file`    | `[[filename]]`       | **Deprecated. Use path instead.** The filename of a markdown file in internal link syntax.                                                    | None    |
| `heading` | `#heading1#heading2` | **Deprecated. Use path instead.** The parent headings of an embed. These are case sensitive. Multiple can be chained for greater specificity. | None    |
| `block`   | `^blockid`           | **Deprecated. Use path instead.** The block id containing the quote.                                                                          | None    |

## Limitations

There are currently some limitations to the current implementation:

- Copying from preview mode only works if the underlying markdown can be
  reconstructed.
  Things like mathjax are not currently handled.
  You can always copy from source/live mode.
- The embedded content cannot contain another quoth code block,
  because that could lead to infinite recursion.
- Rendering relies on an async call to Obsidian's renderMarkdown API,
  so embeds relying on postprocessing (like other embeds) will not work.
- It is for display only. It cannot do things that would update the
  original source, like checking checkboxes.
