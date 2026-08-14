import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) throw new Error('URL kosong');

    // Kita pakai API pihak ketiga gratis (Microlink) buat jadi "tameng".
    // Sistem mereka yang bakal nembus anti-bot Shopee dan un-shorten URL-nya.
    // Jadi server Vercel lo aman dari blokir IP 403.
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl);
    const result = await response.json();

    // Kalau gagal nembus
    if (result.status !== 'success') {
      throw new Error('Gagal mengekstrak data. Link mungkin tidak valid atau diproteksi penuh.');
    }

    // Ekstrak data yang berhasil diambil Microlink
    const title = result.data.title || 'Judul tidak ditemukan';
    const image = result.data.image?.url || null;
    const finalUrl = result.data.url || url;

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
