import React, { Suspense } from "react";
import { SignUpView } from "@/client/views/Auth/SignUpView";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpView />
    </Suspense>
  );
}
