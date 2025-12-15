# Asset Module

## Purpose

Handles file upload orchestration and metadata extraction for images. Processes uploaded files (screenshots, logos, backgrounds) through browser FileReader API, extracts color palettes and image dimensions, and produces Asset objects with complete metadata.

## File Structure

- `types.ts` - Data models for Asset, ColorPalette, and ImageMetadata
- `upload-orchestrator.ts` - Main upload flow orchestration with `processFileUpload()`
- `analyze-colors.ts` - Color palette extraction from images
- `get-image-metadata.ts` - Extracts dimensions, aspect ratio, and orientation
- `data-url.ts` - Utilities for data URL conversions and manipulation

## Key Exports

- `processFileUpload(file: File, kind)` - Main entry point that returns `UploadResult` with Asset and metadata
- `Asset` - Core data type with id, url, kind, colorPalette, metadata
- `ColorPalette` - Extracted colors (dominant, accent, muted, vibrant)
- `ImageMetadata` - Dimensions, aspect ratio, orientation
- `UploadResult` - Complete upload result with asset and computed aspect category

## Dependencies

- Imports from: `domain/layout/aspect` (for aspect ratio categorization), Browser FileReader API
- Used by: Upload UI components, asset management hooks
- External: Uses FileReader (browser-only)

## How It Works

1. **File Upload**: User selects file, passed to `processFileUpload()`
2. **Read File**: FileReader converts file to data URL (base64)
3. **Extract Metadata**: For screenshots, extracts dimensions and calculates aspect ratio
4. **Categorize Aspect**: Maps aspect ratio to category (portrait, landscape, square, ultrawide)
5. **Create Asset**: Generates Asset object with unique ID, data URL, and metadata
6. **Return Result**: Returns UploadResult with asset and computed aspect category

## Design Notes

- **Browser-dependent**: Uses FileReader API, requires browser environment
- **Async operations**: All file reading and metadata extraction is async
- **Playground mode**: Currently generates local IDs and uses "playground" project/user
- **Conditional metadata**: Only extracts full metadata for screenshots (not logos/backgrounds)
- **Data URL storage**: Images stored as data URLs (base64) for client-side playground mode
