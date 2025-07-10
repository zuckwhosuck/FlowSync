import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  Edit,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface TaskListProps {
  customerId?: string;
  dealId?: string;
  onNewTask?: () => void;
  onEditTask?: (taskId: string) => void;
}

// Get badge color based on priority
const getPriorityColor = (priority: string | null | undefined) => {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-blue-100 text-blue-800";
    case "high":
      return "bg-amber-100 text-amber-800";
    case "urgent":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Get badge text for status
const getStatusBadge = (status: string | null | undefined) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-gray-100">Pending</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function TaskList({ customerId, dealId, onNewTask, onEditTask }: TaskListProps) {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for tasks, filtered by customer or deal if provided
  const queryKey = customerId
    ? ["/api/customers", customerId, "tasks"]
    : dealId
    ? ["/api/deals", dealId, "tasks"]
    : ["/api/tasks"];
      
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey,
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: string }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/due-today"] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "tasks"] });
      }
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "tasks"] });
      }
      toast({
        title: "Task updated",
        description: "The task status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update task status:", error);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/due-today"] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "tasks"] });
      }
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId, "tasks"] });
      }
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete task:", error);
    },
  });

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return task.status === "pending";
    if (activeTab === "in_progress") return task.status === "in_progress";
    if (activeTab === "completed") return task.status === "completed";
    return true;
  });

  // Handle delete task
  const handleDeleteTask = (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Tasks</CardTitle>
        {onNewTask && (
          <Button onClick={onNewTask} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New Task
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between border-b pb-4"
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No tasks found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new task for this {customerId ? "customer" : dealId ? "deal" : "project"}.
                </p>
                {onNewTask && (
                  <div className="mt-6">
                    <Button onClick={onNewTask} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Task
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between border-b pb-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(task.priority || "medium")}
                        >
                          {task.priority || "medium"}
                        </Badge>
                        {getStatusBadge(task.status || "pending")}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditTask && (
                          <DropdownMenuItem onClick={() => onEditTask(task.id.toString())}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {task.status !== "completed" && (
                          <DropdownMenuItem
                            onClick={() => updateTaskStatusMutation.mutate({ 
                              taskId: task.id, 
                              status: "completed" 
                            })}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}