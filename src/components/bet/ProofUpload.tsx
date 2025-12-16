"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadProof } from "@/lib/actions/proofs";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProofUploadProps {
  betId: string;
  userId: string;
  currentProofUrl?: string | null;
}

export function ProofUpload({
  betId,
  userId,
  currentProofUrl,
}: ProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentProofUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${betId}/${userId}_${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("proofs").getPublicUrl(filePath);

      // Save proof to database
      const result = await uploadProof(betId, userId, publicUrl);

      if (!result.success) {
        setError(result.error || "Failed to save proof");
        // Delete uploaded file on error
        await supabase.storage.from("proofs").remove([filePath]);
      } else {
        setFile(null);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setFile(null);
    setPreview(currentProofUrl || null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Upload Proof</h3>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {preview && (
        <div className="relative w-full rounded-lg border border-border overflow-hidden">
          <img
            src={preview}
            alt="Proof preview"
            className="w-full h-auto max-h-64 object-contain"
          />
          {file && (
            <button
              onClick={handleRemovePreview}
              className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="flex-1 min-h-[44px]"
        />
        {file && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="min-h-[44px]"
          >
            {uploading ? (
              "Uploading..."
            ) : currentProofUrl ? (
              "Update Proof"
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        )}
      </div>

      {currentProofUrl && !file && (
        <p className="text-sm text-muted-foreground">
          You have already uploaded a proof. Select a new image to update it.
        </p>
      )}
    </div>
  );
}

