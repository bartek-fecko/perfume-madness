"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogIn, User, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/actions/notifications";
import type { User as UserType, Notification } from "@/lib/types";
import Image from "next/image";

interface TopHeaderProps {
  user: UserType | null;
}

export function TopHeader({ user }: TopHeaderProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Auto-refresh co 30 sekund
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.is_read).length);
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Oznacz jako przeczytane
    handleMarkAsRead(notification.id);

    // Zamknij popover
    setIsNotificationsOpen(false);

    // Domyślna akcja dla całej notyfikacji (używana gdy klikasz w background)
    if (notification.type === "follow" && notification.from_user_id) {
      router.push(`/?view=explore&user=${notification.from_user_id}`);
    }
  };

  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Zatrzymaj propagację do parent button
    setIsNotificationsOpen(false);
    router.push(`/?view=explore&user=${userId}`);
  };

  const handlePerfumeClick = (e: React.MouseEvent, perfumeId: string) => {
    e.stopPropagation(); // Zatrzymaj propagację do parent button
    setIsNotificationsOpen(false);
    router.push(`/perfume/${perfumeId}`);
  };

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const renderNotificationContent = (notification: Notification) => {
    if (notification.type === "new_perfume") {
      return (
        <div className="space-y-1.5">
          {/* Klikalna sekcja - użytkownik */}
          <button
            onClick={(e) =>
              notification.from_user_id &&
              handleUserClick(e, notification.from_user_id)
            }
            className="flex items-center gap-2 hover:opacity-70 transition-opacity w-fit"
          >
            {notification.from_user_avatar ? (
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={notification.from_user_avatar} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {notification.from_user_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <p className="text-sm font-medium text-foreground">
              {notification.from_user_name || "Użytkownik"}
            </p>
          </button>

          {/* Klikalna sekcja - perfumy */}
          <p className="text-sm text-muted-foreground pl-9">
            dodał nowe perfumy:{" "}
            {notification.perfume_id ? (
              <button
                onClick={(e) => handlePerfumeClick(e, notification.perfume_id!)}
                className="font-medium text-foreground hover:text-primary transition-colors underline decoration-dotted"
              >
                {notification.perfume_name}
              </button>
            ) : (
              <span className="font-medium text-foreground">
                {notification.perfume_name}
              </span>
            )}
          </p>

          {/* Klikalna sekcja - zobacz kolekcję */}
          {notification.from_user_id && (
            <button
              onClick={(e) => handleUserClick(e, notification.from_user_id!)}
              className="flex items-center gap-1.5 text-xs text-primary pl-9 pt-0.5 hover:underline w-fit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">Zobacz kolekcję →</span>
            </button>
          )}
        </div>
      );
    }

    if (notification.type === "perfume_deleted") {
      return (
        <div className="space-y-1.5">
          {/* Klikalna sekcja - użytkownik */}
          <button
            onClick={(e) =>
              notification.from_user_id &&
              handleUserClick(e, notification.from_user_id)
            }
            className="flex items-center gap-2 hover:opacity-70 transition-opacity w-fit"
          >
            {notification.from_user_avatar ? (
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={notification.from_user_avatar} />
                <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                  {notification.from_user_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
            )}
            <p className="text-sm font-medium text-foreground">
              {notification.from_user_name || "Użytkownik"}
            </p>
          </button>

          {/* Wiadomość o usunięciu */}
          <p className="text-sm text-muted-foreground pl-9">
            usunął perfumy:{" "}
            <span className="font-medium text-foreground line-through decoration-destructive/50">
              {notification.message?.replace("Usunął perfumy: ", "")}
            </span>
          </p>

          {/* Klikalna sekcja - zobacz kolekcję */}
          {notification.from_user_id && (
            <button
              onClick={(e) => handleUserClick(e, notification.from_user_id!)}
              className="flex items-center gap-1.5 text-xs text-primary pl-9 pt-0.5 hover:underline w-fit"
            >
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">Zobacz kolekcję →</span>
            </button>
          )}
        </div>
      );
    }

    if (notification.type === "follow") {
      return (
        <div className="space-y-1.5">
          {/* Klikalna sekcja - użytkownik */}
          <button
            onClick={(e) =>
              notification.from_user_id &&
              handleUserClick(e, notification.from_user_id)
            }
            className="flex items-center gap-2 hover:opacity-70 transition-opacity w-fit"
          >
            {notification.from_user_avatar ? (
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={notification.from_user_avatar} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {notification.from_user_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <p className="text-sm font-medium text-foreground">
              {notification.from_user_name || "Użytkownik"}
            </p>
          </button>

          <p className="text-sm text-muted-foreground pl-9">
            zaczął Cię obserwować
          </p>

          {/* Klikalna sekcja - zobacz profil */}
          {notification.from_user_id && (
            <button
              onClick={(e) => handleUserClick(e, notification.from_user_id!)}
              className="flex items-center gap-1.5 text-xs text-primary pl-9 pt-0.5 hover:underline w-fit"
            >
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">Zobacz profil →</span>
            </button>
          )}
        </div>
      );
    }

    // Fallback dla innych typów notyfikacji
    return (
      <div className="space-y-1">
        <p className="text-sm text-foreground font-medium">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-sm text-muted-foreground">
            {notification.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border h-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto bg-primary/10">
          <Image
            src="/logo.jpg"
            alt="PerfumeMadness logo"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          PerfumeMadness
        </h1>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Twoja kolekcja perfum
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Notifications */}
            <Popover
              open={isNotificationsOpen}
              onOpenChange={setIsNotificationsOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-0">
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                  <h3 className="font-semibold text-sm">Powiadomienia</h3>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Oznacz wszystkie
                    </button>
                  )}
                </div>
                <div className="max-h-[32rem] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Brak powiadomień
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Tutaj zobaczysz nowe perfumy i obserwujących
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`w-full text-left p-4 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-all duration-200 ${
                          !notification.is_read
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : ""
                        }`}
                      >
                        {/* Oznacz jako przeczytane po najechaniu jeśli nieprzeczytana */}
                        <div
                          onMouseEnter={() =>
                            !notification.is_read &&
                            handleMarkAsRead(notification.id)
                          }
                        >
                          {renderNotificationContent(notification)}
                          <p className="text-xs text-muted-foreground/70 mt-2 pl-9">
                            {new Date(
                              notification.created_at,
                            ).toLocaleDateString("pl-PL", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={user.avatar_url || "/placeholder.svg"}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate hidden sm:inline">
                    {user.name || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground"
                >
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Wyloguj się
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoogleSignIn}
            className="gap-2 bg-transparent"
          >
            <LogIn className="w-4 h-4" />
            Zaloguj się przez Google
          </Button>
        )}
      </div>
    </header>
  );
}
