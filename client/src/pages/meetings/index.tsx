import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import MeetingList from "@/components/meetings/meeting-list";
import MeetingDetail from "@/components/meetings/meeting-detail";
import MeetingForm from "@/components/meetings/meeting-form";
import { Meeting } from "@shared/schema";

type PageView = "list" | "detail" | "new" | "edit";

export default function Meetings() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [view, setView] = useState<PageView>("list");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  
  const showList = () => {
    setView("list");
    setSelectedMeetingId(null);
  };
  
  const showDetail = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setView("detail");
  };
  
  const showNewForm = () => {
    setSelectedMeetingId(null);
    setView("new");
  };
  
  const showEditForm = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setView("edit");
  };

  const renderContent = () => {
    switch (view) {
      case "detail":
        return (
          <MeetingDetail 
            meetingId={selectedMeetingId!} 
            onBack={showList} 
            onEdit={() => showEditForm(selectedMeetingId!)}
          />
        );
      case "new":
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-neutral-900">Schedule New Meeting</h1>
            </div>
            <MeetingForm 
              onSuccess={showList} 
              onCancel={showList} 
            />
          </div>
        );
      case "edit":
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-neutral-900">Edit Meeting</h1>
            </div>
            <MeetingForm 
              meetingId={selectedMeetingId!}
              onSuccess={() => showDetail(selectedMeetingId!)} 
              onCancel={() => showDetail(selectedMeetingId!)} 
            />
          </div>
        );
      case "list":
      default:
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-neutral-900">Meetings</h1>
            </div>
            <MeetingList 
              onNewMeeting={showNewForm} 
              onViewMeeting={showDetail}
              onEditMeeting={showEditForm}
            />
          </>
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
