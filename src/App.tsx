// src/App.tsx
import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Outlet } from "react-router-dom";

import MobileFAB from "./components/layout/MobileFAB";
import { ConnectionStatusBanner } from "./components/ConnectionStatusBanner";
import { SupabaseInitBanner } from "./components/SupabaseInitBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import DebugMode from "./components/DebugMode";
import { runStartupValidation } from "./lib/startup-validation";
import { Toaster } from "@/components/ui/sonner";
import { isDev } from "@/lib/env";

// ✅ Layout imports
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Lazy load pages
const Home = lazy(() => import("./components/home"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails"));
const AddListing = lazy(() => import("./pages/AddListing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Services = lazy(() => import("./pages/Services"));
const ServiceCategoryPage = lazy(() => import("./pages/ServiceCategoryPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SelectRole = lazy(() => import("./pages/SelectRole"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Advertise = lazy(() => import("./pages/Advertise"));
const Advertising = lazy(() => import("./pages/Advertising"));
const NewAdRequest = lazy(() => import("./pages/NewAdRequest"));
const Agencies = lazy(() => import("./pages/Agencies"));
const CommercialDashboard = lazy(() => import("./pages/CommercialDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// SEO Guides
const GuidesPage = lazy(() => import("./pages/GuidesPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));

// Diagnostics (DEV only) - only import in development
const Diagnostics = isDev() ? lazy(() => import("./pages/Diagnostics")) : null;

// New Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminListingDetail = lazy(() => import("./pages/admin/AdminListingDetail"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAgencies = lazy(() => import("./pages/admin/AdminAgencies"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminDiagnostics = lazy(() => import("./pages/admin/AdminDiagnostics"));
const AdminContentPages = lazy(() => import("./pages/admin/AdminContentPages"));
const AdminContentPageEditor = lazy(() => import("./pages/admin/AdminContentPageEditor"));
const AdminContentCategories = lazy(() => import("./pages/admin/AdminContentCategories"));
const AdminPromoBanners = lazy(() => import("./pages/admin/AdminPromoBanners"));
const AdminDummyProperties = lazy(() => import("./pages/admin/AdminDummyProperties"));
const AdminMonetization = lazy(() => import("./pages/admin/AdminMonetization"));
const AdminServiceCategories = lazy(() => import("./pages/admin/AdminServiceCategories"));
const AdminServiceSubcategories = lazy(() => import("./pages/admin/AdminServiceSubcategories"));
const AdminServiceRequests = lazy(() => import("./pages/admin/AdminServiceRequests"));
const AdminArtisans = lazy(() => import("./pages/admin/AdminArtisans"));

// Artisan Pages (old)
const ArtisanOnboarding = lazy(() => import("./pages/artisan/ArtisanOnboarding"));
const ArtisanDashboard = lazy(() => import("./pages/artisan/ArtisanDashboard"));
const ArtisanServices = lazy(() => import("./pages/artisan/ArtisanServices"));
const ArtisanRequests = lazy(() => import("./pages/artisan/ArtisanRequests"));
const ArtisanProfileEdit = lazy(() => import("./pages/artisan/ArtisanProfileEdit"));

// Artisan Pages (new - clean architecture)
const ArtisanOnboardingNew = lazy(() => import("./features/artisans/ui/pages/ArtisanOnboardingRefactored"));
const ArtisanPending = lazy(() => import("./features/artisans/ui/pages/ArtisanPending"));

// SEO Landing Pages
const CityPage = lazy(() => import("./pages/CityPage"));
const TransactionPage = lazy(() => import("./pages/TransactionPage"));
const CityImmobilierPage = lazy(() => import("./pages/CityImmobilierPage"));
const NeighborhoodPage = lazy(() => import("./pages/NeighborhoodPage"));
const PropertyTypeNeighborhoodPage = lazy(
  () => import("./pages/PropertyTypeNeighborhoodPage")
);
const CityTransactionPage = lazy(() => import("./pages/CityTransactionPage"));
const CityPropertyTypePage = lazy(() => import("./pages/CityPropertyTypePage"));
const MoroccanSaharaPage = lazy(() => import("./pages/MoroccanSaharaPage"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  
  return null;
}

/** ✅ Public Layout */
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <MobileFAB />
    </div>
  );
}

function App() {
  const [validationFailed, setValidationFailed] = useState(false);

  useEffect(() => {
    // Run startup validation in background (non-blocking)
    runStartupValidation()
      .then((result) => {
        if (!result.valid && result.errors.length > 0) {
          console.error("⚠️ Startup validation found errors, but app will continue");
          setValidationFailed(true);
        }
      })
      .catch((error) => {
        console.error("⚠️ Startup validation exception:", error);
        setValidationFailed(true);
      });
  }, []);

  return (
    <>
      {validationFailed && isDev() && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
            padding: "8px",
            textAlign: "center",
            zIndex: 9999,
            fontSize: "14px",
          }}
        >
          ⚠️ Configuration warnings detected. Check browser console for details.
        </div>
      )}

      <ScrollToTop />

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* ✅ كلشي public داخل PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/buy" element={<SearchResults />} />
            <Route path="/rent" element={<SearchResults />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/advertise" element={<Advertise />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceCategoryPage />} />
            
            {/* Artisan Onboarding - Public but requires auth (handled in component) */}
            <Route path="/artisan/onboarding" element={<ArtisanOnboardingNew />} />
            <Route path="/artisan/pending" element={<ArtisanPending />} />
            <Route path="/artisan/profile/edit" element={<ArtisanProfileEdit />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Role Selection - Protected but for users with default role */}
            <Route
              path="/select-role"
              element={
                <ProtectedRoute>
                  <SelectRole />
                </ProtectedRoute>
              }
            />
            
            {/* SEO Guides */}
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:slug" element={<GuidePage />} />
            
            {/* Diagnostics (DEV only) - only register route in development */}
            {isDev() && Diagnostics && (
              <Route path="/diagnostics" element={<Diagnostics />} />
            )}
            
            {/* 
              CRITICAL: /reset-password MUST remain public (not wrapped in ProtectedRoute)
              This route needs to be accessible WITHOUT authentication because:
              1. Users don't have a session yet (they're resetting their password)
              2. The session is created FROM the reset token in the URL
              3. Wrapping this in ProtectedRoute would cause immediate redirect to /login
              See: docs/PASSWORD_RESET_TESTING_GUIDE.md for details
            */}
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Alias route for password reset (supports both /reset-password and /auth/reset) */}
            <Route path="/auth/reset" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Moroccan Sahara dedicated page */}
            <Route path="/sahara-marocain" element={<MoroccanSaharaPage />} />

            {/* SEO immobilier */}
            <Route path="/immobilier/:city" element={<CityImmobilierPage />} />
            <Route
              path="/immobilier/:city/:neighborhood/:propertyType/:transactionType"
              element={<PropertyTypeNeighborhoodPage />}
            />
            <Route
              path="/immobilier/:city/:neighborhood/:propertyType"
              element={<PropertyTypeNeighborhoodPage />}
            />
            <Route
              path="/immobilier/:city/:neighborhood"
              element={<NeighborhoodPage />}
            />

            {/* Transactions */}
            <Route path="/acheter" element={<TransactionPage />} />
            <Route path="/louer" element={<TransactionPage />} />
            <Route path="/acheter-appartement" element={<TransactionPage />} />
            <Route path="/acheter-villa" element={<TransactionPage />} />
            <Route path="/acheter-maison" element={<TransactionPage />} />
            <Route path="/acheter-terrain" element={<TransactionPage />} />
            <Route path="/acheter-commercial" element={<TransactionPage />} />
            <Route path="/louer-appartement" element={<TransactionPage />} />
            <Route path="/louer-villa" element={<TransactionPage />} />
            <Route path="/louer-maison" element={<TransactionPage />} />
            <Route path="/louer-commercial" element={<TransactionPage />} />
            <Route path="/acheter-appartement-:city" element={<TransactionPage />} />
            <Route path="/acheter-villa-:city" element={<TransactionPage />} />
            <Route path="/acheter-maison-:city" element={<TransactionPage />} />
            <Route path="/louer-appartement-:city" element={<TransactionPage />} />
            <Route path="/louer-villa-:city" element={<TransactionPage />} />
            <Route path="/louer-maison-:city" element={<TransactionPage />} />
            
            {/* City sub-pages: transaction types and property types */}
            <Route path="/:city/vente" element={<CityTransactionPage />} />
            <Route path="/:city/location" element={<CityTransactionPage />} />
            <Route path="/:city/appartements" element={<CityPropertyTypePage />} />
            <Route path="/:city/maisons" element={<CityPropertyTypePage />} />
            <Route path="/:city/villas" element={<CityPropertyTypePage />} />
            <Route path="/:city/terrains" element={<CityPropertyTypePage />} />
            <Route path="/:city/commerciaux" element={<CityPropertyTypePage />} />

            {/* SEO cities - Dynamic city landing pages (MUST BE LAST) */}
            <Route path="/:city" element={<CityPage />} />
          </Route>

          {/* ✅ Protected Routes (خليتهم برا layout) */}
          <Route
            path="/add-listing"
            element={
              <ProtectedRoute allowedRoles={["user", "agent", "merchant", "admin"]}>
                <AddListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-listing/:id"
            element={
              <ProtectedRoute allowedRoles={["user", "agent", "merchant", "admin"]}>
                <EditListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/artisan"
            element={
              <ProtectedRoute allowedRoles={["user", "agent", "merchant", "admin"]}>
                <ArtisanDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/artisan/services"
            element={
              <ProtectedRoute allowedRoles={["user", "agent", "merchant", "admin"]}>
                <ArtisanServices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/artisan/requests"
            element={
              <ProtectedRoute allowedRoles={["user", "agent", "merchant", "admin"]}>
                <ArtisanRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={["agent"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchant"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <CommercialDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/advertising"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <Advertising />
              </ProtectedRoute>
            }
          />

          <Route
            path="/advertising/new"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <NewAdRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/commercial-dashboard"
            element={
              <ProtectedRoute allowedRoles={["merchant"]}>
                <CommercialDashboard />
              </ProtectedRoute>
            }
          />

          {/* ✅ Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <AdminProtectedRoute>
                <AdminListings />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/listings/:id"
            element={
              <AdminProtectedRoute>
                <AdminListingDetail />
              </AdminProtectedRoute>
            }
          />
          {/* Alias route for /admin/properties */}
          <Route
            path="/admin/properties"
            element={
              <AdminProtectedRoute>
                <AdminListings />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/properties/:id"
            element={
              <AdminProtectedRoute>
                <AdminListingDetail />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <AdminUsers />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/agencies"
            element={
              <AdminProtectedRoute>
                <AdminAgencies />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <AdminProtectedRoute>
                <AdminLocations />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <AdminSettings />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/diagnostics"
            element={
              <AdminProtectedRoute>
                <AdminDiagnostics />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/content/pages"
            element={
              <AdminProtectedRoute>
                <AdminContentPages />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/content/pages/:id"
            element={
              <AdminProtectedRoute>
                <AdminContentPageEditor />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/content/categories"
            element={
              <AdminProtectedRoute>
                <AdminContentCategories />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/promo-banners"
            element={
              <AdminProtectedRoute>
                <AdminPromoBanners />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dummy-properties"
            element={
              <AdminProtectedRoute>
                <AdminDummyProperties />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/monetization"
            element={
              <AdminProtectedRoute>
                <AdminMonetization />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/services/categories"
            element={
              <AdminProtectedRoute>
                <AdminServiceCategories />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/services/subcategories"
            element={
              <AdminProtectedRoute>
                <AdminServiceSubcategories />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/services/requests"
            element={
              <AdminProtectedRoute>
                <AdminServiceRequests />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/artisans"
            element={
              <AdminProtectedRoute>
                <AdminArtisans />
              </AdminProtectedRoute>
            }
          />

          {/* Legacy Admin - Redirect to new admin dashboard */}
          <Route
            path="/admin-panel"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

      {/* ⚠️ دابا MobileFAB راه داخل PublicLayout، إلى بغيتيه هنا حيدو من PublicLayout */}
      <SupabaseInitBanner />
      <ConnectionStatusBanner />
      <DebugMode />
      <Toaster />
    </>
  );
}

export default App;
