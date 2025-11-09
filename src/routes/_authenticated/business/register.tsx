import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/_authenticated/business/register")({
  component: BusinessRegister,
});

function BusinessRegister() {
  const navigate = useNavigate();
  const createBusiness = useMutation(api.businesses.mutations.create);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

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
          <p className="text-sm text-muted-foreground">You can add this later</p>
        </div>
      ),
    },
  ];

  const handleComplete = async () => {
    try {
      await createBusiness({
        name,
        category,
        address: address || undefined,
        description: description || undefined,
      });

      toast.success("Business registered! We'll review it within 24 hours.");
      navigate({ to: "/business/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Failed to register business");
    }
  };

  return <MultistepForm steps={steps} onComplete={handleComplete} />;
}

