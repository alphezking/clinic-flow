import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Calendar, ListOrdered, Stethoscope, FlaskConical,
  Pill, Receipt, BarChart3, UserCog, Settings, ShieldCheck, LifeBuoy,
  DatabaseBackup, User as UserIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { canAccess, type AppRole, type ModuleKey } from "@/lib/rbac";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; module: ModuleKey };

const clinicalItems: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { title: "Patients", url: "/patients", icon: Users, module: "patients" },
  { title: "Appointments", url: "/appointments", icon: Calendar, module: "appointments" },
  { title: "Queue", url: "/queue", icon: ListOrdered, module: "queue" },
  { title: "Consultations", url: "/consultations", icon: Stethoscope, module: "consultations" },
  { title: "Laboratory", url: "/laboratory", icon: FlaskConical, module: "laboratory" },
  { title: "Pharmacy", url: "/pharmacy", icon: Pill, module: "pharmacy" },
  { title: "Billing", url: "/billing", icon: Receipt, module: "billing" },
  { title: "Reports", url: "/reports", icon: BarChart3, module: "reports" },
];

const adminItems: Item[] = [
  { title: "Staff", url: "/staff", icon: UserCog, module: "staff" },
  { title: "Settings", url: "/settings", icon: Settings, module: "settings" },
  { title: "Audit Logs", url: "/audit-logs", icon: ShieldCheck, module: "audit" },
  { title: "Support Center", url: "/support", icon: LifeBuoy, module: "support" },
  { title: "Backups", url: "/backups", icon: DatabaseBackup, module: "backups" },
];

export function AppSidebar({ roles }: { roles: AppRole[] }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const clinical = clinicalItems.filter((i) => canAccess(i.module, roles));
  const admin = adminItems.filter((i) => canAccess(i.module, roles));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            A
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Alphez Health</span>
            <span className="text-xs text-sidebar-foreground/60">Center Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {clinical.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Clinical</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clinical.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {admin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {admin.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link to="/profile">
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
