# Changelog

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
