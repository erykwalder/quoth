# Changelog

### version 0.6.1

Fixes:

- Opening embed links to non-markdown files.

### version 0.6.0

New Features:

- Scoping embeds to list items.
- `after` ranges which will embed everything after a
  position or after a string.
- A new command to replace blockquotes with embeds
  from a source file.

Fixes:

- Support tilde `~` code blocks.

### version 0.5.0

New Features:

- Code blocks when embedding other filetypes with syntax highlighting.

### version 0.4.0

New Features:

- Automatically updates quoths when source files are renamed.

Fixes:

- Attempts to load non-markdown embeds.

### version 0.3.0

New Features:

- Path line in code block combines file, heading, and block
- Scoping quoth to a block ID
- Title in a quoth block is now a link

Improvements:

- Copy reference only copies as many headings as needed to be unique

Fixes:

- No longer attempt to copy when command is called with nothing selected
- Copy reference doesn't use headers to scope if they are not unique

### version 0.2.1

Fixes:

- Loading settings on startup

### version 0.2.0

New Features:

- Added an icon for the Copy Reference action
- Added a copy reference button to mobile
- Embeds are contextualized based on surrounding markdown,
  so things like bold, italic, or list item getting pulled in.

Improvements:

- Clearer error messages for both copying and embedding
- Preview view copying handles far more cases

Fixes:

- Can manually call copy reference on mobile when opening the command palette.
- Links in embedded mode now resolve
  (embedded content is no longer wrapped in markdown-preview-view div).
- Author is only rendered if present in the frontmatter
