import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";

// Lazy load pages
const PropertiesPage = lazy(() => import("./pages/PropertiesPage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const ArtisansPage = lazy(() => import("./pages/ArtisansPage"));
const ArtisanDetailPage = lazy(() => import("./pages/ArtisanDetailPage"));

// Auth
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const EmailConfirmationPage = lazy(() => import("./pages/auth/EmailConfirmationPage"));

// Dashboards
const ArtisanDashboardPage = lazy(() => import("./pages/dashboard/ArtisanDashboardPage"));
const AdvertiserDashboardPage = lazy(() => import("./pages/dashboard/AdvertiserDashboardPage"));
const AdminDashboardPage = lazy(() => import("./pages/dashboard/AdminDashboardPage"));

// Error pages
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ServerErrorPage = lazy(() => import("./pages/ServerErrorPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-[#0FC2C0] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-300 text-lg">Chargement...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/artisans" element={<ArtisansPage />} />
        <Route path="/artisan/:id" element={<ArtisanDetailPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/email-confirmation" element={<EmailConfirmationPage />} />

        {/* Dashboards */}
        <Route path="/dashboard/artisan" element={<ArtisanDashboardPage />} />
        <Route path="/dashboard/advertiser" element={<AdvertiserDashboardPage />} />
        <Route path="/dashboard/admin" element={<AdminDashboardPage />} />

        {/* Error */}
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
