import "./globals.css";

export const metadata = {
  title: "Vampire Survivors-like Foundation",
  description: "Next.js landing site for a Vite-powered game loop."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
