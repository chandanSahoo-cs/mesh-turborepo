import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Modals } from "@/components/Modals";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
// In layout.tsx or page.tsx
import PresenceTrackerWrapper from "@/components/PresenceTrackerWrapper";
import { VoiceRoomWrapper } from "@/components/rooms/VoiceRoomWrapper";
import "@livekit/components-styles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mesh",
  description: "A mesh of chats",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <NuqsAdapter>
            <ConvexClientProvider>
              <PresenceTrackerWrapper />
              <VoiceRoomWrapper />
              <Toaster richColors />
              <Modals />
              {children}
            </ConvexClientProvider>
          </NuqsAdapter>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
