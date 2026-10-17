import axiosClient from "./axiosClient";

// Upload / replace avatar trên Media Service
export const replacePatientAvatar = async (file, patientId) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("entityType", "PATIENT");
    formData.append("entityId", patientId);

    const response = await axiosClient.post(
        "/api/media/replace-avatar",
        formData
    );

    return response.data;
};

// Lưu URL Cloudinary vào Patient Service
export const updateMyAvatar = async (avatarUrl) => {
    const response = await axiosClient.put(
        "/api/v1/patients/me/avatar",
        null,
        {
            params: {
                avatarUrl,
            },
        }
    );

    return response.data;
};