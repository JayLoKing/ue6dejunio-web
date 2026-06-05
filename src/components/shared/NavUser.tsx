import { useState } from "react"
import {
  ChevronsUpDownIcon,
  KeyRoundIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar"
import { ProfileDialog } from "@/features/auth/components/ProfileDialog"
import { ChangePasswordMenuDialog } from "@/features/auth/components/ChangePasswordMenuDialog"
import { useAuthStore } from "@/features/auth/store/authStore"

export function NavUser() {
  const fullName = useAuthStore((s) => s.fullName)
  const email = useAuthStore((s) => s.email)
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)
  const { isMobile } = useSidebar()

  const [profileOpen, setProfileOpen] = useState(false)
  const [changePassOpen, setChangePassOpen] = useState(false)

  const initial = (fullName ?? "U").slice(0, 1).toUpperCase()

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-univalle text-univalle-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {fullName ?? "Usuario"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {role ?? "Sin rol"}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-univalle text-univalle-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {fullName ?? "Usuario"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email ?? ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                <UserIcon />
                Ver perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setChangePassOpen(true)}>
                <KeyRoundIcon />
                Cambiar contrasena
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={handleLogout}
            >
              <LogOutIcon />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangePasswordMenuDialog
        open={changePassOpen}
        onOpenChange={setChangePassOpen}
      />
    </SidebarMenu>
  )
}
