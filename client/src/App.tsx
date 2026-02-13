import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FishingGame from "@/pages/fishing-game";
import LegendaryCodex from "@/pages/legendary-codex";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FishingGame} />
      <Route path="/legendaries" component={LegendaryCodex} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
