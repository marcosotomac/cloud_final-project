import api from "./api";
import { API_CONFIG } from "@/config/api";

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export const uploadService = {
  /**
   * Get a pre-signed URL for uploading a file
   */
  async getUploadUrl(
    filename: string,
    contentType: string,
    folder: string = "menu"
  ): Promise<UploadUrlResponse> {
    const params = new URLSearchParams({
      filename,
      contentType,
      folder,
    });
    const response = await api.get<UploadUrlResponse>(
      `/tenants/${API_CONFIG.TENANT_ID}/uploads/url?${params.toString()}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || "Failed to get upload URL");
  },

  /**
   * Upload a file directly to S3 using the pre-signed URL
   */
  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  },

  /**
   * Upload a file and return the public URL
   */
  async uploadFile(file: File, folder: string = "menu"): Promise<string> {
    // Get pre-signed URL
    const { uploadUrl, publicUrl } = await this.getUploadUrl(
      file.name,
      file.type,
      folder
    );

    // Upload directly to S3
    await this.uploadToS3(uploadUrl, file);

    return publicUrl;
  },

  /**
   * Delete an asset from S3
   */
  async deleteAsset(key: string): Promise<void> {
    await api.delete(`/uploads/${encodeURIComponent(key)}`);
  },
};
