import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) throw new Error('URL kosong');

    // Trik: Menyamar sebagai Bot Facebook/WhatsApp.
    // Shopee sengaja membuka akses untuk bot ini agar link bisa ada preview-nya (OG Tags).
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      redirect: 'follow', // Otomatis telusuri redirect dari s.shopee.co.id ke url produk asli
    });

    if (!response.ok) {
      throw new Error(`Gagal akses Shopee (Status: ${response.status})`);
    }

    const html = await response.text();
    const finalUrl = response.url; // Menangkap URL panjang aslinya

    // Ekstrak data langsung dari teks HTML menggunakan Regex
    // Tidak butuh cheerio atau puppeteer sama sekali
    const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);

    let title = titleMatch ? titleMatch[1] : null;
    let image = imageMatch ? imageMatch[1] : null;

    // Bersihkan karakter aneh pada judul (HTML Entities) jika ada
    if (title) {
      title = title.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    }

    if (!title) {
       throw new Error("Gagal mengambil data produk. Link mungkin salah atau dihapus.");
    }

    return NextResponse.json({
      title,
      image,
      url: finalUrl
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
