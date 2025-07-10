import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, ChevronRight, Loader2, ExternalLink, Building2 } from "lucide-react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";
import DealForm from "./deal-form";

interface DealListProps {
  customerId?: string;
  onViewDeal?: (dealId: string) => void;
}

export default function DealList({ customerId, onViewDeal }: DealListProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const queryKey = customerId 
    ? ["/api/customers", customerId, "deals"] 
    : ["/api/deals"];

  const { data: deals = [], isLoading, error } = useQuery<Deal[]>({
    queryKey,
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.stage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Deal</h2>
          <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
        <DealForm 
          customerId={customerId} 
          onSuccess={() => setShowForm(false)} 
          onCancel={() => setShowForm(false)} 
        />
      </div>
    );
  }

  const getStageBadgeVariant = (stage: string) => {
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

  const formatStage = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Deals</CardTitle>
        <Button onClick={() => setShowForm(true)} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Failed to load deals. Please try again.
            </p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No deals found. Create your first deal!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Probability</TableHead>
                  {!customerId && <TableHead>Customer</TableHead>}
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStageBadgeVariant(deal.stage)}>
                        {formatStage(deal.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: deal.currency || 'USD',
                      }).format(deal.value || 0)}
                    </TableCell>
                    <TableCell>
                      {deal.expectedCloseDate 
                        ? format(new Date(deal.expectedCloseDate), 'MMM d, yyyy')
                        : 'Not set'}
                    </TableCell>
                    <TableCell>{deal.probability || 0}%</TableCell>
                    {!customerId && (
                      <TableCell>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{deal.customer?.name || `Customer ID: ${deal.customerId}`}</span>
                          {deal.customerId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 p-0 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/customers?view=detail&id=${deal.customerId}`);
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="sr-only">View Customer</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDeal && onViewDeal(deal.id.toString())}
                      >
                        <span className="sr-only">View Deal</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}