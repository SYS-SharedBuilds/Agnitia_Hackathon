import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { WorkflowNotificationProvider } from "@/lib/notifications";
import Shell from "./Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwitchOn — Telecom Service Activation Orchestrator",
  description: "Durable telecom service activation orchestrator powered by Temporal Python SDK, FastAPI, Redis Streams, and Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white font-body-md text-[#0A1B2E] antialiased">
        <AuthProvider>
          <WorkflowNotificationProvider>
            <Shell>{children}</Shell>
          </WorkflowNotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
