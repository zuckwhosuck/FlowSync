declare module "@/hooks/use-auth.jsx" {
  import { Context } from 'react';

  interface AuthContextProps {
    user: any;
    firebaseUser: any;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    logout: () => void;
  }

  const AuthContext: Context<AuthContextProps>;
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  export const useAuth: () => AuthContextProps;
}
