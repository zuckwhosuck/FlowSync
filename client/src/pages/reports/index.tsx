import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesByPeriod from "@/components/reports/sales-by-period";
import DealStages from "@/components/reports/deal-stages";
import CustomerActivity from "@/components/reports/customer-activity";
import TaskCompletionChart from "@/components/reports/task-completion";
import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/stats-card";
import { DollarSign, CheckSquare } from "lucide-react";

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
  customerRetentionRate: number;
}

export default function Reports() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

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
    customerRetentionRate: 0,
  };

  const dashboardStats = stats || defaultStats;

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
              <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>
              <p className="mt-2 text-neutral-600">
                Track sales performance, customer engagement, and team productivity
              </p>
            </div>

            <Tabs defaultValue="sales" className="space-y-6">
              <div className="flex justify-between items-center border-b">
                <TabsList>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
              </div>

              {/* Sales Analytics Tab */}
              <TabsContent value="sales" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SalesByPeriod />
                  <DealStages />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium mb-4">Sales Metrics Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>
              </TabsContent>

              {/* Customer Analytics Tab */}
              <TabsContent value="customers" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <CustomerActivity />
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium mb-4">Customer Metrics</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <StatsCard
                        title="Total Customers"
                        value={isLoadingStats ? "Loading..." : dashboardStats.customerCount}
                        icon={DollarSign}
                        iconColor="text-green-500"
                        iconBgColor="bg-green-50"
                        change={dashboardStats.customerGrowth}
                      />
                      <StatsCard
                        title="Customer Retention Rate"
                        value={isLoadingStats ? "Loading..." : `${dashboardStats.customerRetentionRate}%`}
                        icon={CheckSquare}
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-50"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Task Analytics Tab */}
              <TabsContent value="tasks" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-medium mb-4">Task Volume by Week</h3>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-muted-foreground">Weekly task volume chart will be displayed here</p>
                    </div>
                  </div>
                  <TaskCompletionChart />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium mb-4">Task Assignment Distribution</h3>
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-muted-foreground">Task assignment distribution chart will be displayed here</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
