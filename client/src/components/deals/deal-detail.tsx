import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, DollarSign, Building2, Trash2, PenSquare, 
  Calendar as CalendarIcon, CheckCircle2, XCircle, ExternalLink,
  User, Phone, Mail, Globe
} from "lucide-react";
import { Deal } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import DealForm from "./deal-form";
import TaskList from "@/components/tasks/task-list";

interface DealDetailProps {
  dealId: string;
  onBack: () => void;
}

export default function DealDetail({ dealId, onBack }: DealDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: deal, isLoading, error } = useQuery<Deal>({
    queryKey: ["/api/deals", dealId],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/deals/${dealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      if (deal?.customerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/customers", deal.customerId.toString(), "deals"] 
        });
      }
      toast({
        title: "Deal deleted",
        description: "The deal has been deleted successfully",
      });
      onBack();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete deal. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete deal:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">Error loading deal</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error instanceof Error ? error.message : "Deal not found"}
        </p>
        <Button onClick={onBack} className="mt-4">
          Back to Deals
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Deal</h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
        <DealForm 
          deal={deal} 
          onSuccess={() => setIsEditing(false)} 
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  const formatStage = (stage: string) => {
    if (!stage) return '';
    
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusIcon = (stage: string) => {
    if (!stage) return null;
    if (stage === 'closed_won') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (stage === 'closed_lost') return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };

  const getStageBadgeVariant = (stage: string) => {
    if (!stage) return 'outline';
    
    switch (stage) {
      case 'lead':
        return 'outline';
      case 'qualification':
        return 'secondary';
      case 'proposal':
        return 'default';
      case 'negotiation':
        return 'destructive';
      case 'closed_won':
        return 'default';
      case 'closed_lost':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} size="sm">
          Back to Deals
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
                  This action cannot be undone. This will permanently delete this deal.
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
              <CardTitle className="text-2xl flex items-center">
                {deal.name}
                {getStatusIcon(deal.stage)}
              </CardTitle>
              <CardDescription>
                {deal.customer?.name || `Customer ID: ${deal.customerId}`}
              </CardDescription>
            </div>
            <Badge variant={getStageBadgeVariant(deal.stage)}>
              {formatStage(deal.stage)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: deal.currency || 'USD',
                }).format(deal.value || 0)}
              </span>
            </div>
            
            {deal.expectedCloseDate && (
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  Expected close: {format(new Date(deal.expectedCloseDate), 'MMMM d, yyyy')}
                </span>
              </div>
            )}
            
            <div className="flex flex-col col-span-2 mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs">Probability</span>
                <span className="text-xs font-semibold">{deal.probability || 0}%</span>
              </div>
              <Progress value={deal.probability || 0} className="h-2" />
            </div>
          </div>

          {deal.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-gray-500 whitespace-pre-line">{deal.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Customer Information</span>
              {deal.customer && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:bg-primary/10"
                  onClick={() => setLocation(`/customers?view=detail&id=${deal.customerId}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.customer ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{deal.customer.name}</span>
                </div>
                {deal.customer.industry && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="ml-6">Industry: {deal.customer.industry}</span>
                  </div>
                )}
                {deal.customer.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{deal.customer.email}</span>
                  </div>
                )}
                {deal.customer.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{deal.customer.phone}</span>
                  </div>
                )}
                {deal.customer.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={deal.customer.website.startsWith('http') ? deal.customer.website : `https://${deal.customer.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {deal.customer.website}
                    </a>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setLocation(`/customers?view=detail&id=${deal.customerId}`)}
                  >
                    View Customer Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Customer not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The customer associated with this deal could not be found.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Associated Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList 
              dealId={dealId} 
              onNewTask={() => setLocation(`/tasks?view=new&dealId=${dealId}&customerId=${deal.customerId}`)} 
              onEditTask={(taskId) => setLocation(`/tasks?view=edit&id=${taskId}&dealId=${dealId}&customerId=${deal.customerId}`)}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No meetings</h3>
              <p className="mt-1 text-sm text-gray-500">
                No meetings scheduled for this deal yet.
              </p>
              <div className="mt-6">
                <Button size="sm">
                  Schedule Meeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}