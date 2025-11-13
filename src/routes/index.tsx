import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { RefreshCcw, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

type UserType = "consumer" | "business" | null;

function LandingPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<UserType>(null);

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
    <div
      className={`min-h-screen relative ${
        !selectedType ? "overflow-hidden h-screen" : ""
      }`}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 py-6">
        <div className="flex items-center justify-between px-6">
          {/* Mode Switcher - Shows after selection on left */}
          <div className="w-32">
            {selectedType && (
              <button
                onClick={() =>
                  setSelectedType(
                    selectedType === "consumer" ? "business" : "consumer"
                  )
                }
                className={`inline-flex items-center gap-2 transition-colors duration-200 rounded-lg px-3 py-2 ${
                  selectedType === "consumer"
                    ? "bg-[#F03D0C] text-white hover:bg-[#D03609]"
                    : "bg-white/90 dark:bg-gray-900 text-[#F03D0C] dark:text-white hover:bg-white/80 dark:hover:bg-gray-800"
                }`}
              >
                <span className="font-medium text-sm">
                  {selectedType === "consumer" ? "Consumer" : "Business"}
                </span>
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Centered Logo */}
          <div className="flex items-center justify-center">
            <img
              src="/NO PUNCH CARDS LOGO.png"
              alt="No Punch Cards Logo"
              className="h-12 w-auto drop-shadow-lg"
            />
          </div>

          {/* Sign In button on right */}
          <div className="w-32 flex justify-end">
            <Link to="/login" search={{ redirect: "/app" }}>
              <Button
                className={`text-gray-900 dark:text-white ${
                  selectedType === "business"
                    ? "bg-white/90 hover:bg-white/80"
                    : "bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Split Screen Hero - Only show when no selection */}
      {!selectedType && (
        <div className="relative h-screen flex flex-col md:flex-row overflow-hidden">
          {/* Consumer Side - White with Red Text */}
          <div className="flex-1 bg-white dark:bg-gray-900 text-[#F03D0C] dark:text-[#F03D0C] flex items-center justify-center p-8 pt-24 md:p-12">
            <div className="max-w-md">
              <h2 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6">
                I'm a consumer, I buy things.
              </h2>
              <p className="hidden min-[390px]:block text-sm md:text-lg text-[#F03D0C]/80 dark:text-[#F03D0C]/70 mb-6 md:mb-8 italic">
                But also, I hate having to signup for a loyalty program over and
                over and over again. Don't even think about giving me a punch
                card.
              </p>
              <button
                onClick={() => setSelectedType("consumer")}
                className="w-full"
              >
                <div className="bg-[#F03D0C] border border-[#F03D0C] text-white hover:bg-[#D03609] transition-colors cursor-pointer rounded-lg p-6 shadow-lg flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <div className="text-white text-2xl md:text-3xl font-bold mb-2">
                      Find rewards
                    </div>
                    <div className="text-white/90 text-sm md:text-base font-normal">
                      And never sign up for a loyalty program again
                    </div>
                  </div>
                  <ArrowRight className="w-8 h-8 md:w-10 md:h-10 shrink-0 ml-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Business Side - Red with White Text */}
          <div className="flex-1 bg-[#F03D0C] text-white/90 flex items-center justify-center p-8 md:p-12">
            <div className="max-w-md">
              <h2 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6">
                I'm a seller, I sell stuff.
              </h2>
              <p className="hidden min-[390px]:block text-sm md:text-lg text-white/70 mb-6 md:mb-8 italic">
                Also, I don't have time or patience to manage yet another
                service let alone loyalty program. Plus, I've already got 10
                iPads at my register.
              </p>
              <button
                onClick={() => setSelectedType("business")}
                className="w-full"
              >
                <div className="bg-white/90 border border-white/90 text-[#F03D0C] hover:bg-white/80 transition-colors cursor-pointer rounded-lg p-6 shadow-lg flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <div className="text-[#F03D0C] text-2xl md:text-3xl font-bold mb-2">
                      Make more money
                    </div>
                    <div className="text-[#F03D0C]/80 text-sm md:text-base font-normal">
                      And see how universal loyalty works.
                    </div>
                  </div>
                  <ArrowRight className="w-8 h-8 md:w-10 md:h-10 shrink-0 ml-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consumer Content - Full page modal */}
      {selectedType === "consumer" && (
        <div className="min-h-screen bg-white dark:bg-gray-900 py-20 px-6 animate-in fade-in duration-500">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mt-12 mb-6 text-[#F03D0C]">
              Loyalty without the cards
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
              Automatic rewards every time you shop locally
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
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
                  description:
                    "Get rewarded automatically—no punch cards needed",
                },
              ].map((item) => (
                <Card
                  key={item.step}
                  className="border-[#F03D0C] dark:bg-gray-800 dark:border-[#F03D0C]"
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F03D0C] text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-[#F03D0C]">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mb-20">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-[#F03D0C] hover:bg-[#D03609] text-white px-12 h-14 text-lg"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Business Content - Full page modal */}
      {selectedType === "business" && (
        <div className="min-h-screen bg-[#F03D0C] py-20 px-6 animate-in fade-in duration-500">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mt-12 mb-6 text-white/90">
              Loyalty that runs itself
            </h2>
            <p className="text-xl text-center text-white/80 mb-12">
              No setup, no maintenance, no new hardware. Just happier customers.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  step: "1",
                  title: "Zero Setup",
                  description: "No iPads, no apps, no training required",
                },
                {
                  step: "2",
                  title: "Automatic",
                  description:
                    "Rewards happen behind the scenes when customers shop",
                },
                {
                  step: "3",
                  title: "Grow Sales",
                  description:
                    "Bring customers back more often without the work",
                },
              ].map((item) => (
                <Card key={item.step} className="bg-white/90">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F03D0C] text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-[#F03D0C]">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mb-20">
              <Link to="/signup" search={{ mode: "business" }}>
                <Button
                  size="lg"
                  className="bg-white/90 hover:bg-white/80 text-[#F03D0C] px-12 h-14 text-lg"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SEO Content - Hidden but rendered for crawlers */}
      <div className="sr-only">
        <section>
          <h2>For Consumers</h2>
          <p>
            I'm a consumer, I buy things. But also, I hate having to signup for
            a loyalty program over and over and over again. Don't even think
            about giving me a punch card.
          </p>
          <h3>Loyalty without the cards</h3>
          <p>Automatic rewards every time you shop locally</p>
          <ul>
            <li>Link Your Card - Securely connect the card you use most</li>
            <li>Shop Local - Visit participating businesses like normal</li>
            <li>
              Earn Rewards - Get rewarded automatically—no punch cards needed
            </li>
          </ul>
        </section>
        <section>
          <h2>For Businesses</h2>
          <p>
            I sell stuff. Also, I don't have time or patience to manage yet
            another service let alone loyalty program. I've already got 10 iPads
            at my register.
          </p>
          <h3>Loyalty that runs itself</h3>
          <p>
            No setup, no maintenance, no new hardware. Just happier customers.
          </p>
          <ul>
            <li>Zero Setup - No iPads, no apps, no training required</li>
            <li>
              Automatic - Rewards happen behind the scenes when customers shop
            </li>
            <li>
              Grow Sales - Bring customers back more often without the work
            </li>
          </ul>
        </section>
        <footer>
          <p>No Punch Cards © 2025</p>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </footer>
      </div>

      {/* Footer - Only show when a selection is made */}
      {selectedType && (
        <footer
          className={`py-8 px-6 border-t text-white ${
            selectedType === "consumer"
              ? "bg-gray-900 dark:bg-gray-950 border-gray-800 dark:border-gray-900"
              : "bg-gray-900 border-gray-800"
          }`}
        >
          <div className="max-w-7xl mx-auto text-center text-sm">
            <p>No Punch Cards © 2025</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-gray-300">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-300">
                Terms
              </a>
              <a href="#" className="hover:text-gray-300">
                Contact
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
