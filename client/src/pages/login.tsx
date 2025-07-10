import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, signInWithEmailPassword, auth } from "@/lib/firebase";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  
  // Extract redirect URL from query params if present
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect') || '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    try {
      setLoggingIn(true);
      await signInWithGoogle();
      // Redirect handled by the useEffect
    } catch (error) {
      console.error("Login error:", error);
      setLoggingIn(false);
      toast({
        title: "Sign In Error",
        description: "There was a problem signing in with Google.",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async () => {
    try {
      setLoggingIn(true);
      // Check if email exists
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
       
        setLoggingIn(false);
      }
      await signInWithEmailPassword(email, password);
      // Redirect handled by the useEffect
    }  catch (error) {
      console.error("Login error:", error);
      setLoggingIn(false);
      toast({
        title: "Sign In Error",
        description: "There was a problem signing in.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="w-8 h-8 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">FlowSync</CardTitle>
          <CardDescription>
            Sign in to access your CRM dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <img 
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain-wordmark.svg" 
                alt="Firebase Authentication" 
                className="h-12 w-auto mx-auto mb-4"
              />
              <p className="text-sm text-neutral-600 mb-6">
                Secure authentication powered by Firebase
              </p>
            </div>

            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              <Button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center"
                size="lg"
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
            
            <Button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center"
              size="lg"
              disabled={loggingIn}
            >
              {loggingIn ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-5 w-5 mr-2" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Sign in with Google
                </span>
              )}
            </Button>
            <div className="text-center">
              <Link href="/signup" className="text-sm text-neutral-600 hover:text-neutral-800">
                Don't have an account? Sign up
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-neutral-600">
            By signing in, you agree to our terms of service and privacy policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
