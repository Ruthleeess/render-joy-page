import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4"
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.div 
          className="space-y-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to Our Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A secure platform with role-based access control featuring Owner, Moderator, and User roles.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span>Owner</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full administrative access with user management, role assignments, and approval of moderation requests.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Moderator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Content moderation capabilities with the ability to submit ban and removal requests for owner approval.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span>User</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Standard user access with basic platform features and personal account management.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div 
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-3"
            >
              Get Started
            </Button>
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Already have an account? Click "Get Started" to sign in.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Index;
