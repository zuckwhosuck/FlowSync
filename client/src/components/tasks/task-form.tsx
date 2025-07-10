import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Customer, Task, Deal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  priority: z.string().optional(),
  status: z.string().optional(),
  customerId: z.coerce.number().optional().nullable(),
  dealId: z.coerce.number().optional().nullable(),
  assignedUserId: z.coerce.number().optional().nullable(),
});

type TaskFormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  task?: Task;
  customerId?: string;
  dealId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ task, customerId, dealId, onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task details if editing
  const { data: taskDetails, isLoading: isLoadingTask } = useQuery<Task>({
    queryKey: ["/api/tasks", task?.id?.toString()],
    queryFn: async () => {
      if (!task?.id) throw new Error("Task ID is required");
      const response = await fetch(`/api/tasks/${task.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch task details");
      }
      return response.json();
    },
    enabled: !!task?.id, // Only fetch if we have task ID
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Determine customer ID from params or task details
  const effectiveCustomerId = customerId || taskDetails?.customerId?.toString();
  
  // Fetch deals for dropdown if customer is selected
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals", effectiveCustomerId ? parseInt(effectiveCustomerId) : null],
    queryFn: async () => {
      if (!effectiveCustomerId) return [];
      const response = await fetch(`/api/customers/${effectiveCustomerId}/deals`);
      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }
      return response.json();
    },
    enabled: !!effectiveCustomerId, // Only fetch deals if customerId is provided
  });

  // Initialize form with default values or existing task values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: taskDetails?.title || "",
      description: taskDetails?.description || "",
      dueDate: taskDetails?.dueDate ? new Date(taskDetails.dueDate) : null,
      priority: taskDetails?.priority || "medium",
      status: taskDetails?.status || "pending",
      customerId: effectiveCustomerId ? parseInt(effectiveCustomerId) : null,
      dealId: dealId ? parseInt(dealId) : taskDetails?.dealId || null,
      assignedUserId: taskDetails?.assignedUserId || null,
    },
  });
  
  // Update form values when task details are loaded
  useEffect(() => {
    if (taskDetails) {
      form.reset({
        title: taskDetails.title || "",
        description: taskDetails.description || "",
        dueDate: taskDetails.dueDate ? new Date(taskDetails.dueDate) : null,
        priority: taskDetails.priority || "medium",
        status: taskDetails.status || "pending",
        customerId: effectiveCustomerId ? parseInt(effectiveCustomerId) : null,
        dealId: dealId ? parseInt(dealId) : taskDetails.dealId || null,
        assignedUserId: taskDetails.assignedUserId || null,
      });
    }
  }, [taskDetails, form, dealId, effectiveCustomerId]);

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const apiData = {
        ...data,
        // Convert date object to ISO string for server side validation
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      };
      return apiRequest("POST", "/api/tasks", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/due-today"] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      }
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId] });
      }
      toast({
        title: "Task created",
        description: "The task has been created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create task:", error);
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const apiData = {
        ...data,
        // Convert date object to ISO string for server side validation
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      };
      if (!task || !task.id) {
        throw new Error("Task ID is required for update");
      }
      return apiRequest("PUT", `/api/tasks/${task.id}`, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/due-today"] });
      if (task?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id.toString()] });
      }
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      }
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId] });
      }
      toast({
        title: "Task updated",
        description: "The task has been updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update task:", error);
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    setIsLoading(true);
    try {
      if (task && task.id) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="Task title" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const numValue = parseInt(value, 10);
                    field.onChange(numValue === 0 ? null : numValue);
                  }}
                  defaultValue={field.value?.toString() || "0"}
                  disabled={!!customerId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "medium"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "pending"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dealId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Deal</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const numValue = parseInt(value, 10);
                    field.onChange(numValue === 0 ? null : numValue);
                  }}
                  defaultValue={field.value?.toString() || "0"}
                  disabled={!!dealId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {deals.map((deal: Deal) => (
                      <SelectItem key={deal.id} value={deal.id.toString()}>
                        {deal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Task description" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span>Saving...</span>
            ) : task ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}