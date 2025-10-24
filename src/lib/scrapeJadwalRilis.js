import { load } from 'cheerio';

/**
 * Scraper untuk mengambil data jadwal rilis dari HTML.
 * @param {string} html - Konten HTML dari halaman jadwal rilis.
 * @returns {Array} - Array objek yang berisi jadwal rilis per hari.
 */
const scrapeJadwalRilis = (html) => {
    const $ = load(html);
    const schedule = [];

    // Temukan setiap blok hari (.kglist321) di dalam kontainer utama (.kgjdwl321)
    $('.kgjdwl321 .kglist321').each((i, dayElement) => {
        // Ambil nama hari dari tag <h2>
        const day = $(dayElement).find('h2').text().trim();
        const animeList = [];

        // Temukan setiap item anime (<a>) di dalam daftar (<ul> <li>)
        $(dayElement).find('ul li a').each((j, animeElement) => {
            const title = $(animeElement).text().trim();
            const otakudesu_url = $(animeElement).attr('href');

            // Ekstrak slug dari URL, menggunakan pola yang sama dengan scraper lain di proyekmu
            const slug = otakudesu_url
                ?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '')
                .replace('/', '');

            if (title && slug && otakudesu_url) {
                animeList.push({
                    title,
                    slug,
                    otakudesu_url
                });
            }
        });

        // Tambahkan data hari itu ke array jadwal utama
        if (day && animeList.length > 0) {
            schedule.push({
                day,
                animeList
            });
        }
    });

    return schedule;
};

export default scrapeJadwalRilis;
