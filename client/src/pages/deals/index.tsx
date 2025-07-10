import { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DealList from "@/components/deals/deal-list";
import DealDetail from "@/components/deals/deal-detail";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";

export default function Deals() {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleViewDeal = (dealId: string) => {
    setSelectedDealId(dealId);
  };

  const handleBack = () => {
    setSelectedDealId(null);
  };

  const handleMenuClick = () => {
    setIsMobileOpen(true);
  };

  const handleMobileClose = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={handleMobileClose} />
      <div className="flex-1 ">
        <Navbar onMenuClick={handleMenuClick} />
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Deals Management</h1>
              <p className="text-muted-foreground">
                Create and manage deals with your customers
              </p>
            </div>

            {!selectedDealId && (
              <Link href="/">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>

          {selectedDealId ? (
            <DealDetail dealId={selectedDealId} onBack={handleBack} />
          ) : (
            <DealList onViewDeal={handleViewDeal} />
          )}
        </div>
      </div>
    </div>
  );
}
