import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, X, ArrowLeft, Check, Loader2, CameraOff, Flashlight, FlashlightOff } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import type { IDetectedBarcode, IScannerProps } from "@yudiel/react-qr-scanner";

type RewardClaimSummary = {
  _id: Id<"rewardClaims">;
  businessId: Id<"businesses">;
  programName: string;
  rewardDescription: string;
  status: "pending" | "redeemed" | "cancelled";
  issuedAt: number;
  redeemedAt?: number;
};

type RewardActionResult = {
  outcome: "not_found" | "wrong_business" | "already_redeemed" | "success";
  claim?: RewardClaimSummary;
};

interface RewardRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: Id<"businesses">;
}

type RedemptionMethod = "code" | "scan" | null;
type ScannerComponentType = (props: IScannerProps) => React.JSX.Element;

export function RewardRedemptionDialog({
  open,
  onOpenChange,
  businessId,
}: RewardRedemptionDialogProps) {
  const [step, setStep] = useState<"method" | "input" | "confirm">("method");
  const [method, setMethod] = useState<RedemptionMethod>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RewardActionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const previewReward = useMutation(api.businesses.mutations.previewRewardCode);
  const confirmReward = useMutation(api.businesses.mutations.confirmRewardRedemption);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("method");
      setMethod(null);
      setCode("");
      setResult(null);
      setIsLoading(false);
      setIsConfirming(false);
      setIsScannerOpen(false);
    }
  }, [open]);

  const handleMethodSelect = (selectedMethod: RedemptionMethod) => {
    setMethod(selectedMethod);
    if (selectedMethod === "scan") {
      setIsScannerOpen(true);
    } else {
      setStep("input");
    }
  };

  const handleVerifyCode = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("Please enter a reward code");
      return;
    }

    setIsLoading(true);
    try {
      const response = (await previewReward({
        businessId,
        rewardCode: trimmedCode,
      })) as RewardActionResult;

      setResult(response);

      if (response.outcome === "success") {
        setStep("confirm");
      } else if (response.outcome === "already_redeemed") {
        toast.error("This reward has already been redeemed");
      } else if (response.outcome === "wrong_business") {
        toast.error("This code belongs to another business");
      } else {
        toast.error("Reward code not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to verify reward code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!code.trim()) return;

    setIsConfirming(true);
    try {
      const response = (await confirmReward({
        businessId,
        rewardCode: code.trim().toUpperCase(),
      })) as RewardActionResult;

      if (response.outcome === "success") {
        toast.success("Reward marked as redeemed!");
        onOpenChange(false);
      } else if (response.outcome === "already_redeemed") {
        toast.error("This reward has already been redeemed");
      } else if (response.outcome === "wrong_business") {
        toast.error("This code belongs to another business");
      } else {
        toast.error("Reward code not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to confirm redemption");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleScannerDetected = useCallback(
    async (rawValue: string) => {
      const normalized = rawValue.trim().toUpperCase();
      if (!normalized) {
        toast.error("Could not read that QR code");
        return;
      }
      setCode(normalized);
      setIsScannerOpen(false);
      setStep("input");
      
      // Auto-verify the scanned code
      setIsLoading(true);
      try {
        const response = (await previewReward({
          businessId,
          rewardCode: normalized,
        })) as RewardActionResult;

        setResult(response);

        if (response.outcome === "success") {
          setStep("confirm");
        } else if (response.outcome === "already_redeemed") {
          toast.error("This reward has already been redeemed");
        } else if (response.outcome === "wrong_business") {
          toast.error("This code belongs to another business");
        } else {
          toast.error("Reward code not found");
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to verify reward code");
      } finally {
        setIsLoading(false);
      }
    },
    [businessId, previewReward]
  );

  const handleScannerError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const handleBack = () => {
    if (step === "confirm") {
      setStep("input");
      setResult(null);
    } else if (step === "input") {
      setStep("method");
      setCode("");
      setMethod(null);
      setResult(null);
    }
  };

  const claim = result?.claim;

  return (
    <>
      <Dialog open={open && !isScannerOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col min-h-[400px]">
            {/* Back button */}
            {step !== "method" && (
              <div className="pb-4">
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Progress indicator */}
            <div className="flex gap-1 pb-6 pt-2">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step !== "method" ? "bg-primary" : "bg-muted"
                )}
              />
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step === "confirm" ? "bg-primary" : "bg-muted"
                )}
              />
            </div>

            {/* Step content */}
            <div className="flex-1 flex flex-col justify-between">
              {step === "method" && (
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">
                      How would you like to redeem?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred method
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full h-20 text-lg"
                      onClick={() => handleMethodSelect("code")}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="font-semibold">ENTER CODE</span>
                      </div>
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          or
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-20 text-lg"
                      onClick={() => handleMethodSelect("scan")}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <QrCode className="w-6 h-6" />
                        <span className="font-semibold">SCAN QR</span>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {step === "input" && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enter Code</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the customer's reward code
                    </p>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="8-character code"
                      className="uppercase text-lg h-14 text-center tracking-wider"
                      maxLength={8}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isLoading) {
                          handleVerifyCode();
                        }
                      }}
                    />
                    {method === "code" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setMethod("scan");
                          setIsScannerOpen(true);
                        }}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Switch to QR Scanner
                      </Button>
                    )}
                  </div>
                  <Button
                    className="w-full h-12"
                    onClick={handleVerifyCode}
                    disabled={!code.trim() || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </div>
              )}

              {step === "confirm" && claim && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Confirm Redemption</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review the reward details
                    </p>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20 p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold text-green-900 dark:text-green-100">
                              {claim.rewardDescription}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {claim.programName}
                            </p>
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                            <p>
                              Code: <span className="font-mono font-semibold">{code}</span>
                            </p>
                            <p>
                              Earned{" "}
                              {formatDistanceToNow(new Date(claim.issuedAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm font-medium mb-2">
                        Was this reward used to complete checkout?
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Confirm that the customer has received their reward benefit
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full h-12"
                      onClick={handleConfirmRedemption}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Confirm & Mark as Redeemed
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleBack}
                      disabled={isConfirming}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RewardScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDetected={handleScannerDetected}
        onCameraError={handleScannerError}
        isProcessing={isLoading}
      />
    </>
  );
}

type RewardScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (value: string) => void | Promise<void>;
  onCameraError: (message: string) => void;
  isProcessing: boolean;
};

function RewardScannerDialog({
  open,
  onOpenChange,
  onDetected,
  onCameraError,
  isProcessing,
}: RewardScannerDialogProps) {
  const [ScannerComponent, setScannerComponent] =
    useState<ScannerComponentType | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  useEffect(() => {
    if (!open) {
      setCameraError(null);
      setTorchEnabled(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    if (!ScannerComponent && typeof window !== "undefined") {
      void import("@yudiel/react-qr-scanner")
        .then((module) => {
          if (!cancelled) {
            setScannerComponent(() => module.Scanner);
            setCameraError(null);
          }
        })
        .catch((error) => {
          console.error("Failed to load QR scanner", error);
          if (!cancelled) {
            const message =
              "Unable to load the camera module. Please refresh and try again.";
            setCameraError(message);
            onCameraError(message);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [open, ScannerComponent, onCameraError]);

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (!detectedCodes.length) return;
      const nextValue = detectedCodes[0]?.rawValue;
      if (!nextValue) return;
      void onDetected(nextValue);
    },
    [onDetected]
  );

  const handleError = useCallback(
    (error: unknown) => {
      console.error("QR scanner error", error);
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera access was denied. Enable permissions and try again."
          : "Unable to access camera. Please check permissions and retry.";
      setCameraError(message);
      onCameraError(message);
    },
    [onCameraError]
  );

  if (!open) return null;

  const scannerUI = (
    <div className="fixed inset-0 z-9999 bg-black">
      {/* Camera view */}
      <div className="absolute inset-0">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <CameraOff className="h-12 w-12 text-white/60" />
            <p className="text-white/80">{cameraError}</p>
          </div>
        ) : ScannerComponent ? (
          <ScannerComponent
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode: { ideal: "environment" },
              ...(torchEnabled && { torch: true }),
            }}
            components={{ finder: false }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: { objectFit: "cover" },
            }}
            scanDelay={600}
          />
        ) : (
          <div className="flex h-full items-center justify-center gap-3 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Preparing camera…</span>
          </div>
        )}
      </div>

      {/* Dark overlay with clear square cutout */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Semi-transparent overlay with hole in center */}
        <div
          className="absolute inset-0 bg-black/60"
          style={{
            maskImage:
              "radial-gradient(circle at center, transparent 140px, black 140px)",
            WebkitMaskImage:
              "radial-gradient(circle at center, transparent 140px, black 140px)",
          }}
        />

        {/* Square scanning frame */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border-0 border-white/80 rounded-2xl">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
        </div>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <h3 className="text-white font-semibold">Scan Reward QR Code</h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isProcessing}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="flex items-center justify-center gap-4">
          {!cameraError && ScannerComponent && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setTorchEnabled(!torchEnabled)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {torchEnabled ? (
                <>
                  <FlashlightOff className="h-5 w-5 mr-2" />
                  Torch Off
                </>
              ) : (
                <>
                  <Flashlight className="h-5 w-5 mr-2" />
                  Torch On
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(scannerUI, document.body)
    : null;
}

