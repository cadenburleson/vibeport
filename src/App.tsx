import { useState, useCallback } from "react";
import { useServices } from "@/hooks/use-services";
import { Header } from "@/components/header";
import { ServiceList } from "@/components/service-list";

function loadHiddenPorts(): Set<number> {
  try {
    const raw = localStorage.getItem("vibeport:hiddenPorts");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveHiddenPorts(ports: Set<number>) {
  localStorage.setItem("vibeport:hiddenPorts", JSON.stringify([...ports]));
}

function App() {
  const {
    services,
    stoppedServices,
    loading,
    error,
    scan,
    stopService,
    startService,
  } = useServices();

  const [hiddenPorts, setHiddenPorts] = useState<Set<number>>(loadHiddenPorts);

  const toggleHidden = useCallback((port: number) => {
    setHiddenPorts((prev) => {
      const next = new Set(prev);
      if (next.has(port)) next.delete(port);
      else next.add(port);
      saveHiddenPorts(next);
      return next;
    });
  }, []);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Header serviceCount={services.length} onRefresh={scan} />
      <main className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <ServiceList
          services={services}
          stoppedServices={stoppedServices}
          loading={loading}
          hiddenPorts={hiddenPorts}
          onStop={stopService}
          onStart={startService}
          onToggleHidden={toggleHidden}
        />
      </main>
    </div>
  );
}

export default App;
