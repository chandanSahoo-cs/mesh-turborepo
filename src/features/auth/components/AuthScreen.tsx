"use client";

import { useState } from "react";
import { SignInFlow } from "../types";
import { SignInCard } from "./SignInCard";
import { SignUpCard } from "./SignUpCard";

export const AuthScreen = () => {
  const [authState, setAuthState] = useState<SignInFlow>("signIn");
  return (
    <div className="h-full flex items-center justify-center bg-[#5C3B58]">
      <div className="md:h-auto md:w-[420px]">
        {authState === "signIn" ? <SignInCard setAuthState={setAuthState}/> : <SignUpCard setAuthState={setAuthState}/>}
      </div>
    </div>
  );
};
