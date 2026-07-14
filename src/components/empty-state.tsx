import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon, title, description, action,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>}
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function ComingSoon({
  title, description, points,
}: { title: string; description: string; points?: string[] }) {
  return (
    <Card>
      <CardContent className="py-10">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        {points && (
          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            {points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
