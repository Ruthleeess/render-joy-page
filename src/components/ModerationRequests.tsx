import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Shield, Eye } from 'lucide-react';

interface ModerationRequest {
  id: string;
  action_type: 'ban' | 'remove';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  target_user_id: string;
  requester_id: string;
  target_user?: {
    full_name: string;
    username: string;
    email: string;
  };
  requester?: {
    full_name: string;
    username: string;
  };
}

const ModerationRequests = () => {
  const [requests, setRequests] = useState<ModerationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ModerationRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Fetch moderation requests using type assertion
      const { data, error } = await (supabase as any)
        .from('moderation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: "Error",
          description: "Failed to fetch moderation requests",
          variant: "destructive",
        });
        return;
      }

      // Fetch user profiles for target and requester
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request: any) => {
          const [targetUser, requester] = await Promise.all([
            supabase.from('profiles').select('full_name, username, email').eq('user_id', request.target_user_id).single(),
            supabase.from('profiles').select('full_name, username').eq('user_id', request.requester_id).single()
          ]);

          return {
            ...request,
            target_user: targetUser.data || { full_name: 'Unknown', username: 'unknown', email: 'unknown' },
            requester: requester.data || { full_name: 'Unknown', username: 'unknown' }
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setActionLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('moderation_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to ${action} request`,
          variant: "destructive",
        });
        return;
      }

      // If approved and it's a remove request, actually remove the user
      if (action === 'approved' && selectedRequest?.action_type === 'remove') {
        const targetUserId = selectedRequest.target_user_id;
        if (targetUserId) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
          if (deleteError) {
            console.error('Error deleting user:', deleteError);
            toast({
              title: "Warning",
              description: "Request approved but user deletion failed",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Success",
        description: `Request ${action} successfully`,
      });

      fetchRequests();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const showRequestDetail = (request: ModerationRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moderation Requests</CardTitle>
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
            <Shield className="h-5 w-5" />
            <span>Moderation Requests</span>
          </CardTitle>
          <CardDescription>
            Review and approve or reject moderation requests from moderators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No moderation requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.target_user?.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{request.target_user?.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {request.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.requester?.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{request.requester?.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(request.status)} flex items-center space-x-1 w-fit`}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showRequestDetail(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Moderation Request Details</DialogTitle>
            <DialogDescription>
              Review the details and take action on this request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-sm font-medium">Target User:</p>
                  <p>{selectedRequest.target_user?.full_name} (@{selectedRequest.target_user?.username})</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Requested by:</p>
                  <p>{selectedRequest.requester?.full_name} (@{selectedRequest.requester?.username})</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Action:</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedRequest.action_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  <Badge className={`${getStatusColor(selectedRequest.status)} flex items-center space-x-1 w-fit`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="capitalize">{selectedRequest.status}</span>
                  </Badge>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <p className="text-sm font-medium mb-2">Reason:</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{selectedRequest.reason}</p>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Submitted on: {new Date(selectedRequest.created_at).toLocaleString()}
              </div>

              {selectedRequest.reviewed_at && (
                <div className="text-sm text-muted-foreground">
                  Reviewed on: {new Date(selectedRequest.reviewed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleRequestAction(selectedRequest.id, 'rejected')}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {actionLoading ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleRequestAction(selectedRequest.id, 'approved')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {actionLoading ? 'Processing...' : 'Approve'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModerationRequests;