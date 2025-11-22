import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminViewProvider } from "./contexts/AdminViewContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { PlanProvider } from "./contexts/PlanContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

// Critical routes - loaded immediately (no lazy loading for better performance)
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import CardForm from "./pages/CardForm";
import FormBuilder from "./pages/FormBuilder";
import FormsList from "./pages/FormsList";
import ListBuilder from "./pages/ListBuilder";

// Non-critical routes - lazy loaded
const UserPage = lazy(() => import("./pages/UserPage"));
const PublicForm = lazy(() => import("./pages/PublicForm"));
const PublicList = lazy(() => import("./pages/PublicList"));
const FormSubmissions = lazy(() => import("./pages/FormSubmissions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CreateProfile = lazy(() => import("./pages/CreateProfile"));
const Invite = lazy(() => import("./pages/Invite"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Support = lazy(() => import("./pages/Support"));
const DevPortal = lazy(() => import("./pages/DevPortal"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground">Carregando...</p>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <LanguageProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <PlanProvider>
                  <AdminViewProvider>
                    <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/update-password" element={<UpdatePassword />} />
                      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                      <Route path="/dashboard/profiles" element={<Layout><UserManagement /></Layout>} />
                      <Route path="/dashboard/profiles/new" element={<Layout><CreateProfile /></Layout>} />
                      <Route path="/profile" element={<Layout><Profile /></Layout>} />
                      <Route path="/dashboard/card/new" element={<Layout><CardForm /></Layout>} />
                      <Route path="/dashboard/card/:id" element={<Layout><CardForm /></Layout>} />
                      <Route path="/dashboard/form" element={<Layout><FormsList /></Layout>} />
                      <Route path="/dashboard/form/new" element={<Layout><FormBuilder /></Layout>} />
                      <Route path="/dashboard/form/:id" element={<Layout><FormBuilder /></Layout>} />
                      <Route path="/dashboard/form/:id/submissions" element={<Layout><FormSubmissions /></Layout>} />
                      <Route path="/dashboard/list/new" element={<Layout><ListBuilder /></Layout>} />
                      <Route path="/dashboard/list/:id" element={<Layout><ListBuilder /></Layout>} />
                      <Route path="/:username/form/:slug" element={<PublicForm />} />
                      <Route path="/:username/list/:slug" element={<PublicList />} />
                      <Route path="/invite/:token" element={<Invite />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/support" element={<Layout><Support /></Layout>} />
                      <Route path="/dev" element={<Layout><DevPortal /></Layout>} />
                      <Route path="/dashboard/affiliate" element={<Layout><AffiliateDashboard /></Layout>} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="/:username" element={<UserPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  </AdminViewProvider>
                </PlanProvider>
              </AuthProvider>
            </BrowserRouter>
          </LanguageProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;