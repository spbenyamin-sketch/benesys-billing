import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LogoUploaderProps {
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string) => void;
}

export function LogoUploader({ currentLogoUrl, onLogoChange }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadUrlResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!uploadUrlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await uploadUrlResponse.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const publicUrl = uploadURL.split("?")[0];
      onLogoChange(publicUrl);

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Make sure object storage is set up.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="logo-upload">Company Logo</Label>
      <div className="flex items-start gap-4">
        {currentLogoUrl ? (
          <div className="relative">
            <img
              src={currentLogoUrl}
              alt="Company Logo"
              className="w-32 h-32 object-contain border rounded-md"
              data-testid="img-current-logo"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2"
              onClick={handleRemoveLogo}
              data-testid="button-remove-logo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
            <Upload className="h-8 w-8" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            data-testid="input-logo-file"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("logo-upload")?.click()}
            disabled={isUploading}
            data-testid="button-upload-logo"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Choose Image"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Recommended: Square image, max 5MB
          </p>
        </div>
      </div>
    </div>
  );
}
