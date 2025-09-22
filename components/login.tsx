"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/ui/shine-border";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, User, Lock, Users } from "lucide-react";
import { useUser } from "./user-context";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const { users, login, createUser } = useUser();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "create">("login");

  // Auto-switch to create mode if no users exist
  useEffect(() => {
    if (users.length === 0) {
      setMode("create");
    }
  }, [users.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      if (mode === "create") {
        const success = await createUser(name.trim(), password.trim());
        if (success) {
          const loginSuccess = await login(name.trim(), password.trim());
          if (loginSuccess) {
            onLogin();
          } else {
            setError("Failed to login after account creation");
          }
        } else {
          setError("User already exists. Please login instead.");
          setMode("login");
        }
      } else {
        const success = await login(name.trim(), password.trim());
        if (success) {
          onLogin();
        } else {
          setError("Invalid username or password");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "create" : "login");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="relative w-full max-w-md">
        <ShineBorder
          borderWidth={2}
          duration={8}
          shineColor={["#3b82f6", "#8b5cf6", "#06b6d4"]}
          className="rounded-2xl"
        />
        <Card className="relative bg-card/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {mode === "create" ? "Create Account" : "Welcome to LoRA"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === "create"
                ? "Create your account to get started"
                : "Enter your credentials to continue"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 bg-background/50 border-muted focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-background/50 border-muted focus:border-primary/50 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading || !name.trim() || !password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === "create" ? "Creating account..." : "Signing in..."}
                  </div>
                ) : (
                  mode === "create" ? "Create Account" : "Continue to LoRA"
                )}
              </Button>
            </form>

            {users.length > 0 && (
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={switchMode}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {mode === "login"
                    ? "Don't have an account? Create one"
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Your data stays local and secure • Offline AI
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}