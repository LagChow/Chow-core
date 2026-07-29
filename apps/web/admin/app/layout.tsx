import './globals.css';

export const metadata = {
  title: 'LagChow Admin Panel',
  description: 'Manage vendors, riders, orders, and platform operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-background w-full">
        {children}
      </body>
    </html>
  );
}
