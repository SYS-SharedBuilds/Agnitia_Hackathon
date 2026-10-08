import type { Metadata } from "next";
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
      <body className="bg-[#F2F6FB] font-body-md text-black antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
