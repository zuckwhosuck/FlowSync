import { useState, useEffect } from "react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertMeetingSchema, Meeting, Customer } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Extending the meeting schema for form validation
const formSchema = insertMeetingSchema.extend({
  title: z.string().min(1, "Title is required"),
  startTime: z.date(),
  endTime: z.date(),
  startHour: z.string(),
  startMinute: z.string(),
  endHour: z.string(),
  endMinute: z.string(),
  customerId: z.string().or(z.number()).refine(val => !!val, "Customer is required"),
  status: z.string().min(1, "Status is required"),
});

type MeetingFormValues = Omit<z.infer<typeof formSchema>, "startTime" | "endTime" | "customerId"> & { 
  startTime: Date; 
  endTime: Date;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  customerId: string;
};

interface MeetingFormProps {
  meeting?: Meeting;
  meetingId?: string;
  customerId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MeetingForm({ meeting, meetingId, customerId, onSuccess, onCancel }: MeetingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meeting if meetingId is provided but no meeting object
  const { data: fetchedMeeting } = useQuery<Meeting>({
    queryKey: meetingId ? ["/api/meetings", meetingId] : null,
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!meetingId && !meeting
  });

  // Use either the passed meeting prop or the fetched meeting
  const activeMeeting = meeting || fetchedMeeting;

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Create time options for dropdowns
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  // Parse existing meeting times
  const getTimeComponents = (dateStr?: string | Date) => {
    if (!dateStr) return { hour: "09", minute: "00" };
    
    const date = new Date(dateStr);
    return {
      hour: date.getHours().toString().padStart(2, '0'),
      minute: date.getMinutes().toString().padStart(2, '0')
    };
  };

  const startTime = activeMeeting?.startTime ? new Date(activeMeeting.startTime) : new Date();
  const endTime = activeMeeting?.endTime ? new Date(activeMeeting.endTime) : new Date(new Date().setHours(startTime.getHours() + 1));
  
  const startTimeComponents = getTimeComponents(activeMeeting?.startTime);
  const endTimeComponents = getTimeComponents(activeMeeting?.endTime);

  // Create default values with required fields guaranteed to have values
  const defaultValues: MeetingFormValues = {
    title: activeMeeting?.title || "",
    startTime: startTime,
    endTime: endTime,
    startHour: startTimeComponents.hour,
    startMinute: startTimeComponents.minute,
    endHour: endTimeComponents.hour,
    endMinute: endTimeComponents.minute,
    location: activeMeeting?.location || "",
    customerId: (activeMeeting?.customerId?.toString() || customerId || ""),
    status: activeMeeting?.status || "scheduled",
    notes: activeMeeting?.notes || "",
  };

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Reset form when meeting or fetchedMeeting changes
  useEffect(() => {
    if (activeMeeting) {
      form.reset(defaultValues);
    }
  }, [activeMeeting, form, defaultValues, customerId]);

  // Combine date and time for API submission
  const combineDateAndTime = (date: Date, hour: string, minute: string): string => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(hour, 10));
    newDate.setMinutes(parseInt(minute, 10));
    return newDate.toISOString();
  };

  const createMutation = useMutation({
    mutationFn: async (data: MeetingFormValues) => {
      // Convert form values to API data format
      const apiData = {
        title: data.title,
        startTime: combineDateAndTime(data.startTime, data.startHour, data.startMinute),
        endTime: combineDateAndTime(data.endTime, data.endHour, data.endMinute),
        location: data.location,
        customerId: parseInt(data.customerId.toString(), 10),
        status: data.status,
        notes: data.notes,
      };
      
      return apiRequest("POST", "/api/meetings", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "meetings"] });
      }
      toast({
        title: "Meeting created",
        description: "The meeting has been created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create meeting:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MeetingFormValues) => {
      // Convert form values to API data format
      const apiData = {
        title: data.title,
        startTime: combineDateAndTime(data.startTime, data.startHour, data.startMinute),
        endTime: combineDateAndTime(data.endTime, data.endHour, data.endMinute),
        location: data.location,
        customerId: parseInt(data.customerId.toString(), 10),
        status: data.status,
        notes: data.notes,
      };

      if (!activeMeeting || !activeMeeting.id) {
        throw new Error("Meeting ID is required for update");
      }
      
      return apiRequest("PUT", `/api/meetings/${activeMeeting.id}`, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      if (activeMeeting?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/meetings", activeMeeting.id.toString()] });
      }
      if (activeMeeting?.customerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/customers", activeMeeting.customerId.toString(), "meetings"] 
        });
      }
      toast({
        title: "Meeting updated",
        description: "The meeting has been updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update meeting. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update meeting:", error);
    },
  });

  const onSubmit = async (values: MeetingFormValues) => {
    setIsLoading(true);
    try {
      if (activeMeeting && activeMeeting.id) {
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
                <FormLabel>Meeting Title</FormLabel>
                <FormControl>
                  <Input placeholder="Meeting title" {...field} value={field.value || ""} />
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
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                  disabled={!!customerId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Meeting location" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Start Time</FormLabel>
            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              
              <div className="flex space-x-1 items-center">
                <FormField
                  control={form.control}
                  name="startHour"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hours.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <span>:</span>
                <FormField
                  control={form.control}
                  name="startMinute"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {minutes.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <FormLabel>End Time</FormLabel>
            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              
              <div className="flex space-x-1 items-center">
                <FormField
                  control={form.control}
                  name="endHour"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hours.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <span>:</span>
                <FormField
                  control={form.control}
                  name="endMinute"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {minutes.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Meeting notes, agenda, etc." 
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
            ) : activeMeeting ? (
              "Update Meeting"
            ) : (
              "Create Meeting"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}