import './globals.css';
import '../styles/layout.css';
import '../styles/chat.css';

export const metadata = {
  title: 'MYBHEG — WhatsApp Business Panel',
  description: 'Shopify sipariş yönetimi ve WhatsApp müşteri iletişim paneli',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
