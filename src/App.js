import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/App.tsx
import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
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
// SEO Landing Pages
const CityPage = lazy(() => import("./pages/CityPage"));
const TransactionPage = lazy(() => import("./pages/TransactionPage"));
const CityImmobilierPage = lazy(() => import("./pages/CityImmobilierPage"));
const NeighborhoodPage = lazy(() => import("./pages/NeighborhoodPage"));
const PropertyTypeNeighborhoodPage = lazy(() => import("./pages/PropertyTypeNeighborhoodPage"));
function LoadingSpinner() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) }));
}
function App() {
    return (_jsxs(_Fragment, { children: [_jsx(Suspense, { fallback: _jsx(LoadingSpinner, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/search", element: _jsx(SearchResults, {}) }), _jsx(Route, { path: "/buy", element: _jsx(SearchResults, {}) }), _jsx(Route, { path: "/rent", element: _jsx(SearchResults, {}) }), _jsx(Route, { path: "/property/:id", element: _jsx(PropertyDetails, {}) }), _jsx(Route, { path: "/add-listing", element: _jsx(AddListing, {}) }), _jsx(Route, { path: "/edit-listing/:id", element: _jsx(EditListing, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/contact", element: _jsx(Contact, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(Privacy, {}) }), _jsx(Route, { path: "/terms", element: _jsx(Terms, {}) }), _jsx(Route, { path: "/agencies", element: _jsx(Agencies, {}) }), _jsx(Route, { path: "/advertise", element: _jsx(Advertise, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: "/casablanca", element: _jsx(CityPage, {}) }), _jsx(Route, { path: "/rabat", element: _jsx(CityPage, {}) }), _jsx(Route, { path: "/marrakech", element: _jsx(CityPage, {}) }), _jsx(Route, { path: "/tanger", element: _jsx(CityPage, {}) }), _jsx(Route, { path: "/agadir", element: _jsx(CityPage, {}) }), _jsx(Route, { path: "/fes", element: _jsx(CityPage, {}) }), _jsx(Route, { path: "/immobilier/:city", element: _jsx(CityImmobilierPage, {}) }), _jsx(Route, { path: "/immobilier/:city/:neighborhood/:propertyType/:transactionType", element: _jsx(PropertyTypeNeighborhoodPage, {}) }), _jsx(Route, { path: "/immobilier/:city/:neighborhood/:propertyType", element: _jsx(PropertyTypeNeighborhoodPage, {}) }), _jsx(Route, { path: "/immobilier/:city/:neighborhood", element: _jsx(NeighborhoodPage, {}) }), _jsx(Route, { path: "/acheter", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-appartement", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-villa", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-maison", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-terrain", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-commercial", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-appartement", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-villa", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-maison", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-commercial", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-casablanca", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-rabat", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-marrakech", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-tanger", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-agadir", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-fes", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-casablanca", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-rabat", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-marrakech", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-tanger", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-agadir", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-fes", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-appartement-:city", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-villa-:city", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/acheter-maison-:city", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-appartement-:city", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-villa-:city", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/louer-maison-:city", element: _jsx(TransactionPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { allowedRoles: ["real_estate_advertiser"], children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/advertising", element: _jsx(ProtectedRoute, { allowedRoles: ["commercial_advertiser"], children: _jsx(Advertising, {}) }) }), _jsx(Route, { path: "/advertising/new", element: _jsx(ProtectedRoute, { allowedRoles: ["commercial_advertiser"], children: _jsx(NewAdRequest, {}) }) }), _jsx(Route, { path: "/commercial-dashboard", element: _jsx(ProtectedRoute, { allowedRoles: ["commercial_advertiser"], children: _jsx(CommercialDashboard, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { allowedRoles: ["admin"], children: _jsx(AdminPanel, {}) }) })] }) }), _jsx(MobileFAB, {})] }));
}
export default App;
