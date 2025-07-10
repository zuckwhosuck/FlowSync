import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Search, Plus, Mail, Phone, Building, Download, FileDown, FileText } from "lucide-react";
import { Customer } from "@shared/schema";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CustomerListProps {
  onNewCustomer: () => void;
  onViewCustomer: (id: string) => void;
}

export default function CustomerList({ onNewCustomer, onViewCustomer }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  const filteredCustomers = customers.filter((customer: Customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.industry && customer.industry.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower))
    );
  });

  // Prepare data for export
  const prepareExportData = () => {
    return filteredCustomers.map(customer => ({
      ID: customer.id,
      Name: customer.name,
      Email: customer.email || "",
      Phone: customer.phone || "",
      Industry: customer.industry || "",
      Status: customer.status || "",
      Address: customer.address || "",
      Website: customer.website || "",
      Notes: customer.notes || "",
      Value: customer.totalValue || 0,
      Created: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "",
      Updated: customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : ""
    }));
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Name", "Email", "Phone", "Industry", "Status", "Value"];
    const tableRows: any[][] = [];

    filteredCustomers.forEach(customer => {
      const customerData = [
        customer.id,
        customer.name,
        customer.email || "",
        customer.phone || "",
        customer.industry || "",
        customer.status || "",
        `$${customer.totalValue?.toLocaleString() || 0}`
      ];
      tableRows.push(customerData);
    });

    doc.setFontSize(16);
    doc.text("Customer Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Total Customers: ${filteredCustomers.length}`, 14, 29);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save("customers-report.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {filteredCustomers.length > 0 && (
            <div className="flex items-center">
              <Button variant="outline" className="mr-2" onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <CSVLink
                data={prepareExportData()}
                filename={"customers-export.csv"}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                target="_blank"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </CSVLink>
            </div>
          )}
          <Button onClick={onNewCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <h3 className="text-lg font-medium text-gray-900">Error loading customers</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error instanceof Error ? error.message : "Could not load customer data."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
              {searchQuery ? (
                <p className="mt-1 text-sm text-gray-500">
                  No customers match your search. Try different keywords.
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new customer.
                </p>
              )}
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={onNewCustomer}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Customer
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              {filteredCustomers.length} total customer{filteredCustomers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer: Customer) => (
                    <TableRow 
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => onViewCustomer(customer.id.toString())}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {customer.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-sm">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-sm">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{customer.industry || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          customer.status === 'active' ? 'default' :
                          customer.status === 'inactive' ? 'secondary' :
                          customer.status === 'lead' ? 'outline' : 'destructive'
                        }>
                          {customer.status ? (customer.status.charAt(0).toUpperCase() + customer.status.slice(1)) : "Unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}