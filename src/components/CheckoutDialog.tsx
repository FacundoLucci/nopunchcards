import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: {
    title?: string;
    message?: string;
    scenario?: string;
    product_name?: string;
    items?: Array<{
      price: string;
      description: string;
    }>;
    due_today?: {
      price: number;
      currency: string;
    };
    due_next_cycle?: {
      price: number;
      currency: string;
    };
  } | null;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
  isProcessing,
}: CheckoutDialogProps) {
  if (!preview) return null;

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{preview.title || "Confirm Subscription Change"}</DialogTitle>
          <DialogDescription>
            {preview.message || "Please review the changes to your subscription."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Name */}
          {preview.product_name && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Plan:</span>
              <span>{preview.product_name}</span>
            </div>
          )}

          {/* Line Items */}
          {preview.items && preview.items.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Changes:</p>
              {preview.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.description}</span>
                  <span className={item.price.startsWith("-") ? "text-green-600" : ""}>
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Due Today */}
          {preview.due_today && (
            <div className="flex justify-between items-center font-semibold border-t pt-4">
              <span>Due Today:</span>
              <span>{formatPrice(preview.due_today.price, preview.due_today.currency)}</span>
            </div>
          )}

          {/* Due Next Cycle */}
          {preview.due_next_cycle && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Next Billing Cycle:</span>
              <span>
                {formatPrice(preview.due_next_cycle.price, preview.due_next_cycle.currency)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


