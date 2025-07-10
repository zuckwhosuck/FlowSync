import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, Plus, Trash, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Meeting } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

interface MeetingListProps {
  customerId?: string;
  onNewMeeting?: () => void;
  onViewMeeting?: (meetingId: string) => void;
  onEditMeeting?: (meetingId: string) => void;
}

export default function MeetingList({ 
  customerId, 
  onNewMeeting, 
  onViewMeeting, 
  onEditMeeting 
}: MeetingListProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: customerId 
      ? ["/api/customers", customerId, "meetings"] 
      : ["/api/meetings"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const filteredMeetings = statusFilter 
    ? meetings.filter(meeting => meeting.status === statusFilter)
    : meetings;

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

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <CalendarClock className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="w-full py-12 text-center border rounded-md">
        <CalendarClock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-600">No meetings found</h3>
        <p className="text-gray-500 mt-2 mb-4">There are no meetings scheduled yet.</p>
        {onNewMeeting && (
          <Button onClick={onNewMeeting}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule a Meeting
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm" 
            variant={statusFilter === null ? "default" : "outline"} 
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === "scheduled" ? "default" : "outline"} 
            onClick={() => setStatusFilter("scheduled")}
          >
            Scheduled
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === "completed" ? "default" : "outline"} 
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === "cancelled" ? "default" : "outline"} 
            onClick={() => setStatusFilter("cancelled")}
          >
            Cancelled
          </Button>
        </div>
        {onNewMeeting && (
          <Button onClick={onNewMeeting}>
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.map((meeting) => (
          <Card key={meeting.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{meeting.title}</CardTitle>
                <Badge 
                  className={getStatusBadgeColor(meeting.status || '')}
                >
                  {meeting.status ? (meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)) : 'No status'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2 space-y-3">
              <div>
                <div className="text-sm font-medium">Start Time</div>
                <div>{meeting.startTime ? format(new Date(meeting.startTime), "PPP p") : 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm font-medium">End Time</div>
                <div>{meeting.endTime ? format(new Date(meeting.endTime), "PPP p") : 'Not specified'}</div>
              </div>
              {meeting.location && (
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div>{meeting.location}</div>
                </div>
              )}
              {meeting.notes && (
                <div>
                  <div className="text-sm font-medium">Notes</div>
                  <div className="text-sm line-clamp-2">{meeting.notes}</div>
                </div>
              )}
            </CardContent>
            <Separator />
            <CardFooter className="justify-end pt-4 space-x-2">
              {onViewMeeting && (
                <Button variant="ghost" size="sm" onClick={() => onViewMeeting(meeting.id.toString())}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              )}
              {onEditMeeting && (
                <Button variant="outline" size="sm" onClick={() => onEditMeeting(meeting.id.toString())}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}