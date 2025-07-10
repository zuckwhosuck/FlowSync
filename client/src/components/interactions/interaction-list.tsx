import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  MessageSquare,
  Mail,
  Phone,
  CalendarClock,
  PlusCircle,
  Search,
} from "lucide-react";
import { Interaction } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface InteractionListProps {
  customerId?: string;
}

export default function InteractionList({ customerId }: InteractionListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Only fetch interactions if customerId is provided
  const queryKey = customerId ? ["/api/customers", customerId, "interactions"] : null;
  
  const { data: interactions = [], isLoading } = useQuery<Interaction[]>({
    queryKey: queryKey as any,
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!customerId, // Only run query if customerId exists
  });

  // Filter interactions based on search query
  const filteredInteractions = interactions.filter(interaction => 
    interaction.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    interaction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    interaction.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get icon based on interaction type
  const getInteractionIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'call':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'meeting':
        return <CalendarClock className="h-5 w-5 text-purple-500" />;
      case 'note':
      default:
        return <MessageSquare className="h-5 w-5 text-amber-500" />;
    }
  };

  if (!customerId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-sm font-semibold text-gray-900">No customer selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a customer to view their interactions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>
          Customer Interactions
        </CardTitle>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Log Interaction
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search interactions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No interactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Get started by logging an interaction with this customer"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInteractions.map((interaction) => (
              <div key={interaction.id} className="border rounded-md p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getInteractionIcon(interaction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{interaction.subject || interaction.type}</h3>
                        <Badge variant="outline" className="capitalize">
                          {interaction.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interaction.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {interaction.content && (
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                        {interaction.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}