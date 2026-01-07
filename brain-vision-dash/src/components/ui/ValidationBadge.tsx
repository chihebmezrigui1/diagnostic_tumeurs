import { Badge } from "@/components/ui/badge";

export function ValidationBadge({ status }: { status?: "pending" | "approved" | "revised" }) {
  const s = status ?? "pending";
  if (s === "approved")
    return <Badge className="bg-success/10 text-success border-success">Validé</Badge>;
  if (s === "revised")
    return <Badge className="bg-warning/10 text-warning border-warning">Corrigé</Badge>;
  return <Badge className="bg-muted/40 text-foreground border-muted">En attente</Badge>;
}
