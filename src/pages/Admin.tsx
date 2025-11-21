import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Package, TrendingUp, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Donation {
  id: string;
  food_type: string;
  quantity: string;
  location: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  created_at: string;
  isAdmin?: boolean;
}

const Admin = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalUsers: 0,
    availableDonations: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch donations with user info
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select(`
          *,
          profiles!donations_user_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (donationsError) throw donationsError;
      setDonations(donationsData as any || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch user roles to check who is admin
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map users with admin status
      const usersWithRoles = usersData?.map(user => ({
        ...user,
        isAdmin: rolesData?.some(role => role.user_id === user.id && role.role === 'admin')
      })) || [];

      setUsers(usersWithRoles);

      // Calculate stats
      setStats({
        totalDonations: donationsData?.length || 0,
        totalUsers: usersData?.length || 0,
        availableDonations: donationsData?.filter(d => d.status === 'available').length || 0
      });
    } catch (error: any) {
      toast.error('Failed to load admin data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      toast.success('User promoted to admin successfully');
      fetchData(); // Refresh the data
    } catch (error: any) {
      toast.error('Failed to promote user to admin');
      console.error('Error:', error);
    }
  };

  if (authLoading || !user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage donations and users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDonations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Donations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableDonations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="donations" className="w-full">
          <TabsList>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="donations" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading donations...</p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Donations</CardTitle>
                  <CardDescription>View and manage all donations in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{donation.food_type}</h3>
                            <Badge variant={donation.status === 'available' ? 'default' : 'secondary'}>
                              {donation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {donation.quantity} • {donation.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {donation.profiles?.full_name || 'Unknown'} • {new Date(donation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>View all registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{user.full_name}</h3>
                            {user.isAdmin && (
                              <Badge variant="default" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.phone && `${user.phone} • `}
                            {user.location || 'No location set'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!user.isAdmin && (
                          <Button 
                            onClick={() => promoteToAdmin(user.id)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Promote to Admin
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
