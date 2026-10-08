import React, { Suspense } from "react";
import { LoginView } from "@/client/views/Auth/LoginView";

// LoginView reads ?next= through useSearchParams, which forces this route to
// opt out of static prerendering unless the read is inside a Suspense boundary.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
