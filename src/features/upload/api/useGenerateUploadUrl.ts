import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "../../../../convex/_generated/api";

export const useGenerateUploadUrl = () => {
  const generate = useMutation(api.upload.generateUploadUrl);

  const generateUploadUrl = useCallback(async () => {
    try {
      const response = await generate();
      return response;
    } catch (error) {
      throw new Error("Failed to generate link");
    }
  }, [generate]);

  return {
    generateUploadUrl,
  };
};
