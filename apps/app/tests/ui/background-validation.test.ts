import { describe, it, expect } from 'vitest';
import { sanitizeFilename, validateFileType } from '@/domain/background/validation';

describe('Background Validation', () => {
  describe('sanitizeFilename', () => {
    it('preserves valid filenames', () => {
      expect(sanitizeFilename('sunset-gradient.png')).toBe('sunset-gradient.png');
      expect(sanitizeFilename('background_01.jpg')).toBe('background_01.jpg');
      expect(sanitizeFilename('MyBackground.webp')).toBe('MyBackground.webp');
    });

    it('removes path traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('system32');
      expect(sanitizeFilename('test/../file.png')).toBe('file.png');
    });

    it('removes special characters that could cause issues', () => {
      expect(sanitizeFilename('file<>name.png')).toBe('filename.png');
      expect(sanitizeFilename('file|name.png')).toBe('filename.png');
      expect(sanitizeFilename('file:name.png')).toBe('filename.png');
    });

    it('preserves extension while sanitizing', () => {
      expect(sanitizeFilename('my file.png')).toBe('my-file.png');
      expect(sanitizeFilename('file   name.jpg')).toBe('file-name.jpg');
    });

    it('handles empty or whitespace-only filenames', () => {
      expect(sanitizeFilename('')).toBe('untitled');
      expect(sanitizeFilename('   ')).toBe('untitled');
      expect(sanitizeFilename('\t\n')).toBe('untitled');
    });

    it('handles filenames with no extension', () => {
      expect(sanitizeFilename('myfile')).toBe('myfile');
      expect(sanitizeFilename('test-background')).toBe('test-background');
    });

    it('limits filename length', () => {
      const longName = 'a'.repeat(300) + '.png';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.png')).toBe(true);
    });

    it('handles unicode characters appropriately', () => {
      expect(sanitizeFilename('背景图.png')).toBe('背景图.png');
      expect(sanitizeFilename('émojis-😀.png')).toBe('émojis-😀.png');
    });
  });

  describe('validateFileType', () => {
    it('accepts valid image types', () => {
      expect(validateFileType('image/png')).toBe(true);
      expect(validateFileType('image/jpeg')).toBe(true);
      expect(validateFileType('image/jpg')).toBe(true);
      expect(validateFileType('image/webp')).toBe(true);
      expect(validateFileType('image/svg+xml')).toBe(true);
    });

    it('rejects invalid image types', () => {
      expect(validateFileType('image/gif')).toBe(false);
      expect(validateFileType('image/bmp')).toBe(false);
      expect(validateFileType('image/tiff')).toBe(false);
    });

    it('rejects non-image types', () => {
      expect(validateFileType('application/pdf')).toBe(false);
      expect(validateFileType('text/plain')).toBe(false);
      expect(validateFileType('application/json')).toBe(false);
      expect(validateFileType('video/mp4')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(validateFileType('IMAGE/PNG')).toBe(true);
      expect(validateFileType('Image/Jpeg')).toBe(true);
    });

    it('handles undefined or empty MIME types', () => {
      expect(validateFileType('')).toBe(false);
      expect(validateFileType(undefined as any)).toBe(false);
    });
  });
});
