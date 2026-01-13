export type Database = {
  public: {
    Tables: {
      user: {
        Row: {
          id: string;
          email: string | null;
          email_verified: boolean;
          name: string | null;
          image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          email_verified?: boolean;
          name?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          email_verified?: boolean;
          name?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
