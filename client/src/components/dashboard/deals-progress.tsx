import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DealStage {
  stage: string;
  count: number;
  totalValue: number;
}

// Function to format stage name for display
const formatStageName = (stageName: string): string => {
  return stageName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Function to get color class based on stage
const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'lead':
      return 'bg-primary';
    case 'qualification':
      return 'bg-secondary';
    case 'proposal':
      return 'bg-cyan-500';
    case 'negotiation':
      return 'bg-amber-500';
    case 'closed_won':
      return 'bg-green-500';
    case 'closed_lost':
      return 'bg-red-500';
    default:
      return 'bg-neutral-500';
  }
};

export default function DealsProgress() {
  const { data: dealsByStage, isLoading, error } = useQuery<DealStage[]>({
    queryKey: ['/api/deals/by-stage'],
  });

  // Calculate total deal value for percentages
  const totalDealValue = dealsByStage?.reduce((sum, stage) => sum + stage.totalValue, 0) || 0;

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Active Deals Pipeline</h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">Loading...</p>
        </div>
        <div className="border-t border-neutral-200 px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                <div className="h-2 bg-neutral-100 rounded"></div>
                <div className="h-2 bg-neutral-100 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Active Deals Pipeline</h3>
          <p className="mt-1 max-w-2xl text-sm text-red-500">Error loading deals data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Active Deals Pipeline</h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">Track and manage your sales pipeline.</p>
        </div>
        <div>
          <Link href="/deals">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/5 cursor-pointer"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="border-t border-neutral-200 px-4 py-5 sm:p-6">
        <div className="space-y-6">
          {dealsByStage && dealsByStage.length > 0 ? (
            dealsByStage.map((stage) => {
              // Calculate percentage of total value
              const percentage = totalDealValue > 0 
                ? Math.round((stage.totalValue / totalDealValue) * 100) 
                : 0;
              
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-neutral-700">
                      {formatStageName(stage.stage)}
                    </div>
                    <div className="text-sm font-medium text-neutral-900">
                      ${stage.totalValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2.5">
                    <div 
                      className={`${getStageColor(stage.stage)} h-2.5 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-neutral-500">
                    <div>{stage.count} deals</div>
                    <div>{percentage}%</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-sm text-neutral-500 py-4">
              No deals data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
