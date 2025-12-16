export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  user: User;
  expiresAt: Date;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResult {
  error?: AuthError;
  user?: User;
  session?: Session;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  name: string | null;
  color_palette: string[];
  typography: {
    heading: string;
    body: string;
  };
  logo_path: string | null;
  created_at: string;
  updated_at: string;
}
