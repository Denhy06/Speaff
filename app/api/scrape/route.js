import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { NextResponse } from 'next/server';

// Opsi khusus untuk memperpanjang waktu proses di Vercel
export const maxDuration = 60; 

export async function POST(request) {
  let browser = null;

  try {
    const { url } = await request.json();
    
    // Konfigurasi Chromium khusus untuk Vercel
    const executablePath = await chromium.executablePath();
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    // Trik menyamar sebagai browser biasa
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Menunggu halaman selesai dimuat. Timeout dibuat lebih aman (10 detik)
    // agar tidak bertabrakan dengan batas maksimal gratisan Vercel
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Tunggu sejenak agar link shp.ee selesai redirect ke produk asli
    await new Promise(r => setTimeout(r, 3000)); 

    // Proses mengambil data
    const productData = await page.evaluate(() => {
      const titleTag = document.querySelector('meta[property="og:title"]');
      const imageTag = document.querySelector('meta[property="og:image"]');
      
      return {
        title: titleTag ? titleTag.content : document.title,
        image: imageTag ? imageTag.content : null,
        url: document.location.href
      };
    });

    await browser.close();

    // Jika tertangkap basah sebagai robot oleh Shopee, beri peringatan
    if (!productData.title || productData.title.includes('Shopee Indonesia')) {
      throw new Error("Waktu habis, halaman Shopee gagal termuat sempurna atau terdeteksi bot.");
    }

    return NextResponse.json(productData);
    
  } catch (error) {
    // Pastikan browser selalu ditutup meskipun error, agar memori server Vercel tidak penuh
    if (browser !== null) {
      await browser.close();
    }
    
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data dari server Vercel.' }, 
      { status: 500 }
    );
  }
}
