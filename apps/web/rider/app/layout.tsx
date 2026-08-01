import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>LagChow Rider Dashboard</title>
        <meta name="description" content="Accept deliveries and track your earnings on LagChow." />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-accent/30 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
