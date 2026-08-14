export const metadata = {
  title: 'Shopee Link Scraper',
  description: 'Ekstrak data dari link Shopee',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
