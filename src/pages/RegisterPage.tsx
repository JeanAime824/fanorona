/**
 * @file RegisterPage.tsx
 * Deprecated register page redirecting directly to Google Sign-In LoginPage.
 */

import React from "react";
import { LoginPage } from "./LoginPage";

interface RegisterPageProps {
  onNavigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  return <LoginPage onNavigate={onNavigate} />;
};
