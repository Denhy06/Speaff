import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    // Log untuk mengecek di terminal/console
    console.log("Mulai scraping URL:", url); 

    const browser = await puppeteer.launch({
      headless: true, // Berjalan di background
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled' // Trik menyembunyikan status otomatisasi dari Shopee
      ] 
    });
    
    const page = await browser.newPage();
    
    // Menyamar menggunakan User Agent Chrome versi terbaru
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Trik tambahan: Hapus jejak "webdriver" agar terlihat seperti browser manusia asli
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Gunakan 'networkidle2' agar Puppeteer menunggu semua rentetan redirect dari shortlink selesai
    // Waktu tunggu maksimal diperpanjang jadi 60 detik (60000 ms)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Tambahkan ekstra waktu 5 detik untuk memastikan gambar dan meta tag React ter-render sempurna
    await new Promise(r => setTimeout(r, 5000)); 

    // Mulai mengekstrak data
    const productData = await page.evaluate(() => {
      const titleTag = document.querySelector('meta[property="og:title"]');
      const imageTag = document.querySelector('meta[property="og:image"]');
      
      return {
        title: titleTag ? titleTag.content : document.title,
        image: imageTag ? imageTag.content : null,
        url: document.location.href // Menangkap URL final
      };
    });

    await browser.close();

    console.log("Data berhasil didapat:", productData.title);

    // Validasi pencegahan jika ternyata nyangkut di halaman login/captcha
    if (!productData.title || productData.title === 'Shopee Indonesia') {
      throw new Error("Terblokir halaman verifikasi Shopee atau produk tidak ditemukan.");
    }

    return NextResponse.json(productData);
    
  } catch (error) {
    // Memunculkan pesan error spesifik di terminal untuk memudahkan pengecekan
    console.error("Scraping error:", error.message);
    
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data.' }, 
      { status: 500 }
    );
  }
}
