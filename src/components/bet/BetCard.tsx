import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Users, Calendar, Coins } from "lucide-react"
import Link from "next/link"

export type BetStatus = "open" | "active" | "voting" | "completed"

export interface BetCardProps {
  id: string | number
  title: string
  description: string
  stake: number // Individual stake per participant
  participants: number
  potSize: number // Total pot (stake * participants)
  status: BetStatus
  deadline: string // ISO date string
}

const statusConfig: Record<
  BetStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  voting: {
    label: "Voting",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  },
}

export function BetCard({
  id,
  title,
  description,
  stake,
  participants,
  potSize,
  status,
  deadline,
}: BetCardProps) {
  const statusInfo = statusConfig[status]
  
  // Calculate days until deadline
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day for accurate day calculation
  deadlineDate.setHours(0, 0, 0, 0)
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  const deadlineDisplay = daysUntilDeadline > 0 
    ? `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left`
    : daysUntilDeadline === 0
    ? "Today"
    : "Overdue"
  
  const deadlineDateDisplay = new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link href={`/bets/${id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
                statusInfo.className
              )}
            >
              {statusInfo.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>Pot Size</span>
              </div>
              <span className="text-sm font-semibold">{potSize} pts</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Participants</span>
              </div>
              <span className="text-sm font-semibold">{participants}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Deadline</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{deadlineDateDisplay}</div>
                <div className="text-xs text-muted-foreground">{deadlineDisplay}</div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Your Stake</span>
                <span className="font-medium">{stake} pts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

