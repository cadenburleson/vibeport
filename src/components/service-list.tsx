import type { DevService } from "@/types/service";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard, StoppedServiceCard } from "./service-card";
import { EmptyState } from "./empty-state";

interface StoppedService {
  pid: number;
  name: string;
  project_name: string;
  port: number;
  command: string[];
  cwd: string;
}

interface ServiceListProps {
  services: DevService[];
  stoppedServices: StoppedService[];
  loading: boolean;
  hiddenPorts: Set<number>;
  onStop: (service: DevService) => void;
  onStart: (command: string[], cwd: string) => void;
  onToggleHidden: (port: number) => void;
}

export function ServiceList({
  services,
  stoppedServices,
  loading,
  hiddenPorts,
  onStop,
  onStart,
  onToggleHidden,
}: ServiceListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (services.length === 0 && stoppedServices.length === 0) {
    return <EmptyState />;
  }

  const visibleServices = services.filter((s) => !hiddenPorts.has(s.port));
  const hiddenServices = services.filter((s) => hiddenPorts.has(s.port));

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visibleServices.map((service) => (
        <ServiceCard
          key={service.pid}
          service={service}
          hidden={false}
          onStop={onStop}
          onToggleHidden={onToggleHidden}
        />
      ))}
      {stoppedServices.map((service) => (
        <StoppedServiceCard
          key={`stopped-${service.pid}`}
          name={service.name}
          projectName={service.project_name}
          port={service.port}
          command={service.command}
          cwd={service.cwd}
          onStart={onStart}
        />
      ))}
      {hiddenServices.map((service) => (
        <ServiceCard
          key={service.pid}
          service={service}
          hidden={true}
          onStop={onStop}
          onToggleHidden={onToggleHidden}
        />
      ))}
    </div>
  );
}
