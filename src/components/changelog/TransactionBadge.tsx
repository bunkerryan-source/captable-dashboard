import { Badge } from "@/components/ui/Badge";
import { TRANSACTION_TYPE_CONFIG } from "@/lib/constants";
import type { TransactionType } from "@/data/types";

interface TransactionBadgeProps {
  type: TransactionType;
}

export function TransactionBadge({ type }: TransactionBadgeProps) {
  const config = TRANSACTION_TYPE_CONFIG[type];

  return (
    <Badge bgColor={config.bgColor} textColor={config.textColor}>
      {config.label}
    </Badge>
  );
}
