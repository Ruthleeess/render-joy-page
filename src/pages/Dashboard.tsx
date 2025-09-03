import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Shield, Crown, UserMinus, Ban, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import UserManagement from '@/components/UserManagement';
import ModerationRequests from '@/components/ModerationRequests';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  username: string;
  created_at: string;
}

interface UserRole {
  role: 'owner' | 'moderator' | 'user';
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'moderator' | 'user' | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchUserProfile();
  }, [user, loading, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast({
          title: "Error",
          description: "Failed to fetch profile data",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // Fetch user role using type assertion
      const { data: roleData, error: roleError } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error('Role fetch error:', roleError);
        setUserRole('user'); // Default role
      } else {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'moderator':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'moderator':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20"
    >
      <motion.header 
        className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {userRole && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Badge className={`${getRoleColor(userRole)} text-white flex items-center space-x-1`}>
                  {getRoleIcon(userRole)}
                  <span className="capitalize">{userRole}</span>
                </Badge>
              </motion.div>
            )}
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Profile Card */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ y: -5 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {profile.full_name}</p>
                <p><strong>Username:</strong> @{profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> 
                  <Badge className={`ml-2 ${getRoleColor(userRole || 'user')} text-white`}>
                    {userRole || 'user'}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Features based on role */}
          {userRole === 'owner' && (
            <>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                whileHover={{ y: -5 }}
              >
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Owner Controls</span>
                  </CardTitle>
                  <CardDescription>Full administrative access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      You have full access to all features including user management, 
                      role assignments, and moderation requests approval.
                    </p>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </>
          )}

          {userRole === 'moderator' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileHover={{ y: -5 }}
            >
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Moderator Tools</span>
                </CardTitle>
                <CardDescription>Content moderation capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You can submit requests to ban or remove users. 
                    All actions require owner approval.
                  </p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}
        </motion.div>

        {/* User Management Section */}
        {(userRole === 'owner' || userRole === 'moderator') && (
          <motion.div 
            className="mt-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <UserManagement userRole={userRole} />
          </motion.div>
        )}

        {/* Moderation Requests Section */}
        {userRole === 'owner' && (
          <motion.div 
            className="mt-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <ModerationRequests />
          </motion.div>
        )}
      </main>
    </motion.div>
  );
};

export default Dashboard;