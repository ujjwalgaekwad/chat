import cloudinary from "../config/cloudinary";

type CloudinaryUploadOptions = {
    folder?: string;
    resources_type?: "image" | "video" | "raw" | "auto";
    public_id?: string;
}

export const uploadToCloudinary = (buffer: Buffer, options: CloudinaryUploadOptions = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "auto",
            folder: "chat-platform",
            ...options
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(result);
        });

        uploadStream.end(buffer)
    })
}