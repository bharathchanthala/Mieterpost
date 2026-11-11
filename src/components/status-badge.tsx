import { Badge } from "@/components/ui/badge";
import type { Message } from "@/db/schema";
import { categoryLabels, statusLabels } from "@/lib/format";

// New messages stand out; handled ones are visually quieter.
const statusVariant = {
  new: "default",
  drafted: "secondary",
  answered: "outline",
} as const;

export function StatusBadge({ status }: { status: Message["status"] }) {
  return <Badge variant={statusVariant[status]}>{statusLabels[status]}</Badge>;
}

export function CategoryBadge({ category }: { category: Message["category"] }) {
  // The AI agent sets the category in milestone 3; until then it is null.
  if (!category) return null;
  return <Badge variant="outline">{categoryLabels[category]}</Badge>;
}
