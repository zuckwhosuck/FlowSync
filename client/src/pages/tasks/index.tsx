import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import TaskList from "@/components/tasks/task-list";
import TaskForm from "@/components/tasks/task-form";
import TaskDetail from "@/components/tasks/task-detail";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task } from "@shared/schema";

type PageView = "list" | "detail" | "new" | "edit";

export default function Tasks() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pageView, setPageView] = useState<PageView>("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dealId, setDealId] = useState<string | undefined>(undefined);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  
  // Parse URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for view parameter
    const viewParam = params.get('view');
    if (viewParam === 'new') {
      setPageView('new');
    } else if (viewParam === 'detail' || viewParam === 'edit') {
      setPageView(viewParam as PageView);
    }
    
    // Check for ID parameter
    const idParam = params.get('id');
    if (idParam) {
      setSelectedTaskId(idParam);
    }
    
    // Check for dealId parameter
    const dealIdParam = params.get('dealId');
    if (dealIdParam) {
      setDealId(dealIdParam);
    }
    
    // Check for customerId parameter
    const customerIdParam = params.get('customerId');
    if (customerIdParam) {
      setCustomerId(customerIdParam);
    }
  }, []);

  const handleNewTask = () => {
    setPageView("new");
    setSelectedTaskId(null);
    // Clear any dealId or customerId if they were set
    setDealId(undefined);
    setCustomerId(undefined);
    
    // Update URL without causing page refresh
    window.history.pushState({}, '', '/tasks?view=new');
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setPageView("edit");
    
    // Update URL without causing page refresh
    window.history.pushState({}, '', `/tasks?view=edit&id=${taskId}`);
  };

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setPageView("detail");
    
    // Update URL without causing page refresh
    window.history.pushState({}, '', `/tasks?view=detail&id=${taskId}`);
  };

  const handleBackToList = () => {
    setPageView("list");
    setSelectedTaskId(null);
    setDealId(undefined);
    setCustomerId(undefined);
    
    // Update URL without causing page refresh
    window.history.pushState({}, '', '/tasks');
  };

  const renderContent = () => {
    switch (pageView) {
      case "list":
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
                <p className="text-neutral-600">
                  Manage your tasks and track progress
                </p>
              </div>
            </div>
            <TaskList
              onNewTask={handleNewTask}
              onEditTask={handleViewTask}
              dealId={dealId}
              customerId={customerId}
            />
          </>
        );
      case "detail":
        return (
          selectedTaskId && (
            <TaskDetail
              taskId={selectedTaskId}
              onBack={handleBackToList}
              onEdit={() => {
                setPageView("edit");
                // Update URL without causing page refresh
                window.history.pushState({}, '', `/tasks?view=edit&id=${selectedTaskId}`);
              }}
            />
          )
        );
      case "new":
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-neutral-900">New Task</h1>
            <TaskForm
              dealId={dealId}
              customerId={customerId}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          </div>
        );
      case "edit":
        return (
          selectedTaskId && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-neutral-900">Edit Task</h1>
              <TaskForm
                task={{ id: parseInt(selectedTaskId, 10) } as Task}
                dealId={dealId}
                customerId={customerId}
                onSuccess={handleBackToList}
                onCancel={handleBackToList}
              />
            </div>
          )
        );
      default:
        return null;
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
