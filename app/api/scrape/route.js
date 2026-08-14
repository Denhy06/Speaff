import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL tidak boleh kosong' }, { status: 400 });
    }

    // Menjalankan virtual browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Menyamar sebagai browser sungguhan agar tidak diblokir Shopee
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    // Mengunjungi URL (bisa link shp.ee, akan otomatis redirect ke link asli)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Tunggu 3 detik agar proses redirect selesai dan elemen halaman ter-load
    await new Promise(r => setTimeout(r, 3000)); 

    // Mengekstrak data menggunakan tag Meta (Cara paling stabil untuk Shopee)
    const productData = await page.evaluate(() => {
      const titleTag = document.querySelector('meta[property="og:title"]');
      const imageTag = document.querySelector('meta[property="og:image"]');
      
      return {
        title: titleTag ? titleTag.content : document.title,
        image: imageTag ? imageTag.content : null,
        url: document.location.href // Mengambil URL final setelah redirect
      };
    });

    await browser.close();

    return NextResponse.json(productData);
    
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: 'Gagal mengambil data. Pastikan link valid.' }, { status: 500 });
  }
}
