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
      <body style={{ margin: 0, fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
