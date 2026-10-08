import "./globals.css";
import Shell from "./Shell";

export const metadata = {
  title: "SwitchOn — Telecom Service Activation Orchestrator",
  description: "Durable saga orchestration control plane for telecom activations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F6F8FB] font-body-md text-on-surface antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
