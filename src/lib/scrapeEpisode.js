import { load } from 'cheerio';
import axios from 'axios';

// Ambil BASEURL dari environment variable
const BASEURL = process.env.BASEURL || 'https://otakudesu.best';

/**
 * Mengambil judul episode dari halaman.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {string} Judul episode
 */
const getEpisodeTitle = ($) => {
    return $('.venutama .posttl').text().trim(); // [cite: 142]
};

/**
 * Mengambil data anime (slug dan URL) dari halaman episode.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {{slug: string | undefined, otakudesu_url: string | undefined}}
 */
const getAnimeData = ($) => {
    // Mencari link "See All Episodes" yang memiliki URL anime
    const animeLinkElement = $('.flir a[href*="/anime/"]'); // [cite: 192]
    const otakudesu_url = animeLinkElement.attr('href'); // [cite: 193]
    
    // Ekstrak slug dari URL
    const slug = otakudesu_url
        ?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '') // [cite: 193]
        .replace('/', ''); // [cite: 193]

    return {
        slug: slug, // [cite: 194]
        otakudesu_url: otakudesu_url, // [cite: 194]
    };
};

/**
 * Mengambil navigasi episode (sebelumnya dan selanjutnya).
 * Menggunakan selector yang lebih stabil.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {{
 * has_previous_episode: boolean,
 * previous_episode_slug: string | null,
 * has_next_episode: boolean,
 * next_episode_slug: string | null
 * }}
 */
const getNavigation = ($) => {
    // Menggunakan selector title yang lebih stabil daripada :first atau :last [cite: 189-192]
    const prevEl = $('.flir a[title="Episode Sebelumnya"]');
    const nextEl = $('.flir a[title="Episode Selanjutnya"]');

    // Helper untuk mengekstrak slug dari href
    const getSlug = (el) => {
        const href = el.attr('href');
        // Pastikan linknya adalah link episode
        if (!href || !href.includes('/episode/')) return null;
        // Ambil bagian slug setelah '/episode/' dan bersihkan
        return href.split('/episode/')[1]?.replace('/', '');
    };

    const prevSlug = getSlug(prevEl);
    const nextSlug = getSlug(nextEl);

    return {
        has_previous_episode: !!prevSlug, // [cite: 139]
        previous_episode_slug: prevSlug || null,
        has_next_episode: !!nextSlug, // [cite: 138]
        next_episode_slug: nextSlug || null,
    };
};

/**
 * Mengambil URL stream default dari iframe utama.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {string | null} URL stream
 */
const getDefaultStream = ($) => {
    return $('#pembed iframe').attr('src') || null; // [cite: 143]
};

/**
 * Mengambil semua link download (MP4, MKV, dll.).
 * Logika ini lebih bersih daripada createDownloadData [cite: 173-189].
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {Array<{format_title: string, formats: Array<Object>}>}
 */
const getDownloadLinks = ($) => {
    const downloadGroups = [];
    
    // Loop setiap div.download
    $('.download').each((i, el) => {
        // Ambil judul format (e.g., "Alma-chan... [Kazeuta]")
        const formatTitle = $(el).find('h4').text().trim();
        const formatGroups = [];

        // Loop setiap <ul> (satu untuk MP4, satu untuk MKV)
        $(el).find('ul').each((j, ul) => {
            // Loop setiap <li> (satu untuk tiap resolusi)
            $(ul).find('li').each((k, li) => {
                const resolution = $(li).find('strong').text().trim(); // e.g., "Mp4 360p" [cite: 181, 188]
                const size = $(li).find('i').text().trim(); // e.g., "34.8 MB"
                const providerLinks = [];

                // Loop setiap <a> (link provider) [cite: 178, 185]
                $(li).find('a').each((l, a) => {
                    providerLinks.push({
                        provider: $(a).text().trim(), // [cite: 180, 187]
                        url: $(a).attr('href'), // [cite: 180, 187]
                    });
                });

                if (providerLinks.length > 0) {
                    formatGroups.push({
                        resolution,
                        size,
                        links: providerLinks,
                    });
                }
            });
        });
        
        if(formatGroups.length > 0) {
            downloadGroups.push({
                format_title: formatTitle,
                formats: formatGroups,
            });
        }
    });

    return downloadGroups;
};

/**
 * Melakukan POST ke admin-ajax.php untuk mendapatkan URL iframe stream.
 * Ini adalah versi sederhana dari 'postToGetData' [cite: 154]
 * yang hanya mengambil URL iframe dan tidak melanjutkannya
 * ke resolver eksternal (seperti getBloggerSource, dll.) [cite: 160-167].
 * * @param {string} initAction - Aksi pertama (nonce fetch)
 * @param {string} mainAction - Aksi kedua (data fetch)
 * @param {Object} videoData - Objek berisi { id, i, q }
 * @returns {Promise<string | null>} URL stream (iframe src)
 */
