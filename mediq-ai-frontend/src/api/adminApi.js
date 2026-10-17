import axios from "axios";

const API_URL = "http://localhost:8080/api/admin";

// =========================
// AUTH
// =========================

const getToken = () => {
    return localStorage.getItem("token");
};

const authHeader = () => {
    const token = getToken();

    return {
        Authorization: token
            ? `Bearer ${token}`
            : "",
        "Content-Type": "application/json",
    };
};

// =========================
// USER
// =========================

export const getAllUsers = async () => {
    const response = await axios.get(
        `${API_URL}/users`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getUserById = async (id) => {
    const response = await axios.get(
        `${API_URL}/users/${id}`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

// Thêm User
export const createUser = async (userData) => {
    const response = await axios.post(
        `${API_URL}/users`,
        userData,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

// Đổi trạng thái ACTIVE / LOCKED
export const updateUserStatus = async (
    id,
    status
) => {
    const response = await axios.put(
        `${API_URL}/users/${id}/status`,
        {
            status,
        },
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

// Đổi Role
export const updateUserRole = async (
    id,
    role
) => {
    const response = await axios.put(
        `${API_URL}/users/${id}/role`,
        {
            role,
        },
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

// =========================
// PATIENT
// =========================

export const getAllPatients = async () => {
    const response = await axios.get(
        `${API_URL}/patients`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getPatientById = async (id) => {
    const response = await axios.get(
        `${API_URL}/patients/${id}`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const updatePatient = async (
    id,
    patientData
) => {
    const response = await axios.put(
        `${API_URL}/patients/${id}`,
        patientData,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getMedicalRecords = async (
    patientId
) => {
    const response = await axios.get(
        `${API_URL}/patients/${patientId}/medical-records`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const updateMedicalRecord = async (
    recordId,
    recordData
) => {
    const response = await axios.put(
        `${API_URL}/patients/medical-records/${recordId}`,
        recordData,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

// =========================
// DOCTOR
// =========================

export const getAllDoctors = async () => {
    const response = await axios.get(
        `${API_URL}/doctors`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getDoctorById = async (id) => {
    const response = await axios.get(
        `${API_URL}/doctors/${id}`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const createDoctor = async (doctorData) => {
    const response = await axios.post(
        `${API_URL}/doctors`,
        doctorData,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const updateDoctor = async (id, doctorData) => {
    const response = await axios.patch(
        `${API_URL}/doctors/${id}`,
        doctorData,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getAllSpecialties = async (status = "ACTIVE") => {
    const response = await axios.get(
        `${API_URL}/doctors/specialties`,
        {
            params: status ? { status } : {},
            headers: authHeader()
        }
    );

    return response.data;
};

// =========================
// SPECIALTIES - GATEWAY
// =========================

const GATEWAY_URL = "http://localhost:8080";

export const getSpecialties = async () => {
    const response = await axios.get(
        `${GATEWAY_URL}/specialties`,
        {
            params: { status: "ACTIVE" },
            headers: authHeader(),
        }
    );

    return response.data;
};

export const createSpecialty = async (data) => {
    const response = await axios.post(
        `${GATEWAY_URL}/specialties`,
        data,
        { headers: authHeader() }
    );

    return response.data;
};

export const updateSpecialty = async (id, data) => {
    const response = await axios.patch(
        `${GATEWAY_URL}/specialties/${id}`,
        data,
        { headers: authHeader() }
    );

    return response.data;
};

// =========================
// CLINICS & ROOMS
// =========================

export const getAllClinics = async () => {
    const response = await axios.get(
        `${GATEWAY_URL}/clinics`,
        { headers: authHeader() }
    );

    return response.data;
};

export const getRoomsByClinic = async (clinicId) => {
    const response = await axios.get(
        `${GATEWAY_URL}/clinics/${clinicId}/rooms`,
        { headers: authHeader() }
    );

    return response.data;
};

// =========================
// DOCTORS
// =========================

export const getDoctorsFromGateway = async () => {
    const response = await axios.get(
        `${GATEWAY_URL}/doctors`,
        { headers: authHeader() }
    );

    return response.data;
};

export const getDoctorSpecialtiesFromGateway = async (doctorId) => {
    const response = await axios.get(
        `${GATEWAY_URL}/doctors/${doctorId}/specialties`,
        { headers: authHeader() }
    );

    return response.data;
};

// =========================
// APPOINTMENT STATISTICS
// =========================

export const getSpecialtyAppointmentStats = async (month) => {
    const response = await axios.get(
        `${GATEWAY_URL}/appointments/statistics/specialties`,
        {
            params: month ? { month } : {},
            headers: authHeader(),
        }
    );

    return response.data;
};

export const getAllAppointments = async (filters = {}) => {
    const params = {};

    if (filters.date) params.date = filters.date;
    if (filters.status) params.status = filters.status;
    if (filters.doctorId) params.doctorId = filters.doctorId;
    if (filters.patientId) params.patientId = filters.patientId;

    const response = await axios.get(
        `${API_URL}/appointments`,
        {
            headers: authHeader(),
            params,
        }
    );

    return response.data;
};

export const getAppointmentById = async (id) => {
    const response = await axios.get(
        `${API_URL}/appointments/${id}`,
        {
            headers: authHeader(),
        }
    );

    return response.data;
};


