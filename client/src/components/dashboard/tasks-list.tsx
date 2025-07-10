import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Edit, 
  MoreVertical, 
  Plus, 
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function TasksList() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: todaysTasks = [], isLoading: isTodayLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks/due-today'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/tasks/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/due-today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Task updated",
        description: "The task status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/due-today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTaskToggle = (taskId: number, checked: boolean) => {
    // Update local state for immediate UI feedback
    if (checked) {
      setCompletedTaskIds(prev => [...prev, taskId]);
    } else {
      setCompletedTaskIds(prev => prev.filter(id => id !== taskId));
    }

    // Update task status in database
    updateTaskMutation.mutate({
      id: taskId,
      status: checked ? 'completed' : 'pending',
    });
  };

  // Handle delete task
  const handleDeleteTask = (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(id);
    }
  };

  // Function to navigate to task form
  const handleNewTask = () => {
    navigate("/tasks");
  };

  // Function to navigate to edit task
  const handleEditTask = (taskId: string) => {
    navigate(`/tasks?id=${taskId}`);
  };

  // Function to get badge styling based on priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">High</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Urgent</Badge>;
      default:
        return null;
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

  // Format time from timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter tasks based on active tab
  const filteredTasks = activeTab === "today" 
    ? todaysTasks
    : tasks?.filter((task) => {
        if (activeTab === "all") return true;
        if (activeTab === "pending") return task.status === "pending";
        if (activeTab === "in_progress") return task.status === "in_progress";
        if (activeTab === "completed") return task.status === "completed";
        return true;
      }) || [];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Today's Tasks</h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            {isTodayLoading ? 'Loading...' : `${todaysTasks?.length || 0} tasks due today`}
          </p>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/5"
            onClick={handleNewTask}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="border-t border-neutral-200 px-4 py-3">
        <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="px-4 py-4">
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-neutral-200 rounded"></div>
                      <div className="h-4 bg-neutral-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks && filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const isCompleted = task.status === 'completed' || completedTaskIds.includes(task.id);
                    
                    return (
                      <div key={task.id} className="border-b pb-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={isCompleted}
                                onCheckedChange={(checked) => 
                                  handleTaskToggle(task.id, checked as boolean)
                                }
                                className="h-4 w-4 mt-1"
                              />
                              <label
                                htmlFor={`task-${task.id}`}
                                className={`ml-2 block text-sm font-medium ${
                                  isCompleted 
                                    ? 'line-through text-neutral-400' 
                                    : 'text-neutral-700'
                                }`}
                              >
                                {task.title}
                              </label>
                              {!isCompleted && task.priority && (
                                <span className="ml-2">
                                  {getPriorityBadge(task.priority)}
                                </span>
                              )}
                              {getStatusBadge(task.status || "pending")}
                            </div>
                            {task.description && (
                              <p className="text-sm text-neutral-500 ml-7 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-neutral-500 ml-7">
                                <Clock className="h-3 w-3 mr-1" />
                                Due: {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : ''} {task.dueDate ? `at ${formatTime(task.dueDate)}` : ''}
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
                              <DropdownMenuItem onClick={() => handleEditTask(task.id.toString())}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {task.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() => updateTaskMutation.mutate({ 
                                    id: task.id, 
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
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-neutral-500">
                    {activeTab === "today" ? "No tasks due today" : "No tasks found"}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="pt-4 text-center border-t border-neutral-200 mt-4">
          <Link href="/tasks">
            <Button
              variant="outline"
              size="sm"
              className="text-neutral-700"
            >
              View All Tasks
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
