import './globals.css';

export const metadata = {
  title: 'AI Blogging Platform',
  description: 'Create, manage, and monetize your blogs with AI-powered features'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
