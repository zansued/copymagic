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
import CampaignPlanning from "./pages/CampaignPlanning";
import LandingBuilder from "./pages/LandingBuilder";
import Auth from "./pages/Auth";
import AgentsHub from "./pages/AgentsHub";
import AgentSetup from "./pages/AgentSetup";
import AgentWorkspace from "./pages/AgentWorkspace";
import StorytellingAgent from "./pages/StorytellingAgent";
import BrandProfiles from "./pages/BrandProfiles";
import BrandProfileEdit from "./pages/BrandProfileEdit";
import MentorPage from "./pages/MentorPage";
import Roadmap from "./pages/Roadmap";
import Dashboard from "./pages/Dashboard";
import SharedWithMe from "./pages/SharedWithMe";
import SharedOutput from "./pages/SharedOutput";
import Pricing from "./pages/Pricing";
import AdminPanel from "./pages/AdminPanel";
import OfferResearch from "./pages/OfferResearch";
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
            <Route path="/" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/project/:id/summary" element={<ProtectedRoute><ProjectSummary /></ProtectedRoute>} />
            <Route path="/project/:id/campaign" element={<ProtectedRoute><CampaignPlanning /></ProtectedRoute>} />
            <Route path="/landing-builder" element={<ProtectedRoute><LandingBuilder /></ProtectedRoute>} />
            <Route path="/web-generator" element={<ProtectedRoute><LandingBuilder /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><AgentsHub /></ProtectedRoute>} />
            <Route path="/agents/setup" element={<ProtectedRoute><AgentSetup /></ProtectedRoute>} />
            <Route path="/agents/storytelling-adapter" element={<ProtectedRoute><StorytellingAgent /></ProtectedRoute>} />
            <Route path="/agents/:agentId" element={<ProtectedRoute><AgentWorkspace /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/mentor" element={<ProtectedRoute><MentorPage /></ProtectedRoute>} />
            <Route path="/brand-profiles" element={<ProtectedRoute><BrandProfiles /></ProtectedRoute>} />
            <Route path="/brand-profiles/:id" element={<ProtectedRoute><BrandProfileEdit /></ProtectedRoute>} />
            <Route path="/shared-with-me" element={<ProtectedRoute><SharedWithMe /></ProtectedRoute>} />
            <Route path="/shared/:token" element={<SharedOutput />} />
            <Route path="/offer-research" element={<ProtectedRoute><OfferResearch /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
