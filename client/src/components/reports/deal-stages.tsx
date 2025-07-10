import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface DealStage {
  stage: string;
  count: number;
  totalValue: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function DealStages() {
  const [tab, setTab] = React.useState<"value" | "count">("value");

  const { data: dealStages, isLoading } = useQuery<DealStage[]>({
    queryKey: ["/api/deals/by-stage"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Calculate percentages for the data
  const processData = (data: DealStage[] | undefined, type: "value" | "count") => {
    if (!data || data.length === 0) return [];
    
    // Filter out stages with 0 count to avoid clutter
    const filteredData = data.filter(stage => stage.count > 0);
    
    // Calculate total
    const total = filteredData.reduce(
      (sum, stage) => sum + (type === "value" ? stage.totalValue : stage.count),
      0
    );
    
    // Format data for chart
    return filteredData.map((stage, index) => ({
      name: STAGE_LABELS[stage.stage] || stage.stage,
      value: type === "value" ? stage.totalValue : stage.count,
      percentage: Math.round(
        ((type === "value" ? stage.totalValue : stage.count) / total) * 100
      ),
      color: COLORS[index % COLORS.length],
    }));
  };

  const valueData = processData(dealStages, "value");
  const countData = processData(dealStages, "count");
  
  const chartData = tab === "value" ? valueData : countData;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Stages Distribution</CardTitle>
        <CardDescription>
          Breakdown of deals by stage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="value" value={tab} onValueChange={(v) => setTab(v as "value" | "count")}>
          <TabsList>
            <TabsTrigger value="value">By Value</TabsTrigger>
            <TabsTrigger value="count">By Count</TabsTrigger>
          </TabsList>
          <TabsContent value="value" className="pt-4">
            <div className="h-[300px]">
              {valueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={valueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {valueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Value']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No deal data available</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="count" className="pt-4">
            <div className="h-[300px]">
              {countData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {countData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Count']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No deal data available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}