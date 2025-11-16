import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { useCustomer, usePricingTable } from "autumn-js/react";

export const Route = createFileRoute("/_authenticated/upgrade")({
  component: UpgradePage,
});

function UpgradePage() {
  const navigate = useNavigate();

  // Use Autumn's React hooks directly (per official docs)
  const { products, isLoading, error } = usePricingTable();
  const { customer, checkout, attach } = useCustomer();

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [checkoutPreview, setCheckoutPreview] = useState<any>(null);

  const handleUpgrade = async (productId: string) => {
    setIsProcessing(true);
    setSelectedProduct(productId);

    try {
      // Use Autumn's checkout hook (per official docs)
      const { data, error } = await checkout({ productId });

      if (error) {
        toast.error(error.message || "Failed to initiate checkout");
        setIsProcessing(false);
        setSelectedProduct(null);
        return;
      }

      if (data?.url) {
        // Redirect to Stripe checkout for new payment
        window.location.href = data.url;
      } else if ((data as any)?.preview) {
        // Show confirmation dialog for upgrades/downgrades
        setCheckoutPreview((data as any).preview);
        setShowDialog(true);
        setIsProcessing(false);
      } else {
        // No preview means direct attach
        await handleConfirmCheckout(productId);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process checkout");
      setIsProcessing(false);
      setSelectedProduct(null);
    }
  };

  const handleConfirmCheckout = async (productId?: string) => {
    const targetProductId = productId || selectedProduct;
    if (!targetProductId) return;

    setIsProcessing(true);
    try {
      // Use Autumn's attach hook (per official docs)
      const { error } = await attach({ productId: targetProductId });

      if (error) {
        toast.error(error.message || "Failed to update subscription");
      } else {
        toast.success("Subscription updated successfully!");
        setShowDialog(false);
        navigate({ to: "/account", hash: "subscription" });
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      toast.error("Failed to confirm subscription");
    } finally {
      setIsProcessing(false);
      setSelectedProduct(null);
      setCheckoutPreview(null);
    }
  };

  const getButtonText = (product: any) => {
    const { scenario } = product;

    if (scenario === "active") {
      return "Current Plan";
    } else if (scenario === "upgrade") {
      return "Upgrade";
    } else if (scenario === "downgrade") {
      return "Downgrade";
    } else if (scenario === "scheduled") {
      return "Plan Scheduled";
    } else if (scenario === "renew") {
      return "Renew";
    } else if (scenario === "cancel") {
      return "Downgrade";
    }
    return "Get Started";
  };

  const getPrice = (product: any) => {
    const priceItem = product.items?.find((item: any) => item.type === "price");
    if (!priceItem) return null;

    const price = priceItem.price;
    const interval = priceItem.interval;

    return {
      amount: price,
      interval: interval,
    };
  };

  const getFeatures = (product: any) => {
    return (
      product.items?.filter(
        (item: any) => item.type === "feature" || item.type === "priced_feature"
      ) || []
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to Load</h2>
          <p className="text-muted-foreground mb-4">
            {error.message ||
              "Failed to load subscription data. Please try again."}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Get current plan from customer data
  const currentPlan = customer?.products?.find(
    (p: any) => p.status === "active"
  );
  const hasPremium =
    currentPlan && !currentPlan.is_default && currentPlan.id !== "free";

  // Sort products: Active plan first, then premium plans, then free plan last
  const sortedProducts = products
    ? [...products].sort((a, b) => {
        // Active plan always first
        if (a.scenario === "active") return -1;
        if (b.scenario === "active") return 1;

        // Premium plans before free plans
        const aIsFree = a.properties.is_free;
        const bIsFree = b.properties.is_free;

        if (aIsFree && !bIsFree) return 1; // Free goes last
        if (!aIsFree && bIsFree) return -1; // Premium comes first

        return 0;
      })
    : [];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/account" })}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Account
        </Button>
        <h1 className="text-3xl font-bold mb-2">Upgrade Your Plan</h1>
        <p className="text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>

      {/* Current Plan Info */}
      {hasPremium && currentPlan && (
        <div className="mb-8 p-4 bg-muted rounded-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <p className="text-sm">
            You're currently on the <strong>{currentPlan.name}</strong> plan
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProducts.map((product) => {
          const price = getPrice(product);
          const features = getFeatures(product);
          const isActive = product.scenario === "active";
          const isFree = product.properties.is_free;
          const isProcessingThis =
            isProcessing && selectedProduct === product.id;

          return (
            <Card
              key={product.id}
              className={`relative ${
                isActive ? "border-primary border-2" : ""
              } ${
                !isFree && !isActive
                  ? "shadow-lg hover:shadow-xl transition-shadow"
                  : ""
              } ${
                isFree && hasPremium
                  ? "opacity-75 hover:opacity-100 transition-opacity"
                  : ""
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}

              {/* Downgrade warning for free plan */}
              {isFree && hasPremium && product.scenario === "downgrade" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    variant="outline"
                    className="bg-background border-yellow-500 text-yellow-600"
                  >
                    Downgrade
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  {!isFree && <Crown className="w-6 h-6 text-amber-500" />}
                </div>
                <CardDescription>
                  {price ? (
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        ${price.amount}
                      </span>
                      {price.interval && (
                        <span className="text-muted-foreground ml-2">
                          / {price.interval}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        $0
                      </span>
                      <span className="text-muted-foreground ml-2">
                        / month
                      </span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {features.length > 0 ? (
                  <ul className="space-y-2">
                    {features.map((feature: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {feature.feature?.name || feature.feature_id}
                          {feature.included_usage && (
                            <span className="text-muted-foreground">
                              {" "}
                              (
                              {feature.included_usage === "inf"
                                ? "Unlimited"
                                : feature.included_usage}
                              )
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Basic features included
                  </p>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isActive ? "outline" : "default"}
                  disabled={isActive || isProcessing}
                  onClick={() => handleUpgrade(product.id)}
                >
                  {isProcessingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {!isFree && product.scenario === "upgrade" && (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {getButtonText(product)}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Cancel anytime, no questions asked</li>
          <li>• All plans include 24/7 customer support</li>
          <li>• Secure payment processing via Stripe</li>
          <li>• Instant access to all premium features</li>
        </ul>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        preview={checkoutPreview}
        onConfirm={handleConfirmCheckout}
        isProcessing={isProcessing}
      />
    </div>
  );
}
