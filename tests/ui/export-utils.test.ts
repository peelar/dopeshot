import { describe, it, expect } from 'vitest';
import { calculatePixelRatio, getExportDimensions } from '@/domain/layout/export';

describe('Export Utilities', () => {
  describe('calculatePixelRatio', () => {
    it('defaults to device pixel ratio or 2 (whichever is higher)', () => {
      expect(calculatePixelRatio({ devicePixelRatio: 1 })).toBe(2);
      expect(calculatePixelRatio({ devicePixelRatio: 2 })).toBe(2);
      expect(calculatePixelRatio({ devicePixelRatio: 3 })).toBe(3);
    });

    it('respects maxImageScale upper bound', () => {
      expect(
        calculatePixelRatio({ maxImageScale: 1.5, devicePixelRatio: 3 })
      ).toBe(1.5);

      expect(
        calculatePixelRatio({ maxImageScale: 2.5, devicePixelRatio: 3 })
      ).toBe(2.5);
    });

    it('clamps to minimum of 1', () => {
      expect(
        calculatePixelRatio({ desiredPixelRatio: 0.5, devicePixelRatio: 0.5 })
      ).toBe(1);
    });

    it('clamps to maximum of 3', () => {
      expect(
        calculatePixelRatio({ desiredPixelRatio: 10, devicePixelRatio: 10 })
      ).toBe(3);
    });

    it('allows custom desiredPixelRatio within bounds', () => {
      expect(
        calculatePixelRatio({ desiredPixelRatio: 2.5, devicePixelRatio: 1 })
      ).toBe(2.5);
    });

    it('handles infinite maxImageScale gracefully', () => {
      expect(
        calculatePixelRatio({ maxImageScale: Infinity, devicePixelRatio: 3 })
      ).toBe(3);
    });

    it('handles NaN maxImageScale gracefully', () => {
      expect(
        calculatePixelRatio({ maxImageScale: NaN, devicePixelRatio: 3 })
      ).toBe(3);
    });
  });

  describe('getExportDimensions', () => {
    it('returns 1920×1080 for desktop orientation', () => {
      const dims = getExportDimensions('desktop');
      expect(dims).toEqual({ width: 1920, height: 1080 });
    });

    it('returns 1080×1920 for mobile orientation', () => {
      const dims = getExportDimensions('mobile');
      expect(dims).toEqual({ width: 1080, height: 1920 });
    });

    it('maintains 16:9 aspect ratio for desktop', () => {
      const dims = getExportDimensions('desktop');
      const aspectRatio = dims.width / dims.height;
      expect(aspectRatio).toBeCloseTo(16 / 9, 5);
    });

    it('maintains 9:16 aspect ratio for mobile', () => {
      const dims = getExportDimensions('mobile');
      const aspectRatio = dims.width / dims.height;
      expect(aspectRatio).toBeCloseTo(9 / 16, 5);
    });
  });
});
