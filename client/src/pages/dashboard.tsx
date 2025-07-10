import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  CheckSquare,
  FileText,
  PlusCircle
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import StatsCard from "@/components/dashboard/stats-card";
import CustomerTable from "@/components/dashboard/customer-table";
import DealsProgress from "@/components/dashboard/deals-progress";
import TasksList from "@/components/dashboard/tasks-list";
import { useAuth } from "@/hooks/use-auth.jsx";
import { Button } from "@/components/ui/button";
import { Customer } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardStats {
  customerCount: number;
  customerGrowth: number;
  activeDeals: number;
  dealChange: number;
  upcomingMeetings: number;
  meetingChange: number;
  tasksDueToday: number;
  totalTasks: number;
  taskCompletion: number;
  totalSales: number;
  avgDealSize: number;
  winRate: number;
}

export default function Dashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Default values for loading state
  const defaultStats = {
    customerCount: 0,
    customerGrowth: 0,
    activeDeals: 0,
    dealChange: 0,
    upcomingMeetings: 0,
    meetingChange: 0,
    tasksDueToday: 0,
    totalTasks: 0,
    taskCompletion: 0,
    totalSales: 0,
    avgDealSize: 0,
    winRate: 0,
  };

  const dashboardStats = stats || defaultStats;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Dashboard header */}
            <div className="mb-6 md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Here's what's happening with your customers today.
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <Button 
                  variant="outline" 
                  className="flex items-center"
                  onClick={() => {
                    const doc = new jsPDF();
                    const tableColumn = ["ID", "Name", "Email", "Phone", "Industry", "Status", "Value"];
                    const tableRows: any[][] = [];

                    customers?.forEach(customer => {
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
                    doc.text(`Total Customers: ${customers?.length || 0}`, 14, 29);

                    autoTable(doc, {
                      head: [tableColumn],
                      body: tableRows,
                      startY: 35,
                      styles: { fontSize: 8, cellPadding: 2 },
                      headStyles: { fillColor: [66, 139, 202] }
                    });

                    doc.save("customers-report.pdf");
                  }}
                >
                  <FileText className="-ml-1 mr-2 h-5 w-5 text-neutral-500" />
                  Export
                </Button>
                <Button 
                  className="flex items-center"
                  onClick={() => navigate('/customers?view=new')}
                >
                  <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                  Add Customer
                </Button>
              </div>
            </div>

            {/* Stats overview */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Customers"
                value={isLoadingStats ? "Loading..." : dashboardStats.customerCount}
                icon={Users}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
                change={dashboardStats.customerGrowth}
              />
              
              <StatsCard
                title="Active Deals"
                value={isLoadingStats ? "Loading..." : dashboardStats.activeDeals}
                icon={DollarSign}
                iconColor="text-secondary"
                iconBgColor="bg-secondary/10"
                change={dashboardStats.dealChange}
              />
              
              <StatsCard
                title="Upcoming Meetings"
                value={isLoadingStats ? "Loading..." : dashboardStats.upcomingMeetings}
                icon={Calendar}
                iconColor="text-cyan-500"
                iconBgColor="bg-cyan-50"
                change={dashboardStats.meetingChange}
              />
              
              <StatsCard
                title="Total Tasks"
                value={isLoadingStats ? "Loading..." : dashboardStats.totalTasks}
                icon={CheckSquare}
                iconColor="text-amber-500"
                iconBgColor="bg-amber-50"
                change={dashboardStats.taskCompletion}
                changeLabel="completed"
              />
              <StatsCard
                title="Total Sales"
                value={isLoadingStats ? "Loading..." : `$${dashboardStats.totalSales?.toLocaleString()}`}
                icon={DollarSign}
                iconColor="text-green-500"
                iconBgColor="bg-green-50"
              />
              <StatsCard
                title="Avg. Deal Size"
                value={isLoadingStats ? "Loading..." : `$${dashboardStats.avgDealSize?.toLocaleString()}`}
                icon={DollarSign}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-50"
              />
              <StatsCard
                title="Win Rate"
                value={isLoadingStats ? "Loading..." : `${dashboardStats.winRate}%`}
                icon={CheckSquare}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-50"
              />
            </div>

            {/* Main content area split into 2/3 - 1/3 on larger screens */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left 2/3 column on larger screens */}
              <div className="lg:col-span-2 space-y-6">
                <CustomerTable />
                <DealsProgress />
              </div>

              {/* Right 1/3 column on larger screens */}
              <div className="space-y-6">
                {/* Firebase Authentication Status Card */}
                <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                  <div className="px-4 py-5 sm:px-6 bg-primary/5 border-b border-primary/20">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h3 className="ml-2 text-lg font-medium leading-6 text-card-foreground">Firebase Authentication</h3>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      {user
                        ? "Firebase Authentication is enabled and working correctly."
                        : "Complete the setup for Firebase Authentication to enable secure user login and registration."}
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="ml-2 text-sm text-card-foreground">Firebase project created</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="ml-2 text-sm text-card-foreground">Firebase SDK integrated</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {user ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-border flex items-center justify-center">
                              <div className="h-2.5 w-2.5 rounded-full bg-muted"></div>
                            </div>
                          )}
                          <span className="ml-2 text-sm text-card-foreground">User authentication configured</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {user?.role ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-border flex items-center justify-center">
                              <div className="h-2.5 w-2.5 rounded-full bg-muted"></div>
                            </div>
                          )}
                          <span className="ml-2 text-sm text-card-foreground">User roles and permissions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* PostgreSQL Migration Card */}
                <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                  <div className="px-4 py-5 sm:px-6 bg-secondary/5 border-b border-secondary/20">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <h3 className="ml-2 text-lg font-medium leading-6 text-card-foreground">PostgreSQL Database</h3>
                    </div>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      The CRM has been successfully connected to PostgreSQL.
                    </p>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-2 text-card-foreground">Schema design completed</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-2 text-card-foreground">PostgreSQL connection established</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-2 text-card-foreground">Migration completed</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-2 text-card-foreground">Database optimization complete</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tasks List */}
                <TasksList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
