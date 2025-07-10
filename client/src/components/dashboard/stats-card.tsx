import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  change?: number;
  changeLabel?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  change,
  changeLabel = "vs last month"
}: StatsCardProps) {
  // Determine if change is positive, negative or neutral
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  // Format the change value
  const formattedChange = change ? Math.abs(change).toFixed(1) + '%' : null;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn(
            "flex-shrink-0 rounded-md p-3",
            iconBgColor
          )}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-neutral-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className={cn(
                "text-sm font-medium flex items-center",
                isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-neutral-600"
              )}>
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : isNegative ? (
                  <ArrowDown className="h-4 w-4 mr-1" />
                ) : null}
                <span>{formattedChange}</span>
              </div>
              <div className="text-sm text-neutral-500">{changeLabel}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
