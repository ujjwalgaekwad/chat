import { useState, useCallback } from "react";
import { api } from "../lib/api";
import type { AttachmentDTO } from "@chat-platform/shared";

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({ progress: 0, isUploading: false, error: null });

  const upload = useCallback(async (file: File): Promise<AttachmentDTO | null> => {
    setState({ progress: 0, isUploading: true, error: null });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          const progress = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
          setState((s) => ({ ...s, progress }));
        },
      });
      setState({ progress: 100, isUploading: false, error: null });
      return res.data.data as AttachmentDTO;
    } catch (err: any) {
      setState({
        progress: 0,
        isUploading: false,
        error: err?.response?.data?.error?.message ?? "Upload failed",
      });
      return null;
    }
  }, []);

  return { upload, ...state };
}
