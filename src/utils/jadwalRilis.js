import axios from 'axios';
import scrapeJadwalRilis from '../lib/scrapeJadwalRilis.js';

// Ambil BASEURL dari environment variable, atau gunakan default
const BASEURL = process.env.BASEURL || 'https://otakudesu.best';

/**
 * Mengambil data jadwal rilis anime.
 * @returns {Promise<Array>} - Promise yang akan resolve dengan data jadwal rilis.
 */
const jadwalRilis = async () => {
    try {
        // Ambil data HTML dari halaman jadwal rilis
        const { data } = await axios.get(`${BASEURL}/jadwal-rilis/`);

        // Scrape data menggunakan scraper yang baru kita buat
        const result = scrapeJadwalRilis(data);

        return result;
    } catch (error) {
        console.error('Error fetching release schedule:', error);
        return null; // Kembalikan null atau lempar error sesuai kebutuhan
    }
};

export default jadwalRilis;
