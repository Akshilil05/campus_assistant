import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import RoleSelection from "./pages/RoleSelection";
import StudentLogin from "./pages/student/StudentLogin";
import StudentSignup from "./pages/student/StudentSignup";
import StudentDashboard from "./pages/student/StudentDashboard";
import StaffLogin from "./pages/staff/StaffLogin";
import StaffSignup from "./pages/staff/StaffSignup";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NotFound from "./pages/NotFound";
import EditProfile from './pages/student/editProfile';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <div>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/signup" element={<StudentSignup />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/signup" element={<StaffSignup />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
           <Route path="/student/profile/edit" element={<EditProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  </QueryClientProvider>
);

export default App;
