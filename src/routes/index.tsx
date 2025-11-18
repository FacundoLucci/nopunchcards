import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoIcon } from "@/components/LogoIcon";
import { ShoppingBag, Sparkles } from "lucide-react";

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
          <LogoIcon
            showWordmark
            size={32}
            wordmarkClassName="text-3xl md:text-4xl"
          />

          {/* Right side - Theme Toggle and Sign In */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" search={{ redirect: "/app" }}>
              <Button className="bg-transparent text-(--brand-primary) hover:bg-(--brand-primary) hover:text-white">
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
            The last loyalty program
            <br />
            humanity will ever need
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatic loyalty rewards for your business. No apps, no cards, no
            hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup" search={{ mode: "business" }}>
              <Button
                size="lg"
                className="bg-(--brand-primary) hover:bg-(--brand-primary-dark)-white px-8 h-14 text-lg"
              >
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
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-4/3 overflow-hidden border border-border">
                <img
                  src="/landing-linked-cards.png"
                  alt="Credit cards being connected via Plaid integration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* We track transactions */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-4/3 overflow-hidden border border-border">
                <img
                  src="/landing-analytics.png"
                  alt="Analytics dashboard showing transaction tracking"
                  className="w-full h-full object-cover"
                />
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
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-4/3 overflow-hidden border border-border">
                <img
                  src="/landing-program-setup.png"
                  alt="Business reward program configuration interface"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-4/3 overflow-hidden border border-border">
                <img
                  src="/landing-notifications.png"
                  alt="Smartphone displaying loyalty reward push notification"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-xl md:text-2xl">
              Customers get push notifications, email, or text when they earn a
              reward.
            </p>
          </div>

          {/* Redemption */}
          <div className="mb-12 grid md:grid-cols-2 gap-8 items-center">
            <p className="text-xl md:text-2xl order-2 md:order-1">
              Businesses verify rewards by scanning a QR code or entering a
              code.
            </p>
            <div className="order-1 md:order-2">
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-4/3 overflow-hidden border border-border">
                <img
                  src="/landing-qr-scan.png"
                  alt="QR code being scanned on smartphone for reward redemption"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Network effect */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-4/3 overflow-hidden border border-border">
                <img
                  src="/landing-network.png"
                  alt="Network visualization showing interconnected businesses and customers"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-xl md:text-2xl">
              Once in the network, customers are automatically enrolled at other
              stores.
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
                description:
                  "No iPads, no scanners, no point-of-sale integrations. Works with your existing payment processor.",
              },
              {
                title: "Set It and Forget It",
                description:
                  "Create your program once. Everything else happens automatically in the background.",
              },
              {
                title: "Automatic Customer Tracking",
                description:
                  "Know exactly who your best customers are without asking them to fill out forms.",
              },
              {
                title: "Network Effect",
                description:
                  "Your customers can discover you through Laso's network of participating businesses.",
              },
            ].map((benefit, idx) => (
              <Card key={idx} className="border-border">
                <CardContent className="pt-6">
                  <h4 className="text-xl font-semibold mb-3 text-(--brand-primary)">
                    {benefit.title}
                  </h4>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to grow your business?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of local businesses using Laso to increase customer
            loyalty.
          </p>
          <Link to="/signup" search={{ mode: "business" }}>
            <Button
              size="lg"
              className="bg-(--brand-primary) text-white hover:bg-(--brand-primary-dark) px-12 h-14 text-lg"
            >
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
            Laso is the automatic loyalty platform for small businesses. No apps
            to download, no punch cards to manage, no hardware to install.
            Create modern loyalty programs that work automatically when
            customers pay with their linked cards.
          </p>
          <h3>How Laso Works</h3>
          <ul>
            <li>
              Create Your Program - Set up a loyalty program in under 5 minutes
            </li>
            <li>Customers Shop Normally - They pay with their linked card</li>
            <li>
              Rewards Happen Automatically - We match transactions and notify
              customers
            </li>
          </ul>
          <h3>Benefits for Businesses</h3>
          <ul>
            <li>
              Zero Hardware Costs - No iPads, scanners, or POS integrations
              required
            </li>
            <li>Set It and Forget It - Everything happens automatically</li>
            <li>Automatic Customer Tracking - Know your best customers</li>
            <li>
              Network Effect - Customers discover you through our platform
            </li>
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

      {/* Floating Demo Shop Button */}
      <Link to="/demo-shop">
        <div className="fixed bottom-6 right-6 z-50 group">
          {/* Pulsing background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-75 blur-lg group-hover:opacity-100 animate-pulse" />
          
          {/* Main button */}
          <Button
            size="lg"
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Check out the demo shop!</span>
            <span className="sm:hidden">Demo Shop</span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </Button>
          
          {/* Floating badge */}
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
            NEW
          </div>
        </div>
      </Link>
    </div>
  );
}
