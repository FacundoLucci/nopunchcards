import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export const Route = createFileRoute(
  "/_authenticated/business/programs/$programId/edit"
)({
  component: EditProgram,
});

type RewardProgram = {
  _id: Id<"rewardPrograms">;
  name: string;
  description?: string;
  type: "visit" | "spend";
  rules:
    | { visits: number; reward: string; minimumSpendCents?: number }
    | { spendAmountCents: number; reward: string };
  status: "active" | "paused" | "archived";
};

type ProgramFormState = {
  name: string;
  description: string;
  reward: string;
  visits: string;
  minimumSpend: string;
  spendAmount: string;
  status: RewardProgram["status"];
};

const PROGRAM_STATUS_OPTIONS: RewardProgram["status"][] = [
  "active",
  "paused",
  "archived",
];

function EditProgram() {
  const navigate = useNavigate();
  const { programId } = Route.useParams();
  const updateProgram = useMutation(api.rewardPrograms.mutations.update);
  const deleteProgram = useMutation(api.rewardPrograms.mutations.remove);

  const businesses = useQuery(api.businesses.queries.getMyBusinesses, {});
  const businessId = businesses?.[0]?._id;

  const programs = useQuery(
    api.rewardPrograms.mutations.listByBusiness,
    businessId ? { businessId } : "skip"
  );
  const program = programs?.find((p) => p._id === programId) as
    | RewardProgram
    | undefined;

  const [formState, setFormState] = useState<ProgramFormState>(() =>
    createProgramFormState(program)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (program) {
      setFormState(createProgramFormState(program));
    }
  }, [program]);

  const handleChange =
    (field: keyof ProgramFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleStatusChange = (value: RewardProgram["status"]) => {
    setFormState((prev) => ({ ...prev, status: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!program) return;

    const trimmedName = formState.name.trim();
    const trimmedReward = formState.reward.trim();

    if (!trimmedName) {
      toast.error("Program name is required");
      return;
    }
    if (!trimmedReward) {
      toast.error("Reward description is required");
      return;
    }

    let rulesUpdate: RewardProgram["rules"];

    if (program.type === "visit") {
      const visitsValue = Number(formState.visits);
      if (!Number.isFinite(visitsValue) || visitsValue < 1) {
        toast.error("Visits must be at least 1");
        return;
      }
      const minimumSpendValue = Number(formState.minimumSpend);
      rulesUpdate = {
        visits: Math.floor(visitsValue),
        reward: trimmedReward,
        ...(minimumSpendValue > 0
          ? { minimumSpendCents: Math.round(minimumSpendValue * 100) }
          : {}),
      };
    } else {
      const spendAmount = Number(formState.spendAmount);
      if (!Number.isFinite(spendAmount) || spendAmount <= 0) {
        toast.error("Spend amount must be greater than 0");
        return;
      }
      rulesUpdate = {
        spendAmountCents: Math.round(spendAmount * 100),
        reward: trimmedReward,
      };
    }

    setIsSaving(true);
    try {
      await updateProgram({
        programId: program._id,
        name: trimmedName,
        description: formState.description.trim() || undefined,
        rules: rulesUpdate as any,
        status: formState.status,
      });
      toast.success("Program updated");
      navigate({ to: "/business/programs" });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update program");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!program) return;
    setIsDeleting(true);
    try {
      await deleteProgram({ programId: program._id });
      toast.success("Program deleted");
      navigate({ to: "/business/programs" });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete program");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/business/programs" });
  };

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading program...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={handleCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Edit program</h1>
        <ThemeToggle />
      </div>

      {/* Form content */}
      <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Update the reward details that customers see. Changes apply
            immediately.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="programName">Program Name</Label>
              <Input
                id="programName"
                value={formState.name}
                onChange={handleChange("name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="programStatus">Status</Label>
              <Select
                value={formState.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger id="programStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="programReward">Reward</Label>
            <Input
              id="programReward"
              value={formState.reward}
              onChange={handleChange("reward")}
            />
          </div>

          {program.type === "visit" ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visitsRequired">Visits required</Label>
                <Input
                  id="visitsRequired"
                  type="number"
                  min="1"
                  value={formState.visits}
                  onChange={handleChange("visits")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumSpend">
                  Minimum spend per visit (optional)
                </Label>
                <Input
                  id="minimumSpend"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.minimumSpend}
                  onChange={handleChange("minimumSpend")}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="spendAmount">Spend amount</Label>
              <Input
                id="spendAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={formState.spendAmount}
                onChange={handleChange("spendAmount")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="programDescription">Description (optional)</Label>
            <Textarea
              id="programDescription"
              rows={3}
              value={formState.description}
              onChange={handleChange("description")}
              placeholder="Share context customers will see."
            />
          </div>
        </div>

        {/* Footer with actions */}
        <div className="border-t bg-background p-4 space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete program
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this program?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the program and any pending reward progress
                  tied to it. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function createProgramFormState(
  program: RewardProgram | null | undefined
): ProgramFormState {
  if (!program) {
    return {
      name: "",
      description: "",
      reward: "",
      visits: "",
      minimumSpend: "",
      spendAmount: "",
      status: "active",
    };
  }

  if (program.type === "visit" && "visits" in program.rules) {
    return {
      name: program.name ?? "",
      description: program.description ?? "",
      reward: program.rules.reward ?? "",
      visits: String(program.rules.visits ?? ""),
      minimumSpend: program.rules.minimumSpendCents
        ? (program.rules.minimumSpendCents / 100).toString()
        : "",
      spendAmount: "",
      status: program.status,
    };
  }

  if (program.type === "spend" && "spendAmountCents" in program.rules) {
    return {
      name: program.name ?? "",
      description: program.description ?? "",
      reward: program.rules.reward ?? "",
      visits: "",
      minimumSpend: "",
      spendAmount: (program.rules.spendAmountCents / 100).toString(),
      status: program.status,
    };
  }

  return {
    name: program.name ?? "",
    description: program.description ?? "",
    reward: "",
    visits: "",
    minimumSpend: "",
    spendAmount: "",
    status: program.status,
  };
}

