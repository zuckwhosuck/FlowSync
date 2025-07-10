import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Clock, User, Building, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

interface TaskDetailProps {
  taskId: string;
  onBack: () => void;
  onEdit?: () => void;
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

export default function TaskDetail({ taskId, onBack, onEdit }: TaskDetailProps) {
  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 mr-2" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading task details</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {onEdit && (
            <Button onClick={onEdit} size="sm">
              Edit Task
            </Button>
          )}
        </div>
        <CardTitle className="text-xl flex items-center gap-2">
          {task.title}
          <Badge 
            variant="outline" 
            className={getPriorityColor(task.priority || "medium")}
          >
            {task.priority || "medium"}
          </Badge>
          {getStatusBadge(task.status || "pending")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {task.description && (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="mr-1 h-4 w-4" />
              Description
            </div>
            <p className="text-sm">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {task.dueDate && (
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                Due Date
              </div>
              <p className="text-sm font-medium">
                {format(new Date(task.dueDate), "PPP")}
              </p>
            </div>
          )}

          {task.assignedUserId && (
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="mr-1 h-4 w-4" />
                Assigned To
              </div>
              <p className="text-sm font-medium">
                User #{task.assignedUserId}
              </p>
            </div>
          )}

          {task.customerId && (
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="mr-1 h-4 w-4" />
                Customer
              </div>
              <p className="text-sm font-medium">
                Customer #{task.customerId}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Created: {task.createdAt ? format(new Date(task.createdAt), "PPP") : "Unknown"}
          {task.updatedAt && task.updatedAt !== task.createdAt && (
            <span className="ml-2">
              • Updated: {format(new Date(task.updatedAt), "PPP")}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}