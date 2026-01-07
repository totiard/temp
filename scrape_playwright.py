from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time

def run():
    print("--- Memulai Scraping (Revisi Logika Harga) ---")
    
    with sync_playwright() as p:
        # 1. Buka Browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 2. Buka Website
        url = "https://emasku.co.id/price"
        print(f"Mengakses: {url}")
        page.goto(url)

        # 3. Tunggu Loading
        print("Menunggu 10 detik agar data update...")
        page.wait_for_timeout(10000)

        # 4. Ambil Konten
        content = page.content()
        soup = BeautifulSoup(content, 'html.parser')
        
        print("\n" + "="*65)
        print(f"{'BERAT':<15} | {'HARGA DASAR':<20} | {'BUYBACK':<20}")
        print("="*65)

        # --- CARI TANGGAL (Opsional) ---
        try:
            # Mencari elemen yang memiliki teks "Date" lalu ambil parentnya
            # Kita gunakan find_all untuk mencari semua text node
            texts = soup.find_all(string=True)
            for t in texts:
                if "Date" in t and len(t) < 50: # filter teks pendek
                    # Ambil parent element text-nya
                    parent = t.find_parent()
                    if parent:
                        # Print teks full dari containernya
                        print(f"[INFO WAKTU]: {parent.parent.get_text(' ', strip=True)}")
                        break
        except:
            pass
        print("-" * 65)

        # --- PARSING TABEL (LOGIKA BARU) ---
        rows = soup.find_all(['div', 'tr'])
        
        for row in rows:
            # Ambil semua potongan teks dalam baris tersebut menjadi list
            # Contoh: ['0.1 gr', 'Rp', '315.500', 'Rp', '237.300']
            parts = list(row.stripped_strings)
            
            # Cek apakah baris ini punya 'gr' dan 'Rp'
            has_gram = any('gr' in p for p in parts)
            has_rp = any('Rp' in p for p in parts)

            if has_gram and has_rp:
                # Variabel penampung
                berat = ""
                harga_list = []

                # LOGIKA PENGGABUNGAN RP + ANGKA
                skip_next = False
                for i in range(len(parts)):
                    if skip_next:
                        skip_next = False
                        continue
                    
                    text = parts[i]

                    # 1. Identifikasi Berat
                    if 'gr' in text and not berat:
                        berat = text
                    
                    # 2. Identifikasi Harga
                    # Jika ketemu 'Rp', kita cek apakah angkanya nempel atau pisah
                    elif 'Rp' in text:
                        # Jika teksnya CUMA "Rp" (terpisah), ambil angka di index berikutnya
                        if text.strip() == "Rp" and i + 1 < len(parts):
                            angka = parts[i+1]
                            harga_full = f"Rp {angka}"
                            harga_list.append(harga_full)
                            skip_next = True # Lompat index berikutnya karena sudah diambil
                        else:
                            # Jika teksnya "Rp300.000" (nempel)
                            harga_list.append(text)

                # Tampilkan hasil jika data lengkap
                if berat and len(harga_list) >= 2:
                    # Ambil harga pertama dan kedua
                    h_jual = harga_list[0]
                    h_beli = harga_list[1]
                    print(f"{berat:<15} | {h_jual:<20} | {h_beli:<20}")

        browser.close()
        print("\n--- Selesai ---")

if __name__ == "__main__":
    run()