import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import aboutImage from '@/assets/about-image.jpg';
import { Target, Users, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[400px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${aboutImage})`,
              filter: 'brightness(0.7)',
            }}
          />
          <div className="relative z-10 text-center text-white">
            <h1 className="text-5xl font-bold mb-4">About FoodReach Kenya</h1>
            <p className="text-xl">Supporting SDG 2: Zero Hunger</p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              FoodReach Kenya is dedicated to ending hunger in Kenya by connecting food donors with communities in need. 
              We work towards achieving Sustainable Development Goal 2 (Zero Hunger) through community-driven initiatives, 
              food donations, and relief support.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zero Hunger Goal</h3>
              <p className="text-muted-foreground">
                Working towards SDG 2 by ensuring no one goes hungry in our communities.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community First</h3>
              <p className="text-muted-foreground">
                Empowering local communities to support each other through collaborative efforts.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Compassion</h3>
              <p className="text-muted-foreground">
                Acting with empathy and care to ensure dignity and respect for all.
              </p>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-foreground mb-12">Our Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-background rounded-lg p-8 text-center shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                <p className="text-muted-foreground">Meals Provided</p>
              </div>
              <div className="bg-background rounded-lg p-8 text-center shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Families Supported</p>
              </div>
              <div className="bg-background rounded-lg p-8 text-center shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">50+</div>
                <p className="text-muted-foreground">Communities Reached</p>
              </div>
            </div>
          </div>
        </section>

        {/* SDG Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Sustainable Development Goal 2: Zero Hunger</h2>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              The United Nations' Sustainable Development Goal 2 aims to end hunger, achieve food security and improved 
              nutrition, and promote sustainable agriculture by 2030. FoodReach Kenya aligns with this global objective 
              by creating a platform that connects food resources with those who need them most.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Through technology and community engagement, we're building a sustainable solution to food insecurity in Kenya, 
              ensuring that no food goes to waste while no person goes hungry.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
