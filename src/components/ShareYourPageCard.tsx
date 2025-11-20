import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Instagram, Facebook, Twitter } from "lucide-react";

interface ShareYourPageCardProps {
  slug: string;
}

export function ShareYourPageCard({ slug }: ShareYourPageCardProps) {
  const link = `https://lasoloyalty.com/join/${slug}`;
  const displayLink = link.replace(/^https?:\/\//, "");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied! Share with your customers");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareToSocial = (platform: "instagram" | "facebook" | "x") => {
    const text = "Earn rewards at my business!";
    const url = link;

    switch (platform) {
      case "instagram":
        // Instagram doesn't support direct web share, show copy message
        copyLink();
        toast.info("Paste this link in your Instagram story or bio");
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "x":
        window.open(
          `https://x.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
    }
  };

  return (
    <Card className="bg-linear-to-br from-primary to-black border-border pt-4 gap-3 ">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-sans text-lg font-bold text-primary-foreground">
              Share Your Page
            </h3>
            <p className="text-sm text-muted-foreground">
              Promote your rewards on social media
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copyable link */}
        <div className="bg-background rounded-lg p-3 flex items-center gap-3">
          <code className="flex-1 text-sm text-foreground truncate">
            {displayLink}
          </code>
          <Button onClick={copyLink} size="sm" variant="default">
            Copy
          </Button>
        </div>

        {/* Social share buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => shareToSocial("instagram")}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-1"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </Button>
          <Button
            onClick={() => shareToSocial("facebook")}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-1"
          >
            <Facebook className="w-4 h-4" />
            <span>Facebook</span>
          </Button>
          <Button
            onClick={() => shareToSocial("x")}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-1"
          >
            <Twitter className="w-4 h-4" />
            <span>X</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
