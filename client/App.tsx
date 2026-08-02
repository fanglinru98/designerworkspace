import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/projects"
            element={<Placeholder title="项目总览" />}
          />
          <Route
            path="/assets"
            element={<Placeholder title="设计资产" />}
          />
          <Route
            path="/inspiration"
            element={<Placeholder title="灵感库" />}
          />
          <Route
            path="/collaboration"
            element={<Placeholder title="团队协作" />}
          />
          <Route
            path="/analytics"
            element={<Placeholder title="数据洞察" />}
          />
          <Route
            path="/library"
            element={<Placeholder title="素材库" />}
          />
          <Route
            path="/settings"
            element={<Placeholder title="设置中心" />}
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
