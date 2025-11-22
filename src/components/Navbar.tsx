import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useProfile } from '@/hooks/queries/useProfile';
import { UserSelector } from '@/components/UserSelector';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { currentPlan } = usePlan();
  const { data: profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const canAdmin = currentPlan?.allow_admin_mode || false;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (text: string) => {
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="glass-card border-border sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo + User Selector */}
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                HUBGOX
              </h1>
            </div>
            {canAdmin && <UserSelector className="hidden md:flex" />}
          </div>

          {/* Right side: User Menu */}
          <div className="flex items-center gap-3">
            {/* Plan Badge Button */}
            <Button
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="sm"
              className="rounded-full px-4 h-8 bg-accent/10 border-accent/30 hover:bg-accent/20 hover:border-accent/50 transition-smooth"
            >
              <span className="text-xs font-semibold text-accent">
                {currentPlan?.plan_name || 'Free'}
              </span>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || ''} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                    {profile?.username ? getInitials(profile.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline-block">
                  {profile?.username || user?.email}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card border-border">
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile User Selector (shown below on small screens) */}
      {canAdmin && (
        <div className="md:hidden px-4 pb-3 border-t border-border">
          <UserSelector />
        </div>
      )}
    </nav>
  );
}