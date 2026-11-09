"use client"

import { Bell, Menu, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  query: string
  onQueryChange: (value: string) => void
  notificationCount: number
  onNotificationsClick: () => void
  onMenuClick: () => void
}

export function Header({
  query,
  onQueryChange,
  notificationCount,
  onNotificationsClick,
  onMenuClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="relative w-full max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search apps, permissions, logs..."
          aria-label="Search apps, permissions, logs"
          className="h-9 border-border bg-card pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationsClick}
          aria-label={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : "Notifications"
          }
        >
          <Bell className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-background">
              {notificationCount}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card py-1 pl-1 pr-3">
          <Avatar size="default">
            <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
              SO
            </AvatarFallback>
          </Avatar>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium">Souvik</p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
