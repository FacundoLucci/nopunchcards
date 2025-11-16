import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Detect if the app is running in standalone mode (saved to home screen)
    const isStandalone =
      // iOS Safari
      (window.navigator as any).standalone ||
      // Other browsers supporting display-mode
      window.matchMedia("(display-mode: standalone)").matches;

    // If in standalone mode, redirect to login
    if (isStandalone) {
      navigate({ to: "/login", search: { redirect: "/app" } });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-6 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
          {/* Logo */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#F03D0C]">Laso</h1>

          {/* Right side - Theme Toggle and Sign In */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" search={{ redirect: "/app" }}>
              <Button className="bg-transparent text-[#F03D0C] hover:bg-[#F03D0C] hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Business Focused */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            The last loyalty program<br />humanity will ever need
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatic loyalty rewards for your business. No apps, no cards, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup" search={{ mode: "business" }}>
              <Button size="lg" className="bg-[#F03D0C] hover:bg-[#D03609] text-white px-8 h-14 text-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h3>

          {/* Customers link cards */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <p className="text-xl md:text-2xl order-2 md:order-1">
              Customers link their credit cards via Plaid.
            </p>
            <div className="order-1 md:order-2">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">💳</div>
                  <p className="text-sm text-muted-foreground">Linked cards</p>
                </div>
              </div>
            </div>
          </div>

          {/* We track transactions */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm text-muted-foreground">Transaction tracking</p>
                </div>
              </div>
            </div>
            <p className="text-xl md:text-2xl">
              We track their transactions and automatically reward them.
            </p>
          </div>

          {/* Businesses set rules */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <p className="text-xl md:text-2xl order-2 md:order-1">
              Businesses create rewards based on visits or total spend.
            </p>
            <div className="order-1 md:order-2">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-sm text-muted-foreground">Program setup</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                </div>
              </div>
            </div>
            <p className="text-xl md:text-2xl">
              Customers get push notifications, email, or text when they earn a reward.
            </p>
          </div>

          {/* Redemption */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <p className="text-xl md:text-2xl order-2 md:order-1">
              Businesses verify rewards by scanning a QR code or entering a code.
            </p>
            <div className="order-1 md:order-2">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm text-muted-foreground">QR redemption</p>
                </div>
              </div>
            </div>
          </div>

          {/* Network effect */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <div className="text-4xl mb-2">🌐</div>
                  <p className="text-sm text-muted-foreground">Network growth</p>
                </div>
              </div>
            </div>
            <p className="text-xl md:text-2xl">
              Once in the network, customers are automatically enrolled at other stores.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Businesses Choose Laso
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Zero Hardware Costs",
                description: "No iPads, no scanners, no point-of-sale integrations. Works with your existing payment processor.",
              },
              {
                title: "Set It and Forget It",
                description: "Create your program once. Everything else happens automatically in the background.",
              },
              {
                title: "Automatic Customer Tracking",
                description: "Know exactly who your best customers are without asking them to fill out forms.",
              },
              {
                title: "Network Effect",
                description: "Your customers can discover you through Laso's network of participating businesses.",
              },
            ].map((benefit, idx) => (
              <Card key={idx} className="border-border">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-semibold mb-3 text-[#F03D0C]">
                    {benefit.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-[#F03D0C]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to grow your business?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of local businesses using Laso to increase customer loyalty.
          </p>
          <Link to="/signup" search={{ mode: "business" }}>
            <Button size="lg" className="bg-white text-[#F03D0C] hover:bg-white/90 px-12 h-14 text-lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* SEO Content - Hidden but rendered for crawlers */}
      <div className="sr-only">
        <section>
          <h1>Laso - The Last Loyalty Program Humanity Will Ever Need</h1>
          <h2>Automatic Loyalty Rewards for Local Businesses</h2>
          <p>
            Laso is the automatic loyalty platform for small businesses. No apps to download,
            no punch cards to manage, no hardware to install. Create modern loyalty programs
            that work automatically when customers pay with their linked cards.
          </p>
          <h3>How Laso Works</h3>
          <ul>
            <li>Create Your Program - Set up a loyalty program in under 5 minutes</li>
            <li>Customers Shop Normally - They pay with their linked card</li>
            <li>Rewards Happen Automatically - We match transactions and notify customers</li>
          </ul>
          <h3>Benefits for Businesses</h3>
          <ul>
            <li>Zero Hardware Costs - No iPads, scanners, or POS integrations required</li>
            <li>Set It and Forget It - Everything happens automatically</li>
            <li>Automatic Customer Tracking - Know your best customers</li>
            <li>Network Effect - Customers discover you through our platform</li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 bg-background">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>Laso © 2025</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
