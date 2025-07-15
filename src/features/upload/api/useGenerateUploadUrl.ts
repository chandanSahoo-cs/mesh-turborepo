import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "../../../../convex/_generated/api";

export const useGenerateUploadUrl = () => {
  const generate = useMutation(api.upload.generateUploadUrl);

  const generateUploadUrl = useCallback(async () => {
    try {
      const response = await generate();
      console.log("From the method:", response);
      return response;
    } catch (error) {
      console.log(error);
      throw new Error("Failed to generate link");
    }
  }, [generate]);

  return {
    generateUploadUrl,
  };
};
