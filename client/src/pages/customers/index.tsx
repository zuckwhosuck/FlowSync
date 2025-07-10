import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import CustomerList from "@/components/customers/customer-list";
import CustomerDetail from "@/components/customers/customer-detail";
import CustomerForm from "@/components/customers/customer-form";

type PageView = "list" | "detail" | "new";

export default function Customers() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [view, setView] = useState<PageView>("list");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [location] = useLocation(); // Only use location for reading current path
  
  // Parse URL parameters for direct navigation
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const viewParam = params.get('view');
    const idParam = params.get('id');
    
    if (viewParam === 'detail' && idParam) {
      setView('detail');
      setSelectedCustomerId(idParam);
    } else if (viewParam === 'new') {
      setView('new');
    }
  }, [location]);

  const handleViewCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setView("detail");
  };

  const handleNewCustomer = () => {
    setView("new");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedCustomerId(null);
  };

  const renderContent = () => {
    switch (view) {
      case "list":
        return (
          <CustomerList
            onNewCustomer={handleNewCustomer}
            onViewCustomer={handleViewCustomer}
          />
        );
      case "detail":
        return (
          selectedCustomerId && (
            <CustomerDetail
              customerId={selectedCustomerId}
              onBack={handleBackToList}
            />
          )
        );
      case "new":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">New Customer</h2>
              <button
                onClick={handleBackToList}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
            <CustomerForm
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900">
                {view === "list" ? "Customers" : view === "detail" ? "Customer Details" : "New Customer"}
              </h1>
              <p className="mt-2 text-neutral-600">
                {view === "list" 
                  ? "Manage your customer relationships and view detailed information."
                  : view === "detail" 
                  ? "View and edit customer details, contacts, and interactions."
                  : "Create a new customer record in the system."
                }
              </p>
            </div>
            
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
