import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Deal } from "@shared/schema";

type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

export default function SalesByPeriod() {
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [tab, setTab] = useState<"chart" | "table">("chart");

  // Fetch all deals
  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Define period data type
  type PeriodData = {
    name: string;
    startDate: Date;
    endDate: Date;
    value: number;
    count: number;
  };

  // Group and aggregate data by the selected period
  const getSalesByPeriod = () => {
    if (!deals || deals.length === 0) return [];

    const now = new Date();
    const periods: PeriodData[] = [];

    // Generate periods based on selection
    if (period === "weekly") {
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i * 7 + 7));
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        periods.push({
          name: `Week ${8 - i}`,
          startDate: start,
          endDate: end,
          value: 0,
          count: 0,
        });
      }
    } else if (period === "monthly") {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(now.getMonth() - i);
        
        // Format month name
        const monthName = month.toLocaleString('default', { month: 'short' });
        
        periods.push({
          name: monthName,
          startDate: new Date(month.getFullYear(), month.getMonth(), 1),
          endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0),
          value: 0,
          count: 0,
        });
      }
    } else if (period === "quarterly") {
      // Last 4 quarters
      for (let i = 3; i >= 0; i--) {
        const quarter = Math.floor((now.getMonth() - (i * 3)) / 3) + 1;
        const year = now.getFullYear() - (quarter < 1 ? 1 : 0);
        const adjustedQuarter = quarter < 1 ? quarter + 4 : quarter;
        
        periods.push({
          name: `Q${adjustedQuarter} ${year}`,
          startDate: new Date(year, (adjustedQuarter - 1) * 3, 1),
          endDate: new Date(year, adjustedQuarter * 3, 0),
          value: 0,
          count: 0,
        });
      }
    } else if (period === "yearly") {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        periods.push({
          name: year.toString(),
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31),
          value: 0,
          count: 0,
        });
      }
    }

    // Aggregate deal values by period
    deals.forEach(deal => {
      if (!deal.createdAt) return;
      
      const dealDate = new Date(deal.createdAt);
      
      periods.forEach(p => {
        if (dealDate >= p.startDate && dealDate <= p.endDate) {
          p.value += Number(deal.value || 0);
          p.count += 1;
        }
      });
    });

    // Clean up data for display
    return periods.map(p => ({
      name: p.name,
      value: Math.round(p.value * 100) / 100,
      count: p.count,
    }));
  };

  const chartData = getSalesByPeriod();

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
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>Value of deals created over time</CardDescription>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as PeriodType)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" value={tab} onValueChange={(v) => setTab(v as "chart" | "table")}>
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Value']}
                />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Sales value" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="table" className="pt-4">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-medium">
                    <th className="py-3 px-4 text-left">Period</th>
                    <th className="py-3 px-4 text-left">Deals Count</th>
                    <th className="py-3 px-4 text-left">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4">{item.count}</td>
                      <td className="py-3 px-4">${item.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}