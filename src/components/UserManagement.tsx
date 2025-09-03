import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Users, UserMinus, Ban, Crown, Shield, User as UserIcon } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  username: string;
  created_at: string;
  role?: 'owner' | 'moderator' | 'user';
}

interface UserManagementProps {
  userRole: 'owner' | 'moderator' | 'user';
}

const UserManagement = ({ userRole }: UserManagementProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'remove' | 'role_change'>('ban');
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'moderator'>('user');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles and roles separately for now
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      // Fetch roles for all users using raw query since types aren't updated
      const { data: rolesData, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine the data
      const usersWithRoles = profilesData?.map(profile => {
        const userRole = rolesData?.find((role: any) => role.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(usersWithRoles as UserProfile[]);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'moderator':
        return <Shield className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500 text-white';
      case 'moderator':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleAction = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);

    try {
      if (userRole === 'owner') {
        if (actionType === 'role_change') {
          // Owner can directly change roles
          const { error } = await (supabase as any)
            .from('user_roles')
            .update({ role: newRole })
            .eq('user_id', selectedUser.user_id);

          if (error) {
            toast({
              title: "Error",
              description: "Failed to update user role",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: `User role updated to ${newRole}`,
            });
            fetchUsers();
          }
        } else {
          // Owner can directly ban/remove users
          if (actionType === 'remove') {
            const { error } = await supabase.auth.admin.deleteUser(selectedUser.user_id);
            
            if (error) {
              toast({
                title: "Error",
                description: "Failed to remove user",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "User removed successfully",
              });
              fetchUsers();
            }
          }
        }
      } else if (userRole === 'moderator') {
        // Moderators need to create requests
        const { error } = await (supabase as any)
          .from('moderation_requests')
          .insert({
            target_user_id: selectedUser.user_id,
            action_type: actionType,
            reason: reason
          });

        if (error) {
          toast({
            title: "Error",
            description: "Failed to submit request",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Request Submitted",
            description: "Your moderation request has been sent to the owner for approval",
          });
        }
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowActionDialog(false);
      setSelectedUser(null);
      setReason('');
    }
  };

  const openActionDialog = (user: UserProfile, action: 'ban' | 'remove' | 'role_change') => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
          <CardDescription>
            {userRole === 'owner' ? 'Manage all users and their roles' : 'Submit moderation requests'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const role = user.role || 'user';
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`${getRoleColor(role)} flex items-center space-x-1 w-fit`}>
                        {getRoleIcon(role)}
                        <span className="capitalize">{role}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role !== 'owner' && (
                        <div className="flex space-x-2">
                          {userRole === 'owner' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openActionDialog(user, 'role_change')}
                              >
                                <Crown className="h-4 w-4 mr-1" />
                                Role
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(user, 'remove')}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </>
                          )}
                          {userRole === 'moderator' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openActionDialog(user, 'ban')}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban Request
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(user, 'remove')}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Remove Request
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'role_change' ? 'Change User Role' : 
               userRole === 'owner' ? 
                 (actionType === 'ban' ? 'Ban User' : 'Remove User') :
                 `Submit ${actionType === 'ban' ? 'Ban' : 'Remove'} Request`
              }
            </DialogTitle>
            <DialogDescription>
              {actionType === 'role_change' ? 
                'Select a new role for this user.' :
                userRole === 'owner' ? 
                  'This action cannot be undone.' :
                  'Submit a request to the owner for approval.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedUser && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
              </div>
            )}

            {actionType === 'role_change' ? (
              <div className="space-y-2">
                <Label htmlFor="role">New Role</Label>
                <Select value={newRole} onValueChange={(value: 'user' | 'moderator') => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason {userRole === 'moderator' ? '(Required)' : '(Optional)'}</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain the reason for this action..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required={userRole === 'moderator'}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={actionLoading || (userRole === 'moderator' && actionType !== 'role_change' && !reason.trim())}
              variant={actionType === 'remove' ? 'destructive' : 'default'}
            >
              {actionLoading ? 'Processing...' : 
               actionType === 'role_change' ? 'Update Role' :
               userRole === 'owner' ? (actionType === 'ban' ? 'Ban User' : 'Remove User') :
               'Submit Request'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;