const fetchStreamUrl = async (initAction, mainAction, videoData) => {
    if (!videoData) return null;

    try {
        const url = `${BASEURL}/wp-admin/admin-ajax.php`;
        
        // --- Langkah 1: Dapatkan nonce ---
        const form1 = new URLSearchParams();
        form1.append("id", videoData.id); // [cite: 155]
        form1.append("i", videoData.i); // [cite: 156]
        form1.append("q", videoData.q); // [cite: 156]
        form1.append("action", initAction); // [cite: 156]
        
        const res1 = await axios.post(url, form1.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        
        const nonce = res1.data.data; // [cite: 157]
        if (!nonce) throw new Error('Gagal mendapatkan nonce');

        // --- Langkah 2: Dapatkan URL Stream ---
        const form2 = new URLSearchParams();
        form2.append("id", videoData.id); // [cite: 157]
        form2.append("i", videoData.i); // [cite: 157]
        form2.append("q", videoData.q); // [cite: 157]
        form2.append("action", mainAction); // [cite: 157]
        form2.append("nonce", nonce); // [cite: 157]
        
        const res2 = await axios.post(url, form2.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" } // [cite: 158]
        });

        // Decode Base64, load ke Cheerio, dan ekstrak iframe src [cite: 159]
        const decodedHtml = Buffer.from(res2.data.data, "base64").toString("utf8"); // [cite: 159]
        const $$ = load(decodedHtml);
        const streamUrl = $$("iframe").attr("src"); // [cite: 159]
        
        return streamUrl || null;

    } catch (err) {
        console.error(`Error fetching stream URL for ${videoData.q}:`, err.message);
        return null;
    }
};

/**
 * Mengambil dan me-resolve semua mirror stream.
 * Ini menggantikan 'getStreamQuality' [cite: 168]
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {Promise<Array<{quality: string, provider: string, url: string | null}>>}
 */
const resolveStreamMirrors = async ($) => {
    // 1. Ekstrak aksi dari <script> [cite: 171]
    const actions = [];
    $("script").each((i, el) => {
        const scriptContent = $(el).html();
        if (!scriptContent) return;
        // Cari semua string 'action: "..."'
        const regex = /action\s*:\s*"([a-z0-9]+)"/gi; // [cite: 171]
        let match;
        while ((match = regex.exec(scriptContent)) !== null) {
          actions.push(match[1]); // [cite: 171]
        }
    });

    const uniqueActions = [...new Set(actions)]; // [cite: 172]
    const initAction = uniqueActions[1]; // [cite: 172]
    const mainAction = uniqueActions[0]; // [cite: 172]
    
    // Jika tidak ada aksi, kita tidak bisa melanjutkan
    if (!initAction || !mainAction) {
        console.error("Gagal menemukan action nonces untuk stream.");
        return [];
    }
    
    const mirrorPromises = [];

    // 2. Loop semua elemen mirror [cite: 169]
    $('.mirrorstream ul').each((i, ul) => {
        const quality = $(ul).attr('class')?.replace('m', '').trim(); // e.g., "360p"
        if (!quality) return;

        $(ul).find('li a').each((j, a) => {
            const provider = $(a).text().trim();
            const dataContent = $(a).attr('data-content');
            
            if (dataContent) {
                try {
                    // Decode Base64 data [cite: 170]
                    const videoData = JSON.parse(Buffer.from(dataContent, "base64").toString("utf8")); // [cite: 170]
                    
                    // Tambahkan promise untuk me-resolve URL ini
                    mirrorPromises.push(
                        fetchStreamUrl(initAction, mainAction, videoData).then(url => ({
                            quality,
                            provider,
                            url: url
                        }))
                    );

                } catch (e) {
                    console.error(`Gagal parse data-content untuk ${provider}: ${e.message}`);
                }
            }
        });
    });

    // 3. Jalankan semua promise secara paralel
    const resolvedMirrors = await Promise.all(mirrorPromises);
    
    // Filter hasil yang gagal (null)
    return resolvedMirrors.filter(mirror => mirror.url);
};

/**
 * Fungsi utama untuk scrape halaman episode.
 * Dibuat async untuk me-resolve stream URLs.
 * @param {string} html - Konten HTML halaman episode
 * @returns {Promise<Object | undefined>}
 */
const scrapeEpisode = async (html) => {
    const $ = load(html);

    const episodeTitle = getEpisodeTitle($); // [cite: 135]
    // Jika tidak ada judul, anggap halaman tidak valid
    if (!episodeTitle) return undefined; // [cite: 137]

    const animeData = getAnimeData($); // [cite: 136]
    const navigation = getNavigation($);
    const defaultStream = getDefaultStream($); // [cite: 135]
    const downloadData = getDownloadLinks($); // [cite: 135]
    
    // Me-resolve semua mirror stream [cite: 136, 172]
    const resolvedStreamList = await resolveStreamMirrors($);

    return {
        episode: episodeTitle, // [cite: 138]
        anime: animeData, // [cite: 138]
        ...navigation, // (has_previous_episode, previous_episode_slug, ...)
        stream_url: defaultStream, // URL stream default (iframe)
        streamList: resolvedStreamList, // Daftar mirror stream (sudah di-resolve) - FIX TYPO [cite: 141]
        download_urls: downloadData, // [cite: 141]
    };
};

export default scrapeEpisode;
