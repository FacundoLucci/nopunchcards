import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type React from "react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

// Declare Stripe buy button custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-buy-button": {
        "buy-button-id"?: string;
        "publishable-key"?: string;
        children?: React.ReactNode;
      };
    }
  }
}

export const Route = createFileRoute("/demo-shop")({
  component: DemoShop,
});

function DemoShop() {
  const [selectedImage, setSelectedImage] = useState("/product-main.png");
  const [isCreatingMockTransaction, setIsCreatingMockTransaction] =
    useState(false);

  const createMockTransaction = useMutation(
    api.consumer.mockTransaction.createMockTransaction
  );

  // Handle mock transaction creation
  const handleMockPurchase = async () => {
    setIsCreatingMockTransaction(true);
    try {
      const result = await createMockTransaction({
        merchantName: "FACUNDO",
        amount: 12999, // $129.99 for the shoes
      });

      if (result.success) {
        toast.success("Purchase successful! 🎉", {
          description:
            "Your transaction has been recorded and will be processed shortly.",
        });
      } else {
        toast.error("Purchase failed", {
          description: result.error || "Unable to create transaction",
        });
      }
    } catch (error) {
      toast.error("Purchase failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsCreatingMockTransaction(false);
    }
  };

  // Load Stripe buy button script and fonts
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    document.head.appendChild(script);

    // Load fonts: Fraunces for "Laso" and Permanent Marker for "Kicks"
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Permanent+Marker&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove script when component unmounts
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold flex items-baseline gap-2">
                <span
                  style={{ fontFamily: "Fraunces, serif", color: "#ff5c28" }}
                >
                  Laso
                </span>
                <span
                  style={{ fontFamily: "Permanent Marker, cursive" }}
                  className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Kicks
                </span>
              </h1>
              <nav className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Shop
                </a>
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  About
                </a>
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Contact
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Product Image Section */}
            <div className="space-y-4">
              <div className="aspect-square bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Main Product Image */}
                <img
                  src={selectedImage}
                  alt="Premium Running Shoes - Main View"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  "product-main.png",
                  "product-1.png",
                  "product-2.png",
                  "product-3.png",
                ].map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(`/${img}`)}
                    className={`aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all overflow-hidden ${
                      selectedImage === `/${img}` ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <img
                      src={`/${img}`}
                      alt={`Product view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Details Section */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Limited Edition
              </div>

              {/* Product Title */}
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3">
                  ReactiveRunner Pro
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Real-Time Performance Collection
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  4.9 (2,847 reviews)
                </span>
              </div>

              {/* Description */}
              <div className="prose dark:prose-invert">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Experience zero-latency response with our ReactiveRunner Pro.
                  Featuring full-stack comfort architecture and type-safe
                  traction technology, these shoes stay in sync with your every
                  move—from server-side heel support to seamless navigation
                  across any terrain.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Key Features:
                </h3>
                <ul className="space-y-2">
                  {[
                    "Real-time reactive sole™ with optimistic update cushioning",
                    "Stream-lined breathability for continuous data flow",
                    "Serverless construction—lightweight with infinite scalability",
                    "Type-safe traction system with native route-finding technology",
                    "Always-in-sync bilateral design for maximum uptime",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                    >
                      <svg
                        className="w-5 h-5 text-green-500 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buy Buttons */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                {/* Mock Transaction Button */}
                <div>
                  <Button
                    onClick={handleMockPurchase}
                    disabled={isCreatingMockTransaction}
                    className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {isCreatingMockTransaction ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Buy Now - $129.99
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Demo purchase - creates transaction without payment
                  </p>
                </div>

                {/* Stripe Buy Button */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">
                      Or pay with card
                    </span>
                  </div>
                </div>

                <stripe-buy-button
                  buy-button-id="buy_btn_1SUVCkBtlj0HI9KvjYQYPBuM"
                  publishable-key="pk_live_51LZzM3Btlj0HI9KvACZJYWuSUK84ZIzzm0sHP89469p7vHU9ubODJ2NL4Nh5yVe0JdVAQQWkpX9tcepfKvTO9rbg00cU376tDX"
                ></stripe-buy-button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-2xl mb-1">🚚</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Edge Deployment
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">↩️</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Rollback Guaranteed
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    End-to-End Encryption
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Product Info */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">
                Reactive Database Comfort
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Our proprietary real-time reactive cushioning system ensures
                your feet stay in perfect sync with every step—automatically
                optimizing comfort with zero-latency response.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">
                Full-Stack Performance
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Engineered with type-safe routing technology from heel to toe.
                Follow any path with confidence using our native navigation
                system that adapts to your stride in real-time.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-white">
                99.99% Uptime Guarantee
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Serverless architecture means unlimited scalability. Whether
                you're running a 5K or a marathon, these shoes deliver
                consistent performance with instant deployment to any terrain.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              <p>© 2025 Laso Kicks. All rights reserved.</p>
              <p className="mt-2">
                Built with full-stack footwear technology. Powered by real-time
                performance.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
