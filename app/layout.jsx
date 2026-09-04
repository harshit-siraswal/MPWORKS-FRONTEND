import '../styles.css';

export const metadata = {
  title: 'MP Works | Public data explorer for MPLADS',
  description: 'Source-backed public data explorer for MPLADS works.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
