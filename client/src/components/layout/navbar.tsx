import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, Search, Bell, ChevronDown, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.jsx";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [hasNotifications] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Function to get page title based on current route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/customers":
        return "Customers";
      case "/meetings":
        return "Meetings";
      case "/tasks":
        return "Tasks";
      case "/deals":
        return "Deals";
      case "/reports":
        return "Reports";
      case "/settings":
        return "Settings";
      default:
        return "";
    }
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="ml-2 text-lg font-bold text-foreground md:hidden">
            FlowSync
          </h1>
        </div>

        <div className="hidden flex-1 md:flex md:items-center md:justify-between">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Input
            type="text"
            placeholder="Search..."
            className="hidden md:flex w-64 rounded-md"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />

          {/* Theme toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </Button>
          
          {/* Notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-6 w-6 text-muted-foreground" />
                {hasNotifications && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="font-semibold text-sm px-2 py-1.5">Notifications</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>New customer added</DropdownMenuItem>
              <DropdownMenuItem>Meeting reminder: Acme Corp</DropdownMenuItem>
              <DropdownMenuItem>Deal status updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user?.displayName?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="hidden md:block ml-1 h-5 w-5 text-muted-foreground" />
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
      </div>
    </header>
  );
}
