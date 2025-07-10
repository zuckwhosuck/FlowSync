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
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@shared/schema";

export default function TaskCompletionChart() {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Process task data by status
  const processTaskData = () => {
    if (!tasks || tasks.length === 0) return [];

    // Initialize count map with all possible statuses
    const statusCounts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    
    // Count tasks by status
    tasks.forEach(task => {
      const status = task.status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Map to array format for chart
    const data = [
      { name: "Pending", value: statusCounts.pending, color: "#FFBB28" },
      { name: "In Progress", value: statusCounts.in_progress, color: "#0088FE" },
      { name: "Completed", value: statusCounts.completed, color: "#00C49F" },
      { name: "Cancelled", value: statusCounts.cancelled, color: "#FF8042" },
    ];
    
    // Filter out zero values
    return data.filter(item => item.value > 0);
  };

  const chartData = processTaskData();
  const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);
  const completedTasks = chartData.find(item => item.name === "Completed")?.value || 0;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
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
        <CardTitle>Task Completion</CardTitle>
        <CardDescription>
          Breakdown of tasks by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <p className="text-lg font-medium">Completion Rate</p>
            <p className="text-3xl font-bold">{completionRate}%</p>
            <p className="text-sm text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>
          <div className="h-[240px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No task data available</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}