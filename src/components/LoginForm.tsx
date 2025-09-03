import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ChevronUp } from "lucide-react";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      console.log("Login attempted with:", { email, password });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card backdrop-blur-sm border-border shadow-card animate-fade-in">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 p-4 rounded-full bg-primary/10 w-fit animate-glow">
            <ChevronUp className="h-8 w-8 text-primary transform rotate-45" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            Log in to mail
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Access your email account securely
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary transition-all duration-300 focus:shadow-glow"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary transition-all duration-300 focus:shadow-glow"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-glow animate-slide-up"
              style={{ animationDelay: '0.3s' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                "Connect to email"
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '0.4s' }}>
              By continuing you agree to our{" "}
              <a href="#" className="text-primary hover:underline transition-colors">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline transition-colors">
                Privacy
              </a>
              .
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;