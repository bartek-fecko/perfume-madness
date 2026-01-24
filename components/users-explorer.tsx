"use client";

import { Users, Sparkles, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { FollowButton } from "@/components/follow-button";

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  perfume_count: number;
  is_following: boolean;
}

interface UsersExplorerProps {
  users: UserData[];
  onUserSelect: (userId: string) => void;
}

export function UsersExplorer({ users, onUserSelect }: UsersExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const name = (user.full_name || user.email).toLowerCase();
    return name.includes(searchLower);
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Eksploruj użytkowników
        </h2>
        <p className="text-muted-foreground">
          Zobacz kolekcje innych miłośników perfum
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj użytkowników..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredUsers.length} użytkowników</span>
        <span>•</span>
        <span>{users.filter((u) => u.is_following).length} obserwowanych</span>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="group relative bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/50 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <button
                onClick={() => onUserSelect(user.id)}
                className="relative w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name || user.email}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-lg">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                )}

                {/* Following Badge */}
                {user.is_following && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                    <Sparkles className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onUserSelect(user.id)}
                  className="text-left w-full"
                >
                  <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                    {user.full_name || user.email.split("@")[0]}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {user.perfume_count}{" "}
                    {user.perfume_count === 1
                      ? "perfumy"
                      : user.perfume_count < 5
                        ? "perfumy"
                        : "perfum"}
                  </p>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUserSelect(user.id)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1 flex-1"
                  >
                    Zobacz kolekcję
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </button>

                  <FollowButton
                    userId={user.id}
                    initialIsFollowing={user.is_following}
                    variant="compact"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            {searchQuery
              ? "Nie znaleziono użytkowników"
              : "Brak użytkowników do wyświetlenia"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-primary hover:underline"
            >
              Wyczyść wyszukiwanie
            </button>
          )}
        </div>
      )}
    </div>
  );
}
