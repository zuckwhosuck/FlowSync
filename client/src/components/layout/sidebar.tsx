import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth.jsx";
import { useTheme } from "@/hooks/use-theme";
import { 
  Home, 
  Users, 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  BarChart2, 
  Settings as SettingsIcon, 
  HelpCircle,
  Menu,
  Search,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string; 
  active: boolean;
}) => {
  return (
    <Link href={href}>
      <div className={cn(
        "sidebar-item flex items-center space-x-3 rounded-md px-3 py-2.5 font-medium cursor-pointer",
        active 
          ? "text-foreground bg-muted" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}>
        <Icon className={cn("sidebar-icon h-5 w-5", active ? "text-primary" : "")} />
        <span>{label}</span>
      </div>
    </Link>
  );
};

export default function Sidebar({ 
  isMobileOpen, 
  onMobileClose 
}: { 
  isMobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const sidebarClasses = cn(
    "flex flex-col w-64 bg-background border-r border-border h-screen",
    isMobileOpen 
      ? "fixed inset-y-0 left-0 z-50" 
      : "hidden md:flex"
  );

  const handleLogout = useCallback(() => {
    useAuth().logout();
    onMobileClose();
  }, [onMobileClose]);

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileClose}
        ></div>
      )}

      <aside className={sidebarClasses}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">FlowSync</h1>
            <button 
              onClick={onMobileClose}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted md:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                className="w-full rounded-md pl-8"
              />
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <SidebarItem 
              icon={Home} 
              label="Dashboard" 
              href="/" 
              active={location === '/'} 
            />
            <SidebarItem 
              icon={Users} 
              label="Customers" 
              href="/customers" 
              active={location === '/customers'} 
            />
            <SidebarItem 
              icon={Calendar} 
              label="Meetings" 
              href="/meetings" 
              active={location === '/meetings'} 
            />
            <SidebarItem 
              icon={CheckSquare} 
              label="Tasks" 
              href="/tasks" 
              active={location === '/tasks'} 
            />
            <SidebarItem 
              icon={DollarSign} 
              label="Deals" 
              href="/deals" 
              active={location === '/deals'} 
            />
            <SidebarItem 
              icon={BarChart2} 
              label="Reports" 
              href="/reports" 
              active={location === '/reports'} 
            />
          </div>

          <div className="mt-8">
            <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settings
            </h2>
            <div className="mt-2 space-y-1">
              <SidebarItem 
                icon={SettingsIcon} 
                label="Settings" 
                href="/settings" 
                active={location === '/settings'} 
              />
              <SidebarItem 
                icon={HelpCircle} 
                label="Help & Support" 
                href="/help" 
                active={location === '/help'} 
              />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden mr-2">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {user?.displayName || user?.email}
                </span>
                <ChevronDown className="ml-1 h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center p-2">
                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.displayName || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || 'User'}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Link href="/settings">Profile</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href="/settings">Account Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
