"use client";

import { useState } from "react";

export interface SignUpState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
}

export function useSignUpLogic() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      console.log("Signing up with:", { fullName, email, password });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert("Account created successfully! You can now log in.");
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state: {
      fullName,
      email,
      password,
      confirmPassword,
      isLoading,
    },
    actions: {
      setFullName,
      setEmail,
      setPassword,
      setConfirmPassword,
      handleSignUp,
    },
  };
}