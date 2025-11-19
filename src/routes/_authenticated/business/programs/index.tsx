import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Pause, PencilLine, Play, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/programs/")({
  ssr: false,
  component: ProgramsPage,
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

function ProgramsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ProgramsContent />
    </Suspense>
  );
}

function ProgramsContent() {
  const navigate = useNavigate();

  const {
    data: businesses,
    refetch: refetchBusinesses,
  } = useSuspenseQuery(
    convexQuery(api.businesses.queries.getMyBusinesses, {})
  );

  // Auto-redirect to registration if no businesses
  useEffect(() => {
    if (businesses.length === 0) {
      navigate({ to: "/business/register" });
    }
  }, [businesses.length, navigate]);

  // Show loading while redirecting
  if (businesses.length === 0) {
    return null;
  }

  const businessId = businesses[0]._id as Id<"businesses">;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reward Programs</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create, update, or retire the loyalty programs customers interact
            with.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/business/programs/create">Create program</Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="text-muted-foreground">Loading programs...</div>
        }
      >
        <ProgramsList businessId={businessId} />
      </Suspense>
    </div>
  );
}

function ProgramsList({ businessId }: { businessId: Id<"businesses"> }) {
  const {
    data: programs,
    refetch: refetchPrograms,
  } = useSuspenseQuery(
    convexQuery(api.rewardPrograms.mutations.listByBusiness, { businessId })
  );

  const updateProgram = useMutation(api.rewardPrograms.mutations.update);
  const [statusLoadingId, setStatusLoadingId] =
    useState<Id<"rewardPrograms"> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<RewardProgram | null>(
    null
  );

  const handleStatusToggle = async (program: RewardProgram) => {
    const nextStatus = program.status === "active" ? "paused" : "active";
    setStatusLoadingId(program._id);
    try {
      await updateProgram({ programId: program._id, status: nextStatus });
      toast.success(
        nextStatus === "active"
          ? "Program reactivated"
          : "Program paused successfully"
      );
      await refetchPrograms();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update program status");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleOpenEditor = (program: RewardProgram) => {
    setSelectedProgram(program);
    setEditorOpen(true);
  };

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground space-y-2">
          <p className="text-lg font-semibold">No programs yet</p>
          <p className="text-sm">
            Create your first reward program to start awarding loyal customers.
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link to="/business/programs/create">Create program</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {programs.map((program: RewardProgram) => (
          <Card key={program._id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="capitalize">{program.type}-based</span>
                    <span>•</span>
                    <ProgramStatusBadge status={program.status} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditor(program)}
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusToggle(program)}
                    disabled={statusLoadingId === program._id}
                  >
                    {statusLoadingId === program._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : program.status === "active" ? (
                      <Pause className="mr-2 h-4 w-4" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {program.status === "active" ? "Pause" : "Activate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgramDetails program={program} />
              {program.description && (
                <p className="text-sm text-muted-foreground">
                  {program.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ProgramEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        program={selectedProgram}
        onMutated={refetchPrograms}
      />
    </>
  );
}

function ProgramStatusBadge({ status }: { status: RewardProgram["status"] }) {
  const styles =
    status === "active"
      ? "bg-green-500/20 text-green-700"
      : status === "paused"
      ? "bg-amber-500/20 text-amber-700"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${styles}`}
    >
      {status}
    </span>
  );
}

function ProgramDetails({ program }: { program: RewardProgram }) {
  const description = useMemo(() => {
    if (program.type === "visit" && "visits" in program.rules) {
      const minimumSpend =
        program.rules.minimumSpendCents &&
        program.rules.minimumSpendCents > 0
          ? ` (Min $${(program.rules.minimumSpendCents / 100).toFixed(2)}/visit)`
          : "";
      return `${program.rules.visits} visits → ${program.rules.reward}${minimumSpend}`;
    }

    if (
      program.type === "spend" &&
      "spendAmountCents" in program.rules &&
      "reward" in program.rules
    ) {
      return `Spend $${(program.rules.spendAmountCents / 100).toFixed(
        2
      )} → ${program.rules.reward}`;
    }

    return "";
  }, [program]);

  return (
    <p className="text-sm text-muted-foreground">
      {description || "Custom reward rules"}
    </p>
  );
}

function ProgramEditorDialog({
  open,
  onOpenChange,
  program,
  onMutated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: RewardProgram | null;
  onMutated: () => Promise<any> | void;
}) {
  const updateProgram = useMutation(api.rewardPrograms.mutations.update);
  const deleteProgram = useMutation(api.rewardPrograms.mutations.remove);

  const [formState, setFormState] = useState<ProgramFormState>(() =>
    createProgramFormState(program)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setFormState(createProgramFormState(program));
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
      onOpenChange(false);
      await onMutated();
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
      onOpenChange(false);
      await onMutated();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to delete program");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit program</DialogTitle>
          <DialogDescription>
            Update the reward details that customers see. Changes apply
            immediately.
          </DialogDescription>
        </DialogHeader>
        {program ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="programDescription">
                Description (optional)
              </Label>
              <Textarea
                id="programDescription"
                rows={3}
                value={formState.description}
                onChange={handleChange("description")}
                placeholder="Share context customers will see."
              />
            </div>

            <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto"
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
                      This will remove the program and any pending reward
                      progress tied to it. This action cannot be undone.
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

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a program to edit.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function createProgramFormState(
  program: RewardProgram | null
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
