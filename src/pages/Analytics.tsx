import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { TrendingUp, Package, CheckCircle, Calendar, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, ResponsiveContainer } from "recharts";

interface DonationStats {
  total: number;
  available: number;
  claimed: number;
  thisWeek: number;
  thisMonth: number;
}

interface MonthlyData {
  month: string;
  donations: number;
  claimed: number;
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DonationStats>({
    total: 0,
    available: 0,
    claimed: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all user donations
      const { data: donations, error } = await supabase
        .from('donations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!donations) return;

      // Calculate statistics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const total = donations.length;
      const available = donations.filter(d => d.status === 'available').length;
      const claimed = donations.filter(d => d.status === 'claimed').length;
      const thisWeek = donations.filter(d => new Date(d.created_at) >= oneWeekAgo).length;
      const thisMonth = donations.filter(d => new Date(d.created_at) >= oneMonthAgo).length;

      setStats({ total, available, claimed, thisWeek, thisMonth });

      // Calculate monthly data for charts
      const monthlyMap = new Map<string, { donations: number; claimed: number }>();
      
      donations.forEach(donation => {
        const date = new Date(donation.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { donations: 0, claimed: 0 });
        }
        
        const data = monthlyMap.get(monthKey)!;
        data.donations += 1;
        if (donation.status === 'claimed') {
          data.claimed += 1;
        }
      });

      // Convert to array and sort by date
      const monthlyArray = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .slice(0, 6)
        .reverse();

      setMonthlyData(monthlyArray);

    } catch (error: any) {
      toast.error('Failed to load analytics');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  const chartConfig = {
    donations: {
      label: "Donations",
      color: "hsl(var(--primary))",
    },
    claimed: {
      label: "Claimed",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics & Impact</h1>
          <p className="text-muted-foreground">Track your donation history and community impact</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time contributions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Claimed Donations</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">{stats.claimed}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully distributed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{stats.thisWeek}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recent contributions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.thisMonth}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly impact
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Impact Metrics Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Your Impact
                </CardTitle>
                <CardDescription>
                  See how your donations are making a difference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stats.claimed > 0 ? Math.round((stats.claimed / stats.total) * 100) : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Claim Rate</p>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/5 rounded-lg">
                    <div className="text-3xl font-bold text-secondary mb-2">
                      {stats.available}
                    </div>
                    <p className="text-sm text-muted-foreground">Available Now</p>
                  </div>
                  
                  <div className="text-center p-4 bg-accent/5 rounded-lg">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {stats.claimed}
                    </div>
                    <p className="text-sm text-muted-foreground">People Helped</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            {monthlyData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Donations Over Time
                    </CardTitle>
                    <CardDescription>
                      Monthly donation activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="donations"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Line Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Claimed vs Total
                    </CardTitle>
                    <CardDescription>
                      Track your impact trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="donations"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="claimed"
                            stroke="hsl(var(--secondary))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {monthlyData.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Start making donations to see your analytics and impact metrics!
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
