import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { useEffect } from "react";
import { validateBackgroundFile, sanitizeFileExtension } from '@/app/api/background/utils';
import { useBackgroundUpload } from "@/hooks/use-background-upload";

describe('Background Upload Validation', () => {
  describe('validateBackgroundFile', () => {
    it('accepts files within size limit', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.png', { type: 'image/png' }); // 1MB
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts files at exactly 5MB', () => {
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.png', { type: 'image/png' }); // Exactly 5MB
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects files over 5MB (T018)', () => {
      const file = new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'test.png', { type: 'image/png' }); // 5MB + 1 byte
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('rejects files far exceeding 5MB (T018)', () => {
      const file = new File(['x'.repeat(10 * 1024 * 1024)], 'test.png', { type: 'image/png' }); // 10MB
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('accepts valid PNG files', () => {
      const file = new File(['data'], 'test.png', { type: 'image/png' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid JPG files', () => {
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid WEBP files', () => {
      const file = new File(['data'], 'test.webp', { type: 'image/webp' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts valid SVG files', () => {
      const file = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects PDF files (T019)', () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Supported');
    });

    it('rejects GIF files (T019)', () => {
      const file = new File(['data'], 'test.gif', { type: 'image/gif' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Supported');
    });

    it('rejects BMP files (T019)', () => {
      const file = new File(['data'], 'test.bmp', { type: 'image/bmp' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Supported');
    });

    it('rejects video files (T019)', () => {
      const file = new File(['data'], 'test.mp4', { type: 'video/mp4' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Supported');
    });

    it('rejects text files (T019)', () => {
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      const result = validateBackgroundFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Supported');
    });

    it('provides clear error messages for invalid types', () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const result = validateBackgroundFile(file);
      expect(result.error).toMatch(/PNG|JPG|WEBP|SVG/);
    });

    it('handles empty files gracefully', () => {
      const file = new File([], 'test.png', { type: 'image/png' });
      const result = validateBackgroundFile(file);
      // Empty file might be valid or invalid depending on requirements
      // This test documents the behavior
      expect(result).toHaveProperty('valid');
    });
  });

  describe('sanitizeFileExtension', () => {
    it('normalizes file extensions to lowercase', () => {
      expect(sanitizeFileExtension('test.PNG')).toBe('test.png');
      expect(sanitizeFileExtension('file.JPG')).toBe('file.jpg');
      expect(sanitizeFileExtension('image.WEBP')).toBe('image.webp');
    });

    it('preserves already lowercase extensions', () => {
      expect(sanitizeFileExtension('test.png')).toBe('test.png');
      expect(sanitizeFileExtension('file.jpg')).toBe('file.jpg');
    });

    it('handles files with no extension', () => {
      expect(sanitizeFileExtension('test')).toBe('test');
    });

    it('handles files with multiple dots', () => {
      expect(sanitizeFileExtension('my.file.name.png')).toBe('my.file.name.png');
    });
  });
});

describe("Background Upload Hook", () => {
  it("surfaces duplicate filename errors from the API (T038)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'A background named "dup.png" already exists.' }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["data"], "dup.png", { type: "image/png" });

    function UploadHarness() {
      const { upload, error } = useBackgroundUpload();

      useEffect(() => {
        void upload(file);
      }, [upload]);

      return <div data-testid="upload-error">{error ?? ""}</div>;
    }

    const store = createStore();
    render(
      <Provider store={store}>
        <UploadHarness />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("upload-error").textContent).toContain("already exists");
    });

    vi.unstubAllGlobals();
  });
});
