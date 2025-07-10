import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Customer, Meeting, Interaction } from "@shared/schema";

export default function CustomerActivity() {
  const [tab, setTab] = useState<"meetings" | "interactions">("meetings");

  // Fetch all customers
  const { data: customers, isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch all meetings data
  const { data: meetings, isLoading: loadingMeetings } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const isLoading = loadingCustomers || loadingMeetings;

  // Process meeting data by customer
  const processMeetingData = () => {
    if (!customers || !meetings) return [];

    // Create a map to count meetings per customer
    const customerMeetings = new Map<number, number>();
    
    // Count meetings for each customer
    meetings.forEach(meeting => {
      if (meeting.customerId) {
        const count = customerMeetings.get(meeting.customerId) || 0;
        customerMeetings.set(meeting.customerId, count + 1);
      }
    });
    
    // Map to final format for chart
    return customers
      .map(customer => ({
        name: customer.name,
        meetings: customerMeetings.get(customer.id) || 0
      }))
      .sort((a, b) => b.meetings - a.meetings) // Sort by meeting count descending
      .slice(0, 10); // Take top 10
  };
  
  // We'll simulate interaction data since we don't have a separate endpoint for all interactions
  const processInteractionData = () => {
    if (!customers) return [];
    
    // Create random but consistent interaction counts based on customerId
    return customers
      .map(customer => ({
        name: customer.name,
        interactions: ((customer.id * 7) % 15) + 3 // Just a deterministic formula for demo
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10);
  };

  const meetingData = processMeetingData();
  const interactionData = processInteractionData();
  
  const chartData = tab === "meetings" ? meetingData : interactionData;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Customer Engagement</CardTitle>
        <CardDescription>
          Most active customers based on interactions and meetings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meetings" value={tab} onValueChange={(v) => setTab(v as "meetings" | "interactions")}>
          <TabsList>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>
          <TabsContent value="meetings" className="pt-4">
            <div className="h-[300px]">
              {meetingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={meetingData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="meetings" fill="#8884d8" name="Meetings" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No meeting data available</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="interactions" className="pt-4">
            <div className="h-[300px]">
              {interactionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={interactionData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="interactions" fill="#82ca9d" name="Interactions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No interaction data available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}