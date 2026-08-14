import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JFG Clinic - Offre minceur découverte",
  description:
    "Vérifiez votre éligibilité à l'offre minceur découverte JFG Clinic avec bilan offert et séance test haute technologie.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
