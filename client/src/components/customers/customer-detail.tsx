import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, Mail, Phone, Globe, MapPin, Trash2, PenSquare, 
  Users, DollarSign, Calendar, MessageSquareText, UserPlus, 
  User, Briefcase, Plus, CheckCircle2, Loader2
} from "lucide-react";
import { Customer, Contact, InsertContact } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CustomerForm from "./customer-form";
import DealList from "@/components/deals/deal-list";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import TaskList from "@/components/tasks/task-list";
import MeetingList from "@/components/meetings/meeting-list";
import InteractionList from "@/components/interactions/interaction-list";

// Contact form schema
const contactFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  jobTitle: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  isPrimary: z.boolean().default(false),
  customerId: z.number()
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// ContactsList component
interface ContactsListProps {
  customerId: string;
}

function ContactsList({ customerId }: ContactsListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch contacts for this customer
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/customers", customerId, "contacts"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Form for adding/editing contacts
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      email: "",
      phone: "",
      notes: "",
      isPrimary: false,
      customerId: parseInt(customerId)
    }
  });
  
  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "contacts"] });
      toast({
        title: "Contact added",
        description: "The contact has been added successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to add contact:", error);
    }
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest("DELETE", `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "contacts"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete contact:", error);
    }
  });
  
  // Handle form submission
  const onSubmit = (values: ContactFormValues) => {
    createContactMutation.mutate(values);
  };
  
  // Handle delete contact
  const handleDeleteContact = (id: number) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>
          Contacts
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add contact information for this customer.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createContactMutation.isPending}>
                    {createContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No contacts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding contact information for this customer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                      {contact.jobTitle && (
                        <Badge variant="outline" className="ml-2">
                          {contact.jobTitle}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {contact.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${contact.email}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
}

export default function CustomerDetail({ customerId, onBack }: CustomerDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer deleted",
        description: "The customer has been deleted successfully",
      });
      onBack();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete customer:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">Error loading customer</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error instanceof Error ? error.message : "Customer not found"}
        </p>
        <Button onClick={onBack} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Customer</h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
        <CustomerForm 
          customer={customer} 
          onSuccess={() => setIsEditing(false)} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} size="sm">
          Back to Customers
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the customer
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <CardDescription>{customer.industry || "No industry specified"}</CardDescription>
            </div>
            <Badge variant={
              customer.status === 'active' ? 'default' :
              customer.status === 'inactive' ? 'secondary' :
              customer.status === 'lead' ? 'outline' : 'destructive'
            }>
              {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : "No status"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.website && (
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <a 
                  href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {customer.website}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{customer.address}</span>
              </div>
            )}
          </div>

          {customer.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-gray-500 whitespace-pre-line">{customer.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="contacts">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="deals">
            <DollarSign className="h-4 w-4 mr-2" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-2" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="interactions">
            <MessageSquareText className="h-4 w-4 mr-2" />
            Interactions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="space-y-4">
          {customer && customer.id && (
            <ContactsList customerId={customer.id.toString()} />
          )}
        </TabsContent>
        <TabsContent value="deals" className="space-y-4">
          {customer && customer.id && (
            <div>
              <DealList 
                customerId={customer.id.toString()} 
                onViewDeal={(dealId) => window.location.href = `/deals?view=detail&id=${dealId}`} 
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          {customer && customer.id && (
            <div>
              <TaskList 
                customerId={customer.id.toString()} 
                onNewTask={() => window.location.href = `/tasks?view=new&customerId=${customer.id}`}
                onEditTask={(taskId) => window.location.href = `/tasks?view=edit&id=${taskId}&customerId=${customer.id}`}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="meetings" className="space-y-4">
          {customer && customer.id && (
            <div>
              <MeetingList 
                customerId={customer.id.toString()} 
                onNewMeeting={() => window.location.href = `/meetings?view=new&customerId=${customer.id}`}
                onViewMeeting={(meetingId) => window.location.href = `/meetings?view=detail&id=${meetingId}`}
                onEditMeeting={(meetingId) => window.location.href = `/meetings?view=edit&id=${meetingId}`}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="interactions" className="space-y-4">
          {customer && customer.id && (
            <div>
              <InteractionList customerId={customer.id.toString()} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}