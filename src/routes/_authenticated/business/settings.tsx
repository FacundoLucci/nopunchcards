import { Suspense, useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { toast } from "sonner";
import { Loader2, Building2, Mail, Calendar } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/business/settings")({
  ssr: false,
  component: BusinessSettings,
});

type BusinessProfile = {
  _id: Id<"businesses">;
  _creationTime: number;
  name: string;
  slug: string;
  category: string;
  address?: string;
  description?: string;
  statementDescriptors?: string[];
};

type BusinessFormState = {
  name: string;
  category: string;
  address: string;
  description: string;
  statementDescriptors: string;
};

const CATEGORY_OPTIONS = [
  "Coffee",
  "Restaurant",
  "Retail",
  "Grocery",
  "Fitness",
  "Salon",
  "Other",
] as const;

const EMPTY_FORM_STATE: BusinessFormState = {
  name: "",
  category: "",
  address: "",
  description: "",
  statementDescriptors: "",
};

const createFormState = (business?: BusinessProfile | null): BusinessFormState =>
  !business
    ? { ...EMPTY_FORM_STATE }
    : {
        name: business.name ?? "",
        category: business.category ?? "",
        address: business.address ?? "",
        description: business.description ?? "",
        statementDescriptors: business.statementDescriptors?.join(", ") ?? "",
      };

const parseStatementDescriptors = (input: string) =>
  input
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

function BusinessSettings() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const {
    data: businesses,
    refetch: refetchBusinesses,
  } = useSuspenseQuery(convexQuery(api.businesses.queries.getMyBusinesses, {}));
  const business = businesses?.[0] as BusinessProfile | undefined;

  const updateBusiness = useMutation(api.businesses.mutations.update);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<BusinessFormState>(() =>
    createFormState(business)
  );

  useEffect(() => {
    setFormState(createFormState(business));
    if (!business) {
      setIsEditing(false);
    }
  }, [business]);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const businessUrl = useMemo(() => {
    if (!business?.slug) return null;
    if (typeof window === "undefined") return `/join/${business.slug}`;
    return `${window.location.origin}/join/${business.slug}`;
  }, [business?.slug]);

  const handleToggleEditing = () => {
    if (!business) return;
    if (isEditing) {
      setFormState(createFormState(business));
    }
    setIsEditing((prev) => !prev);
  };

  const handleChange =
    (field: keyof BusinessFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const handleCategoryChange = (value: string) => {
    setFormState((prev) => ({ ...prev, category: value }));
  };

  const handleCancelEdit = () => {
    if (!business) return;
    setFormState(createFormState(business));
    setIsEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!business) return;

    const trimmedName = formState.name.trim();
    const trimmedCategory = formState.category.trim();

    if (!trimmedName) {
      toast.error("Business name is required");
      return;
    }

    if (!trimmedCategory) {
      toast.error("Please select a category");
      return;
    }

    setIsSaving(true);
    try {
      const descriptors = parseStatementDescriptors(
        formState.statementDescriptors
      );

      await updateBusiness({
        businessId: business._id,
        name: trimmedName,
        category: trimmedCategory,
        address: formState.address.trim() || undefined,
        description: formState.description.trim() || undefined,
        statementDescriptors: descriptors.length ? descriptors : undefined,
      });

      toast.success("Business profile updated");
      setIsEditing(false);
      await refetchBusinesses();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update business");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl py-4 px-4 sm:py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage your business profile and settings
        </p>
      </div>

        {business ? (
        <>
          <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Business Profile</CardTitle>
                    <CardDescription>
                      Your business information and details
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isEditing ? "outline" : "default"}
                    className="w-full sm:w-auto"
                    onClick={handleToggleEditing}
                    disabled={isSaving}
                  >
                    {isEditing ? "Stop editing" : "Edit profile"}
                  </Button>
                </div>
            </CardHeader>
              <CardContent className="space-y-5">
                {isEditing ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={formState.name}
                        onChange={handleChange("name")}
                        placeholder="Joe's Coffee Shop"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessCategory">Category</Label>
                      <Select
                        value={formState.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger id="businessCategory">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Address</Label>
                      <Input
                        id="businessAddress"
                        value={formState.address}
                        onChange={handleChange("address")}
                        placeholder="123 Main St, City, State"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">Description</Label>
                      <Textarea
                        id="businessDescription"
                        value={formState.description}
                        onChange={handleChange("description")}
                        placeholder="Tell customers about your business"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="statementDescriptors">
                        Statement Descriptors
                      </Label>
                      <Textarea
                        id="statementDescriptors"
                        value={formState.statementDescriptors}
                        onChange={handleChange("statementDescriptors")}
                        placeholder="SQ*JOES COFFEE, STRIPE*JOES COFFEE"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple descriptors with commas or line breaks.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Business Name
                          </p>
                          <p className="text-base sm:text-lg font-semibold break-words">
                            {business.name}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            Category
                          </p>
                          <Badge variant="secondary" className="capitalize">
                            {business.category}
                          </Badge>
                        </div>

                        {businessUrl && (
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Business URL
                            </p>
                            <p className="text-xs sm:text-sm font-mono bg-muted px-2 py-1.5 rounded break-all">
                              {businessUrl}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Member since {formatDate(business._creationTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Address
                        </p>
                        <p className="text-sm">
                          {business.address ? (
                            business.address
                          ) : (
                            <span className="text-muted-foreground">
                              Not provided
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Description
                        </p>
                        <p className="text-sm">
                          {business.description ? (
                            business.description
                          ) : (
                            <span className="text-muted-foreground">
                              Not provided
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Statement Descriptors
                      </p>
                      {business.statementDescriptors?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {business.statementDescriptors.map((descriptor) => (
                            <Badge key={descriptor} variant="outline">
                              {descriptor}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not configured
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>
                Your current business account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-500 shrink-0">Active</Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Your business account is active and operational
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base">
                        Email Notifications
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Receive updates about your programs and customers
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Business Profile
              </h3>
              <p className="text-muted-foreground mb-6">
                Complete business registration to view settings
              </p>
              <Button asChild>
                <a href="/business/register">Complete Registration</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
