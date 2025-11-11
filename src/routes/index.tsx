import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="/NO PUNCH CARDS LOGO.png"
            alt="No Punch Cards Logo"
            className="h-10 w-auto mr-3"
          />
          <h1 className="text-2xl font-black text-white bg-[#F03D0C] rounded-md px-1.5 py-0"></h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" search={{ redirect: "/app" }}>
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Loyalty without the cards
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Automatic rewards every time you shop locally
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="flex-1">
                <Button size="lg" className="w-full h-14 text-lg">
                  Start Earning Rewards
                </Button>
              </Link>
              <Link
                to="/signup"
                search={{ mode: "business" }}
                className="flex-1"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg"
                >
                  I'm a Business Owner
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            {/* Placeholder for hero visual */}
            <div className="aspect-square bg-muted rounded-lg" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Link Your Card",
                description: "Securely connect the card you use most",
              },
              {
                step: "2",
                title: "Shop Local",
                description: "Visit participating businesses like normal",
              },
              {
                step: "3",
                title: "Earn Rewards",
                description: "Get rewarded automatically—no punch cards needed",
              },
            ].map((item) => (
              <Card key={item.step}>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>No Punch Cards © 2025</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
