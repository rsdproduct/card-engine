import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { FeedEngineProvider } from "@/context/FeedEngineContext";
import { PasswordGate } from "@/components/auth/PasswordGate";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BOLD Daily Feed Card Engine",
  description:
    "Multi-tenant daily feed prototype for MyPerfectResume, ResumeNow, Zeti, Bold.pro, and Monster.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <AuthProvider>
          <FeedEngineProvider>
            {children}
            <PasswordGate />
          </FeedEngineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
