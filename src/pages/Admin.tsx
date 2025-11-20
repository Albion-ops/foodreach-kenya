import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Users, Package, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
  user_roles?: { role: string }[];
}

const Admin = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(true);

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
      fetchDonations();
      fetchProfiles();
    }
  }, [user, isAdmin]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          profiles!donations_user_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data as any || []);
    } catch (error: any) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user roles separately
      if (data) {
        const profilesWithRoles = await Promise.all(
          data.map(async (profile) => {
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);
            
            return {
              ...profile,
              user_roles: rolesData || []
            };
          })
        );
        setProfiles(profilesWithRoles);
      }
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'admin' }]);

      if (error) throw error;
      
      toast.success('User promoted to admin successfully');
      fetchProfiles();
    } catch (error: any) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user to admin');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
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
            {profilesLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>View and manage registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profiles.map((profile) => {
                      const isAdmin = profile.user_roles?.some(r => r.role === 'admin');
                      return (
                        <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{profile.full_name}</h3>
                              {isAdmin && (
                                <Badge variant="default">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {profile.phone && `${profile.phone} • `}
                              {profile.location || 'No location set'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined: {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!isAdmin && (
                            <Button 
                              onClick={() => promoteToAdmin(profile.id)}
                              size="sm"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Promote to Admin
                            </Button>
                          )}
                        </div>
                      );
                    })}
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
