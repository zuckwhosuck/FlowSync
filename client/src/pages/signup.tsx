import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithEmailPassword, signUpWithEmailPassword } from "@/lib/firebase";

export default function Signup() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [signingUp, setSigningUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSignUp = async () => {
    try {
      setSigningUp(true);
      await signUpWithEmailPassword(email, password, name);
      // Automatically sign in after successful signup
      await signInWithEmailPassword(email, password);
      // Redirect to dashboard after successful signup and signin
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error);
      setSigningUp(false);
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
            Create an account to access your CRM dashboard
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

            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
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
              onClick={handleSignUp}
              className="w-full flex items-center justify-center"
              size="lg"
              disabled={signingUp}
            >
              {signingUp ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Signing up...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-800">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-neutral-600">
            By signing up, you agree to our terms of service and privacy policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
