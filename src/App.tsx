import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSummary from "./pages/ProjectSummary";
import LandingBuilder from "./pages/LandingBuilder";
import Auth from "./pages/Auth";
import AgentsHub from "./pages/AgentsHub";
import AgentSetup from "./pages/AgentSetup";
import AgentWorkspace from "./pages/AgentWorkspace";
import StorytellingAgent from "./pages/StorytellingAgent";
import BrandProfiles from "./pages/BrandProfiles";
import BrandProfileEdit from "./pages/BrandProfileEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/project/:id/summary" element={<ProtectedRoute><ProjectSummary /></ProtectedRoute>} />
            <Route path="/landing-builder" element={<ProtectedRoute><LandingBuilder /></ProtectedRoute>} />
            <Route path="/web-generator" element={<ProtectedRoute><LandingBuilder /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><AgentsHub /></ProtectedRoute>} />
            <Route path="/agents/setup" element={<ProtectedRoute><AgentSetup /></ProtectedRoute>} />
            <Route path="/agents/storytelling-adapter" element={<ProtectedRoute><StorytellingAgent /></ProtectedRoute>} />
            <Route path="/agents/:agentId" element={<ProtectedRoute><AgentWorkspace /></ProtectedRoute>} />
            <Route path="/brand-profiles" element={<ProtectedRoute><BrandProfiles /></ProtectedRoute>} />
            <Route path="/brand-profiles/:id" element={<ProtectedRoute><BrandProfileEdit /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
