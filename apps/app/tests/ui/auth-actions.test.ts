import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithGoogle } from '@/lib/auth/actions';
import * as authClient from '@/lib/auth/auth-client';
import * as analytics from '@/lib/analytics';

// Mock the auth client
vi.mock('@/lib/auth/auth-client', () => ({
  signIn: {
    social: vi.fn(),
  },
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

describe('Google OAuth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should track auth attempt with google method', async () => {
      const mockSocial = vi.fn().mockResolvedValue({});
      (authClient.signIn as any).social = mockSocial;

      await signInWithGoogle();

      expect(analytics.track).toHaveBeenCalledWith('auth_attempt', {
        method: 'google',
      });
    });

    it('should call signIn.social with correct parameters', async () => {
      const mockSocial = vi.fn().mockResolvedValue({});
      (authClient.signIn as any).social = mockSocial;

      await signInWithGoogle();

      expect(mockSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/auth',
      });
    });

    it('should return empty result on success', async () => {
      const mockSocial = vi.fn().mockResolvedValue({});
      (authClient.signIn as any).social = mockSocial;

      const result = await signInWithGoogle();

      expect(result).toEqual({});
    });

    it('should handle errors and track them', async () => {
      const error = new Error('OAuth failed');
      const mockSocial = vi.fn().mockRejectedValue(error);
      (authClient.signIn as any).social = mockSocial;

      const result = await signInWithGoogle();

      expect(analytics.track).toHaveBeenCalledWith('auth_sign_in_error', {
        error: 'OAuth failed',
        method: 'google',
      });
      expect(result.error).toEqual({ message: 'OAuth failed' });
    });

    it('should handle non-Error exceptions', async () => {
      const mockSocial = vi.fn().mockRejectedValue('String error');
      (authClient.signIn as any).social = mockSocial;

      const result = await signInWithGoogle();

      expect(result.error).toEqual({
        message: 'Failed to sign in with Google',
      });
      expect(analytics.track).toHaveBeenCalledWith('auth_sign_in_error', {
        error: 'Failed to sign in with Google',
        method: 'google',
      });
    });
  });
});
