import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MapPin, Calendar, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const donationSchema = z.object({
  food_type: z.string().trim().min(1, 'Food type is required').max(100),
  quantity: z.string().trim().min(1, 'Quantity is required').max(50),
  description: z.string().trim().max(500).optional(),
  location: z.string().trim().min(1, 'Location is required').max(200),
  expiry_date: z.string().optional()
});

interface Donation {
  id: string;
  food_type: string;
  quantity: string;
  expiry_date: string | null;
  description: string | null;
  location: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    food_type: '',
    quantity: '',
    description: '',
    location: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserDonations();
      fetchAvailableDonations();
    }
  }, [user]);

  const fetchUserDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error: any) {
      toast.error('Failed to load your donations');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'available')
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableDonations(data || []);
    } catch (error: any) {
      toast.error('Failed to load available donations');
      console.error('Error:', error);
    }
  };

  const handleClaimDonation = async (donationId: string) => {
    setClaimingId(donationId);
    try {
      const { error: updateError } = await supabase
        .from('donations')
        .update({ status: 'claimed' })
        .eq('id', donationId);

      if (updateError) throw updateError;

      const { error: emailError } = await supabase.functions.invoke('send-donation-claimed-email', {
        body: { donationId },
      });

      if (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      toast.success('Donation claimed successfully! The donor has been notified.');
      setAvailableDonations(availableDonations.filter(d => d.id !== donationId));
    } catch (error: any) {
      toast.error('Failed to claim donation');
      console.error('Error claiming donation:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = donationSchema.parse(formData);

      if (editingDonation) {
        const { error } = await supabase
          .from('donations')
          .update({
            ...validated,
            expiry_date: validated.expiry_date || null
          })
          .eq('id', editingDonation.id);

        if (error) throw error;
        toast.success('Donation updated successfully');
      } else {
        const { error } = await supabase
          .from('donations')
          .insert([{
            food_type: validated.food_type,
            quantity: validated.quantity,
            description: validated.description || null,
            location: validated.location,
            expiry_date: validated.expiry_date || null,
            user_id: user?.id!
          }]);

        if (error) throw error;
        toast.success('Donation created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchUserDonations();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Failed to save donation');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donation?')) return;

    try {
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Donation deleted successfully');
      fetchUserDonations();
    } catch (error) {
      toast.error('Failed to delete donation');
    }
  };

  const openEditDialog = (donation: Donation) => {
    setEditingDonation(donation);
    setFormData({
      food_type: donation.food_type,
      quantity: donation.quantity,
      description: donation.description || '',
      location: donation.location,
      expiry_date: donation.expiry_date || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      food_type: '',
      quantity: '',
      description: '',
      location: '',
      expiry_date: ''
    });
    setEditingDonation(null);
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your donations and claim available food</p>
        </div>

        <Tabs defaultValue="my-donations" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="my-donations">My Donations</TabsTrigger>
            <TabsTrigger value="available">Available to Claim</TabsTrigger>
          </TabsList>

          <TabsContent value="my-donations">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">My Donations</h2>
                <p className="text-sm text-muted-foreground">Donations you've posted</p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Donation
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDonation ? 'Edit Donation' : 'Create New Donation'}</DialogTitle>
                <DialogDescription>
                  {editingDonation ? 'Update your donation details' : 'Add a new food donation to help those in need'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Food Type *</label>
                  <Input
                    placeholder="e.g., Rice, Vegetables, Canned goods"
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity *</label>
                  <Input
                    placeholder="e.g., 10 kg, 5 boxes"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <Input
                    placeholder="e.g., Nairobi, Karen"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <Textarea
                    placeholder="Additional details about the donation..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={500}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingDonation ? 'Update Donation' : 'Create Donation'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any donations yet.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Donation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <Card key={donation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{donation.food_type}</CardTitle>
                    <Badge variant={donation.status === 'available' ? 'default' : 'secondary'}>
                      {donation.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Package className="w-4 h-4" />
                    {donation.quantity}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {donation.description && (
                    <p className="text-sm text-muted-foreground">{donation.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {donation.location}
                  </div>

                  {donation.expiry_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Expires: {new Date(donation.expiry_date).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(donation)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(donation.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="available">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-1">Available Donations</h2>
              <p className="text-sm text-muted-foreground">Food donations available for claiming</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading available donations...</p>
              </div>
            ) : availableDonations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No donations available at the moment. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableDonations.map((donation) => (
                  <Card key={donation.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {donation.image_url && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={donation.image_url}
                          alt={donation.food_type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{donation.food_type}</CardTitle>
                        <Badge variant="secondary">{donation.status}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Package className="w-4 h-4" />
                        {donation.quantity}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {donation.description && (
                        <p className="text-sm text-muted-foreground">{donation.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {donation.location}
                      </div>

                      {donation.expiry_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Expires: {new Date(donation.expiry_date).toLocaleDateString()}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Posted {new Date(donation.created_at).toLocaleDateString()}
                      </div>

                      <Button 
                        onClick={() => handleClaimDonation(donation.id)}
                        disabled={claimingId === donation.id}
                        className="w-full mt-4"
                      >
                        {claimingId === donation.id ? 'Claiming...' : 'Claim Donation'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
