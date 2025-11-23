<!-- 587559ed-67b9-4bc2-a993-c0e56ed8837d 66ea6516-edcf-4950-af93-966cc6bb9a96 -->
# Export to Image Feature (Client-Side)

We will implement a client-side image generation feature using `html-to-image` to export the current layout as a PNG image directly in the browser. This simplifies the architecture by removing the need for server-side rendering.

## Dependencies

- `html-to-image`: For converting the DOM node to a PNG image.

## Files

### 1. Logic: `utils/export.ts` (New)

- Implements `exportToPng(elementId: string, fileName: string)`.
- Uses `toPng` from `html-to-image`.
- Handles the creation of a download link.

### 2. UI: `app/page.tsx`

- Adds an "Export" button to the header.
- Renders a hidden, fixed-size (1200x630px) version of the `CoverPreview` specifically for export. This ensures the output image has the correct dimensions regardless of the responsive preview's current size.
- Implements `handleExport`:
- Validates that a screenshot exists in the layout.
- Calls `exportToPng` on the hidden export container.

## Implementation Steps

1. Install `html-to-image`.
2. Create `utils/export.ts`.
3. Update `app/page.tsx` to include the hidden export view and the export trigger.co

### To-dos

- [x] Install html-to-image
- [x] Create utils/export.ts
- [x] Update app/page.tsx with export button and logic