"use client";

import React, { ButtonHTMLAttributes } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "../api/uploadthing/core";
import { Button } from "@/components/ui/button";

type ImageUploadButtonProps = {
  type?: "button" | "submit" | "reset";
  variant:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  size: "default" | "sm" | "lg" | "icon" | null | undefined;
  text: string;
  setImagePreview: (url: string) => void;
};

export default function ImageUploadButton({
  type,
  variant,
  size,
  text,
  setImagePreview,
}: ImageUploadButtonProps) {
  const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log(res);
    },
    onUploadError: () => {
      console.log("error occurred while uploading");
    },
  });

  const handleClick = async () => {
    try {
      const files = await selectFiles();
      if (!files.length) return;

      const res = await startUpload(files);

      if (res && res[0]?.ufsUrl) {
        setImagePreview(res[0]?.ufsUrl);
      }
    } catch (error) {
      console.error("업로드 실패", error);
    }
  };

  const selectFiles = () => {
    return new Promise<File[]>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png, image/jpeg";
      input.multiple = false;
      input.onchange = () => {
        if (input.files) resolve(Array.from(input.files));
        else resolve([]);
      };
      input.click();
    });
  };

  return (
    <Button type={type} variant={variant} size={size} onClick={handleClick}>
      {text}
    </Button>
  );
}
