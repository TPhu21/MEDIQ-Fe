import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { RoleProtectedRoute } from "../auth/RoleProtectedRoute";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

// Auth Pages
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";

// Patient Pages
import { PatientDashboard } from "../pages/patient/PatientDashboard";
import AiChatAndTriage from "../pages/patient/AiChatAndTriage";
import { PatientBooking } from "../pages/patient/PatientBooking";
import ClinicMap from "../pages/patient/ClinicMap"; // IMPORT MỚI
import { MyAppointments } from "../pages/patient/MyAppointments";
import { PatientMedicalRecords } from "../pages/patient/PatientMedicalRecords";
import PatientProfile from "../pages/patient/PatientProfile";

// Doctor Pages
import { DoctorDashboard } from "../pages/doctor/DoctorDashboard";
import DoctorWorkspace from "../pages/doctor/DoctorWorkspace";
import { DoctorPatients } from "../pages/doctor/DoctorPatients";
import { DoctorSchedules } from "../pages/doctor/DoctorSchedules";
import { DoctorAppointments } from "../pages/doctor/DoctorAppointments";
import { DoctorMedicalRecords } from "../pages/doctor/DoctorMedicalRecords";
import DoctorProfile from "../pages/doctor/DoctorProfile";

// Admin Pages
import  AdminDashboard  from "../pages/admin/AdminDashboard";
import { AdminUsers } from "../pages/admin/AdminUsers";
import { AdminPatients } from "../pages/admin/AdminPatients";
import { AdminDoctors } from "../pages/admin/AdminDoctors";
import { AdminSpecialties } from "../pages/admin/AdminSpecialties";
import { AdminRooms } from "../pages/admin/AdminRooms";
import { AdminClinics } from "../pages/admin/AdminClinics";
import { AdminAppointments } from "../pages/admin/AdminAppointments";

const DashboardLayout = ({ children }) => (
  <div className="h-screen bg-slate-100 text-slate-800 flex flex-col font-sans overflow-hidden">
    <Header />
    <div className="flex flex-1 overflow-hidden min-h-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-100 min-w-0">
        <div className="p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* PATIENT ROUTES */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["PATIENT"]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="ai-chat" element={<AiChatAndTriage />} />
                  <Route path="booking" element={<PatientBooking />} />
                  <Route path="map" element={<ClinicMap />} /> {/* ROUTE MỚI */}
                  <Route path="appointments" element={<MyAppointments />} />
                  <Route path="records" element={<PatientMedicalRecords />} />
                  <Route path="profile" element={<PatientProfile />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* DOCTOR ROUTES */}
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["DOCTOR"]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="workspace" element={<DoctorWorkspace />} />
                  <Route path="schedules" element={<DoctorSchedules />} />
                  <Route path="appointments" element={<DoctorAppointments />} />
                  <Route path="patients" element={<DoctorPatients />} />
                  <Route path="records" element={<DoctorMedicalRecords />} />
                  <Route path="profile" element={<DoctorProfile />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="patients" element={<AdminPatients />} />
                  <Route path="doctors" element={<AdminDoctors />} />
                  <Route path="specialties" element={<AdminSpecialties />} />
                  <Route path="clinics" element={<AdminClinics />} />
                  <Route path="rooms" element={<AdminRooms />} />
                  <Route path="appointments" element={<AdminAppointments />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};