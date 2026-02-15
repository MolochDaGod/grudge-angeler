import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import FishingGame from "@/pages/fishing-game";
import LegendaryCodex from "@/pages/legendary-codex";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/game" component={FishingGame} />
      <Route path="/codex" component={LegendaryCodex} />
      <Route path="/codex/:slug" component={LegendaryCodex} />
      <Route path="/play">{() => <Redirect to="/game" />}</Route>
      <Route path="/legendaries">{() => <Redirect to="/codex" />}</Route>
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
