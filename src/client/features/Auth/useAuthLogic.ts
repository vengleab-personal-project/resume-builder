"use client";

import { useState } from "react";

export interface AuthState {
  email: string;
  password: string;
  isLoading: boolean;
}

export function useAuthLogic() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      console.log("Logging in with:", { email, password });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert("Login functionality is not yet connected to a backend.");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: {
      email,
      password,
      isLoading,
    },
    actions: {
      setEmail,
      setPassword,
      handleLogin,
    },
  };
}