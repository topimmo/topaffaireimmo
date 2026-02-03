// src/App.tsx
import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Outlet } from "react-router-dom";

import MobileFAB from "./components/layout/MobileFAB";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import DebugMode from "./components/DebugMode";
import { runStartupValidation } from "./lib/startup-validation";

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
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Advertise = lazy(() => import("./pages/Advertise"));
const Advertising = lazy(() => import("./pages/Advertising"));
const NewAdRequest = lazy(() => import("./pages/NewAdRequest"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Agencies = lazy(() => import("./pages/Agencies"));
const CommercialDashboard = lazy(() => import("./pages/CommercialDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

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
  useEffect(() => window.scrollTo(0, 0), [location.pathname]);
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
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);

  useEffect(() => {
    runStartupValidation().then((result) => {
      setValidationComplete(true);
      if (!result.valid && result.errors.length > 0) {
        console.error("⚠️ Startup validation found errors, but app will continue");
        setValidationFailed(true);
      }
    });
  }, []);

  if (!validationComplete) return <LoadingSpinner />;

  return (
    <>
      {validationFailed && import.meta.env.DEV && (
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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

          {/* Legacy Admin */}
          <Route
            path="/admin-panel"
            element={
              <AdminProtectedRoute>
                <AdminPanel />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

      {/* ⚠️ دابا MobileFAB راه داخل PublicLayout، إلى بغيتيه هنا حيدو من PublicLayout */}
      <DebugMode />
    </>
  );
}

export default App;
