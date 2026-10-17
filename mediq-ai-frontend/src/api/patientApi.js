import axiosClient from "./axiosClient";

// GET MY PATIENT PROFILE
export const getMyPatient = async () => {
    const response = await axiosClient.get(
        "/api/v1/patients/me"
    );

    return response.data;
};

// UPDATE MY PATIENT PROFILE
export const updateMyPatient = async ({
    fullName,
    phone,
    gender,
    dateOfBirth,
    address,
}) => {

    const response = await axiosClient.put(
        "/api/v1/patients/me",
        {
            fullName,
            phone,
            gender,
            dateOfBirth,
            address,
        }
    );

    return response.data;
};

// ==========================================
// GET MY MEDICAL RECORDS
// ==========================================

export const getMyMedicalRecords = async (patientId) => {

    const response = await axiosClient.get(
        `/api/v1/medical-records/patient/${patientId}`
    );

    return response.data;
};