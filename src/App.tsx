// src/App.tsx
import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./components/home";
import MobileFAB from "./components/layout/MobileFAB";
import ProtectedRoute from "./components/ProtectedRoute"; // تم تعديل المسار

// Lazy load pages
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

// New Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminListingDetail = lazy(() => import("./pages/admin/AdminListingDetail"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

// SEO Landing Pages
const CityPage = lazy(() => import("./pages/CityPage"));
const TransactionPage = lazy(() => import("./pages/TransactionPage"));
const CityImmobilierPage = lazy(() => import("./pages/CityImmobilierPage"));
const NeighborhoodPage = lazy(() => import("./pages/NeighborhoodPage"));
const PropertyTypeNeighborhoodPage = lazy(() => import("./pages/PropertyTypeNeighborhoodPage"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/buy" element={<SearchResults />} />
          <Route path="/rent" element={<SearchResults />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/add-listing" element={<AddListing />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/agencies" element={<Agencies />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* SEO Landing Pages - Morocco Cities */}
          <Route path="/casablanca" element={<CityPage />} />
          <Route path="/rabat" element={<CityPage />} />
          <Route path="/marrakech" element={<CityPage />} />
          <Route path="/tanger" element={<CityPage />} />
          <Route path="/agadir" element={<CityPage />} />
          <Route path="/fes" element={<CityPage />} />

          {/* SEO Landing Pages - Immobilier Routes with City/Neighborhood */}
          {/* /immobilier/[city] - City overview with neighborhoods */}
          <Route path="/immobilier/:city" element={<CityImmobilierPage />} />
          {/* /immobilier/[city]/[neighborhood]/[propertyType]/[transactionType] - Full SEO route */}
          <Route path="/immobilier/:city/:neighborhood/:propertyType/:transactionType" element={<PropertyTypeNeighborhoodPage />} />
          {/* /immobilier/[city]/[neighborhood]/[propertyType] - Property type in neighborhood */}
          <Route path="/immobilier/:city/:neighborhood/:propertyType" element={<PropertyTypeNeighborhoodPage />} />
          {/* /immobilier/[city]/[neighborhood] - Neighborhood pages */}
          <Route path="/immobilier/:city/:neighborhood" element={<NeighborhoodPage />} />

          {/* SEO Landing Pages - Transactions with various combinations */}
          {/* /acheter, /louer */}
          <Route path="/acheter" element={<TransactionPage />} />
          <Route path="/louer" element={<TransactionPage />} />
          {/* /acheter-appartement, /louer-villa, etc. */}
          <Route path="/acheter-appartement" element={<TransactionPage />} />
          <Route path="/acheter-villa" element={<TransactionPage />} />
          <Route path="/acheter-maison" element={<TransactionPage />} />
          <Route path="/acheter-terrain" element={<TransactionPage />} />
          <Route path="/acheter-commercial" element={<TransactionPage />} />
          <Route path="/louer-appartement" element={<TransactionPage />} />
          <Route path="/louer-villa" element={<TransactionPage />} />
          <Route path="/louer-maison" element={<TransactionPage />} />
          <Route path="/louer-commercial" element={<TransactionPage />} />
          {/* /acheter-casablanca, /louer-rabat, etc. */}
          <Route path="/acheter-casablanca" element={<TransactionPage />} />
          <Route path="/acheter-rabat" element={<TransactionPage />} />
          <Route path="/acheter-marrakech" element={<TransactionPage />} />
          <Route path="/acheter-tanger" element={<TransactionPage />} />
          <Route path="/acheter-agadir" element={<TransactionPage />} />
          <Route path="/acheter-fes" element={<TransactionPage />} />
          <Route path="/louer-casablanca" element={<TransactionPage />} />
          <Route path="/louer-rabat" element={<TransactionPage />} />
          <Route path="/louer-marrakech" element={<TransactionPage />} />
          <Route path="/louer-tanger" element={<TransactionPage />} />
          <Route path="/louer-agadir" element={<TransactionPage />} />
          <Route path="/louer-fes" element={<TransactionPage />} />
          {/* Combined: /acheter-appartement-casablanca, etc. */}
          <Route path="/acheter-appartement-:city" element={<TransactionPage />} />
          <Route path="/acheter-villa-:city" element={<TransactionPage />} />
          <Route path="/acheter-maison-:city" element={<TransactionPage />} />
          <Route path="/louer-appartement-:city" element={<TransactionPage />} />
          <Route path="/louer-villa-:city" element={<TransactionPage />} />
          <Route path="/louer-maison-:city" element={<TransactionPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["real_estate_advertiser"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/advertising"
            element={
              <ProtectedRoute allowedRoles={["commercial_advertiser"]}>
                <Advertising />
              </ProtectedRoute>
            }
          />

          <Route
            path="/advertising/new"
            element={
              <ProtectedRoute allowedRoles={["commercial_advertiser"]}>
                <NewAdRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/commercial-dashboard"
            element={
              <ProtectedRoute allowedRoles={["commercial_advertiser"]}>
                <CommercialDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - New Structure */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/listings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminListings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/listings/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminListingDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Legacy Admin Route - Redirect to new structure */}
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

      <MobileFAB />
    </>
  );
}

export default App;
