import { useState, createContext, useContext, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, onAuthStateChange, signOut as firebaseSignOut } from "@/lib/firebase";

const AuthContext = createContext({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setIsLoading(true);
      if (authUser) {
        // User is signed in
        setFirebaseUser(authUser);
        setUser({
          id: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          firebaseUid: authUser.uid,
          role: "user", // Default role
        });
        toast({
          title: "Signed in",
          description: `Welcome to the CRM, ${authUser.displayName || authUser.email}!`,
        });
      } else {
        // User is signed out
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const signIn = async () => {
    // This function is no longer needed as sign-in is handled directly in the Login component
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await firebaseSignOut();
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });
    } catch (error) {
      console.error("Error signing out", error);
      toast({
        title: "Sign Out Error",
        description: "There was a problem signing out.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);