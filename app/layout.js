import './globals.css';

export const metadata = {
  title: 'Bi The Way',
  description: 'Swipe, match, and level up.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
