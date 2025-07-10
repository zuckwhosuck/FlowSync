import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { insertDealSchema, Deal, Customer } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertDealSchema.extend({
  stage: z.string().min(1, "Stage is required"),
  customerId: z.string().or(z.number()).refine(val => !!val, "Customer is required"),
  expectedCloseDate: z.date().optional(),
  value: z.string().or(z.number()).optional(),
  probability: z.string().or(z.number()).optional(),
});

type DealFormValues = Omit<z.infer<typeof formSchema>, "customerId"> & { customerId: string };

interface DealFormProps {
  deal?: Deal;
  customerId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DealForm({ deal, customerId, onSuccess, onCancel }: DealFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Create default values with required fields guaranteed to have values
  const defaultValues: DealFormValues = {
    name: deal?.name || "",
    stage: deal?.stage || "lead",
    customerId: (deal?.customerId?.toString() || customerId || ""),
    value: deal?.value !== null ? deal?.value?.toString() : "",
    currency: deal?.currency || "USD",
    probability: deal?.probability !== null ? deal?.probability?.toString() : "0",
    notes: deal?.notes || "",
    expectedCloseDate: deal?.expectedCloseDate ? new Date(deal.expectedCloseDate) : undefined,
  };

  const form = useForm<DealFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Reset form when deal prop changes
  useEffect(() => {
    if (deal) {
      form.reset(defaultValues);
    }
  }, [deal, form, defaultValues, customerId]);

  const createMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      // Convert values to appropriate types for API
      const apiData = {
        ...data,
        value: data.value ? parseFloat(data.value.toString()) : 0,
        probability: data.probability ? parseInt(data.probability.toString(), 10) : 0,
        customerId: parseInt(data.customerId.toString(), 10),
        // Convert date object to ISO string for server side validation
        expectedCloseDate: data.expectedCloseDate ? data.expectedCloseDate.toISOString() : null,
      };
      return apiRequest("POST", "/api/deals", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "deals"] });
      }
      toast({
        title: "Deal created",
        description: "The deal has been created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create deal:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      // Convert values to appropriate types for API
      const apiData = {
        ...data,
        value: data.value ? parseFloat(data.value.toString()) : 0,
        probability: data.probability ? parseInt(data.probability.toString(), 10) : 0,
        customerId: parseInt(data.customerId.toString(), 10),
        // Convert date object to ISO string for server side validation
        expectedCloseDate: data.expectedCloseDate ? data.expectedCloseDate.toISOString() : null,
      };
      if (!deal || !deal.id) {
        throw new Error("Deal ID is required for update");
      }
      return apiRequest("PUT", `/api/deals/${deal.id}`, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      if (deal?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", deal.id.toString()] });
      }
      if (deal?.customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", deal.customerId.toString(), "deals"] });
      }
      toast({
        title: "Deal updated",
        description: "The deal has been updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update deal. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update deal:", error);
    },
  });

  const onSubmit = async (values: DealFormValues) => {
    setIsLoading(true);
    try {
      if (deal && deal.id) {
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deal Name</FormLabel>
                <FormControl>
                  <Input placeholder="Deal name" {...field} value={field.value || ""} />
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
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deal Value</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualification">Qualification</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0" 
                    {...field} 
                    value={field.value || "0"}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expectedCloseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected Close Date</FormLabel>
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
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about the deal" 
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
            ) : deal ? (
              "Update Deal"
            ) : (
              "Create Deal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}