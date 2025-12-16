// Provider and hooks
export { AuthProvider, useAuth } from "./provider";

// Actions
export { signInWithEmail, signUpWithEmail, signOutUser, sendMagicLink } from "./actions";

// Types
export type { User, Session, AuthError, AuthResult, BrandProfile } from "./types";
