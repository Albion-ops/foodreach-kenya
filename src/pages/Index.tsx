import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroImage from '@/assets/hero-image.jpg';
import { Heart, Users, Package, Target } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroImage})`,
              filter: 'brightness(0.6)',
            }}
          />
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Together, We Can End Hunger in Kenya
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connect food donors with communities in need. Join our mission to achieve Zero Hunger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/donations">
                <Button size="lg" className="text-lg px-8">
                  View Donations
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white hover:bg-white/20">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How FoodReach Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple platform connecting those who can give with those who need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Donate Food</h3>
              <p className="text-muted-foreground">
                List your surplus food, relief resources, or fresh produce to help those in need in your community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Connect Communities</h3>
              <p className="text-muted-foreground">
                Bridge the gap between donors and recipients, ensuring food reaches those who need it most.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Zero Hunger</h3>
              <p className="text-muted-foreground">
                Work together towards SDG 2: ending hunger and achieving food security for all Kenyans.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <Heart className="w-16 h-16 text-white mx-auto mb-6 fill-white" />
            <h2 className="text-4xl font-bold text-white mb-6">
              Make a Difference Today
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Whether you have food to donate or know someone in need, your action can help end hunger in our communities.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Join FoodReach Kenya
              </Button>
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">10,000+</div>
              <p className="text-muted-foreground text-lg">Meals Donated</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground text-lg">Families Helped</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">50+</div>
              <p className="text-muted-foreground text-lg">Communities</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
