/**
 * FitPlate - App Root
 * Routing configuration
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import MembershipPage from "./pages/MembershipPage";
import CoachesPage from "./pages/CoachesPage";
import NotificationsPage from "./pages/NotificationsPage";
import WeeklyCheckinPage from "./pages/WeeklyCheckinPage";
import FoodLogPage from "./pages/FoodLogPage";
import FriendsPage from "./pages/FriendsPage";
import DietHubPage from "./pages/DietHubPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes with Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/discover" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/checkin" element={<WeeklyCheckinPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/coaches" element={<CoachesPage />} />
          <Route path="/food-log" element={<FoodLogPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/diet-hub" element={<DietHubPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
