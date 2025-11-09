import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ShareYourPageCardProps {
  slug: string;
}

export function ShareYourPageCard({ slug }: ShareYourPageCardProps) {
  const link = `nopunchcards.com/join/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      toast.success("Link copied! Share with your customers");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareToSocial = (platform: "instagram" | "facebook" | "twitter") => {
    const text = "Earn rewards at my business!";
    const url = `https://${link}`;

    switch (platform) {
      case "instagram":
        // Instagram doesn't support direct web share, show copy message
        copyLink();
        toast.info("Paste this link in your Instagram story or bio");
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-secondary to-muted border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Share Your Page</h3>
            <p className="text-sm text-muted-foreground">
              Promote your rewards on social media
            </p>
          </div>
          <span className="text-2xl">📢</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copyable link */}
        <div className="bg-background rounded-lg p-3 flex items-center gap-3">
          <code className="flex-1 text-sm text-foreground truncate">{link}</code>
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
            className="flex-1"
          >
            📷 Instagram
          </Button>
          <Button
            onClick={() => shareToSocial("facebook")}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            📘 Facebook
          </Button>
          <Button
            onClick={() => shareToSocial("twitter")}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            🐦 Twitter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

