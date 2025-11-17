import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MultistepForm } from "@/components/MultistepForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-clients";

export const Route = createFileRoute("/_authenticated/business/register")({
  component: BusinessRegister,
});

function BusinessRegister() {
  const navigate = useNavigate();
  const createBusiness = useMutation(api.businesses.mutations.create);
  const ensureProfile = useMutation(api.users.ensureProfile);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [statementDescriptor, setStatementDescriptor] = useState("");
  const [profileReady, setProfileReady] = useState(false);

  // Ensure user has business_owner profile when page loads
  // This is a fallback - profile should already exist from signup
  useEffect(() => {
    let mounted = true;

    const setupProfile = async () => {
      try {
        console.log("[Business Register] Ensuring business_owner profile...");
        const profileId = await ensureProfile({ role: "business_owner" });
        console.log("[Business Register] Profile ensured:", profileId);
        if (mounted && profileId) {
          setProfileReady(true);
        } else if (mounted && !profileId) {
          toast.error(
            "Failed to create profile - please refresh and try again"
          );
        }
      } catch (error: any) {
        console.error("[Business Register] Failed to ensure profile:", error);
        if (mounted) {
          toast.error(error.message || "Failed to set up business account");
        }
      }
    };

    setupProfile();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const categories = [
    "Coffee",
    "Restaurant",
    "Retail",
    "Grocery",
    "Fitness",
    "Salon",
    "Other",
  ];

  const steps = [
    {
      title: "What's your business name?",
      component: (
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Joe's Coffee Shop"
            className="text-lg"
          />
        </div>
      ),
      onNext: () => {
        if (!name.trim()) {
          toast.error("Please enter a business name");
          return false;
        }
        return true;
      },
    },
    {
      title: "What category best describes your business?",
      component: (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-lg">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
      onNext: () => {
        if (!category) {
          toast.error("Please select a category");
          return false;
        }
        return true;
      },
    },
    {
      title: "Where are you located?",
      component: (
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State"
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            This helps customers find you
          </p>
        </div>
      ),
    },
    {
      title: "How do you appear on credit card statements?",
      component: (
        <div className="space-y-3">
          <Label htmlFor="statementDescriptor">Statement Descriptor</Label>
          <Input
            id="statementDescriptor"
            type="text"
            value={statementDescriptor}
            onChange={(e) => setStatementDescriptor(e.target.value)}
            placeholder="e.g., SQ*JOES COFFEE"
            className="text-lg"
          />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">
              This is how your business shows up on customer card statements.
            </p>
            <p>Common examples:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <span className="font-mono">SQ*YOUR BUSINESS</span> (Square)
              </li>
              <li>
                <span className="font-mono">TST*YOUR BUSINESS</span> (Toast)
              </li>
              <li>
                <span className="font-mono">STRIPE*YOUR BUSINESS</span> (Stripe)
              </li>
              <li>
                <span className="font-mono">CLOVER*YOUR BUSINESS</span> (Clover)
              </li>
              <li>
                <span className="font-mono">YOUR BUSINESS NAME</span> (Direct)
              </li>
            </ul>
            <p className="mt-2">
              💡 Check a recent customer receipt or ask your payment processor
              if unsure.
            </p>
          </div>
        </div>
      ),
      onNext: () => {
        if (!statementDescriptor.trim()) {
          toast.error("Please enter how you appear on statements");
          return false;
        }
        return true;
      },
    },
    {
      title: "Tell customers about your business (optional)",
      component: (
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Best coffee in town!"
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            You can add this later
          </p>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    try {
      // Split statement descriptor by commas in case they entered multiple
      const descriptors = statementDescriptor
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      await createBusiness({
        name,
        category,
        address: address || undefined,
        description: description || undefined,
        statementDescriptors: descriptors.length > 0 ? descriptors : undefined,
      });

      toast.success("Business registered! We'll review it within 24 hours.");
      navigate({ to: "/business/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Failed to register business");
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  // Show loading state while profile is being created
  if (!profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Setting up your account...</div>
      </div>
    );
  }

  return (
    <MultistepForm
      steps={steps}
      onComplete={handleComplete}
      onCancel={handleLogout}
    />
  );
}
