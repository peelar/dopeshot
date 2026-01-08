import { toast as sonnerToast } from "sonner";

/**
 * Toast utilities with consistent styling and behavior for dopeshot
 */
export const toast = {
  /**
   * Show a success message
   */
  success: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.success(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },

  /**
   * Show an error message with optional retry action
   */
  error: (
    message: string,
    options?: {
      description?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    },
  ) => {
    return sonnerToast.error(message, {
      duration: options?.duration ?? 5000,
      description: options?.description,
      action: options?.action,
    });
  },

  /**
   * Show a loading message that returns a dismiss function
   */
  loading: (message: string, options?: { description?: string }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    });
  },

  /**
   * Show an info message
   */
  info: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.info(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },

  /**
   * Show a warning message
   */
  warning: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.warning(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  /**
   * Handle async operations with automatic loading/success/error states
   */
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
  ) => {
    return sonnerToast.promise(promise, options);
  },
};
