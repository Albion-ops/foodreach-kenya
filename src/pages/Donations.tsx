import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';

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

const Donations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error: any) {
      toast.error('Failed to load donations');
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">Available Donations</h1>
          <p className="text-xl text-muted-foreground">
            Browse food and relief resources available for those in need
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No donations available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Donations;
