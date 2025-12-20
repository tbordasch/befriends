import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IconWithBadgeProps {
  icon: LucideIcon;
  count?: number;
  className?: string;
  iconClassName?: string;
  badgeClassName?: string;
}

export function IconWithBadge({
  icon: Icon,
  count,
  className,
  iconClassName,
  badgeClassName,
}: IconWithBadgeProps) {
  const showBadge = count !== undefined && count > 0;

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Icon className={cn("h-5 w-5", iconClassName)} />
      {showBadge && (
        <Badge
          variant="destructive"
          className={cn(
            "absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center px-1 text-[10px] font-bold",
            badgeClassName
          )}
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </div>
  );
}


