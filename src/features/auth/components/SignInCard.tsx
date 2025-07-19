"use client"

import type React from "react"

import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { useAuthActions } from "@convex-dev/auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TriangleAlertIcon } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import type { SignInFlow } from "../types"

interface SignInCardProps {
  setAuthState: (state: SignInFlow) => void
}

export const SignInCard = ({ setAuthState }: SignInCardProps) => {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  const handleSignInProvider = (value: "github" | "google") => {
    setPending(true)
    signIn(value).finally(() => {
      setPending(false)
    })
  }

  const handlePasswordSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    signIn("password", { email, password, flow: "signIn" })
      .catch(() => {
        setError("Invalid sign in credentials")
      })
      .finally(() => {
        setPending(false)
      })
  }

  return (
    <Card className="w-full bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-8 backdrop-blur-sm bg-white/95">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="font-mono font-black text-2xl text-black uppercase tracking-wide">
          Login to continue
        </CardTitle>
        <CardDescription className="font-mono text-gray-700 text-sm">
          Use your email or another service to continue
        </CardDescription>
      </CardHeader>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border-4 border-black p-4 rounded-xl flex items-center gap-x-2 text-sm text-black mb-6 shadow-[4px_4px_0px_0px_#000000]"
        >
          <TriangleAlertIcon className="size-4" />
          <p className="font-mono font-bold">{error}</p>
        </motion.div>
      )}

      <CardContent className="space-y-6 px-0 pb-0">
        <form onSubmit={(e) => handlePasswordSignIn(e)} className="space-y-4">
          <Input
            disabled={pending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#5170ff] focus:border-[#5170ff] transition-all duration-200"
          />
          <Input
            disabled={pending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#5170ff] focus:border-[#5170ff] transition-all duration-200"
          />
          <Button
            type="submit"
            className="w-full bg-[#5170ff] text-white font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:scale-102 hover:bg-[#4060ef]"
            size="lg"
            disabled={pending}
          >
            {pending ? "Loading..." : "Continue"}
          </Button>
        </form>

        <div className="relative">
          <Separator className="border-2 border-black" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white px-4 font-mono font-bold text-black uppercase text-xs tracking-wide">Or</span>
          </div>
        </div>

        <div className="flex flex-col gap-y-4">
          <Button
            disabled={pending}
            onClick={() => handleSignInProvider("google")}
            className="w-full bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:scale-102 hover:bg-gray-50 relative"
            size="lg"
          >
            <FcGoogle className="size-5 absolute left-4" />
            Continue with Google
          </Button>
          <Button
            disabled={pending}
            onClick={() => handleSignInProvider("github")}
            className="w-full bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:scale-102 hover:bg-gray-50 relative"
            size="lg"
          >
            <FaGithub className="size-5 absolute left-4" />
            Continue with Github
          </Button>
        </div>

        <p className="text-xs font-mono text-gray-700 text-center">
          Don&apos;t have an account?{" "}
          <span
            onClick={() => setAuthState("signUp")}
            className="text-[#5170ff] hover:text-[#4060ef] cursor-pointer font-bold uppercase tracking-wide transition-colors duration-200"
          >
            Sign up
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
