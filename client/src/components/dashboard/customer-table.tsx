import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const calculateTotalDealsValue = (customer: Customer) => {
  if (!customer.deals || customer.deals.length === 0) {
    return 0;
  }
  return customer.deals.reduce((total: number, deal: any) => total + (deal.value || 0), 0);
};

export default function CustomerTable() {
  const [, navigate] = useLocation();
  const { data: customers, isLoading, error } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    staleTime: 60000,
  });

  const handleViewCustomer = (id: number) => {
    navigate(`/customers?view=detail&id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-neutral-900">Recent Customers</h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">Loading...</p>
          </div>
        </div>
        <div className="border-t border-neutral-200 px-4 py-5">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Recent Customers</h3>
          <p className="mt-1 max-w-2xl text-sm text-red-500">Error loading customers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Recent Customers</h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">Latest customer additions and updates.</p>
        </div>
        <div>
          <Link href="/customers">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/5 cursor-pointer"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="border-t border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {customers && customers.length > 0 ? (
                customers.slice(0, 4).map((customer) => (
                  <tr key={customer.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 font-medium">
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">{customer.name}</div>
                          <div className="text-sm text-neutral-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        customer.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : customer.status === "pending" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                      )}>
                        {customer.status ? (customer.status.charAt(0).toUpperCase() + customer.status.slice(1)) : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      ${calculateTotalDealsValue(customer).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(customer.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="link"
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleViewCustomer(customer.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
