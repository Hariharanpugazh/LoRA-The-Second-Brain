"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUsers, useCreateUser } from "@/lib/database-hooks";
import { DatabaseService } from "@/lib/database";

interface User {
  id: string;
  name: string;
  password: string;
  createdAt: string;
}

interface UserContextType {
  users: User[];
  currentUser: User | null;
  login: (name: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (name: string, password: string) => Promise<boolean>;
  switchUser: (userId: string, password: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const createUserMutation = useCreateUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load current user from localStorage (just the ID for session persistence)
    const storedCurrentUserId = localStorage.getItem("lora_current_user");
    if (storedCurrentUserId && users.length > 0) {
      const currentUser = users.find((u: User) => u.id === storedCurrentUserId);
      if (currentUser) {
        setCurrentUser(currentUser);
      }
    }
    setIsLoading(isLoadingUsers);
  }, [users, isLoadingUsers]);

  const createUser = async (name: string, password: string): Promise<boolean> => {
    try {
      const newUser = await createUserMutation.mutateAsync({ name, password });
      return !!newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  };

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const user = await DatabaseService.getUserByName(name);
      if (!user || user.password !== password) {
        return false; // Invalid credentials
      }

      setCurrentUser(user);
      localStorage.setItem("lora_current_user", user.id);
      return true;
    } catch (error) {
      console.error("Error logging in:", error);
      return false;
    }
  };

  const switchUser = async (userId: string, password: string): Promise<boolean> => {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (!user || user.password !== password) {
        return false; // Invalid credentials
      }

      setCurrentUser(user);
      localStorage.setItem("lora_current_user", user.id);
      return true;
    } catch (error) {
      console.error("Error switching user:", error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("lora_current_user");
  };

  const isAuthenticated = currentUser !== null;

  return (
    <UserContext.Provider value={{
      users,
      currentUser,
      login,
      logout,
      createUser,
      switchUser,
      isAuthenticated,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}