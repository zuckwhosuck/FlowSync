import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, ArrowLeft, Edit, Trash, User, Users, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Meeting, Customer, Contact } from "@shared/schema";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface MeetingDetailProps {
  meetingId: string;
  onBack: () => void;
  onEdit?: () => void;
}

export default function MeetingDetail({ meetingId, onBack, onEdit }: MeetingDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meeting, isLoading } = useQuery<Meeting>({
    queryKey: ["/api/meetings", meetingId],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: meeting?.customerId ? ["/api/customers", meeting.customerId.toString()] : null,
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!meeting?.customerId
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      if (meeting?.customerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/customers", meeting.customerId.toString(), "meetings"] 
        });
      }
      toast({
        title: "Meeting deleted",
        description: "The meeting has been deleted successfully",
      });
      onBack();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete meeting. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete meeting:", error);
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case "scheduled":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "rescheduled":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (isLoading || !meeting) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <CalendarClock className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    deleteMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meetings
        </Button>
        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Meeting
            </Button>
          )}
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{meeting.title}</CardTitle>
            <Badge 
              className={getStatusBadgeColor(meeting.status || '')}
            >
              {meeting.status ? (meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)) : 'No status'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Customer</div>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{customer ? customer.name : 'N/A'}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Location</div>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{meeting.location || 'No location specified'}</span>
                </div>
              </div>
              
              {meeting.attendees && meeting.attendees.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Attendees</div>
                  <div className="flex items-start mt-1">
                    <Users className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                    <div>
                      {meeting.attendees.map((attendee: any, index: number) => (
                        <div key={index} className="text-sm">
                          {attendee.name} {attendee.email ? `(${attendee.email})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Start Time</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{meeting.startTime ? format(new Date(meeting.startTime), "PPP p") : 'Not specified'}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">End Time</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{meeting.endTime ? format(new Date(meeting.endTime), "PPP p") : 'Not specified'}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Duration</div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {meeting.startTime && meeting.endTime ? 
                      `${Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60))} minutes` : 
                      'Duration not available'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {meeting.notes && (
            <div>
              <Separator className="my-4" />
              <div className="text-sm font-medium text-gray-500 mb-2">Notes</div>
              <div className="whitespace-pre-wrap text-sm">{meeting.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}