import { load } from 'cheerio';

/**
 * Mengambil judul episode dari halaman.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {string} Judul episode
 */
const getEpisodeTitle = ($) => {
    return $('.venutama .posttl').text().trim(); // [cite: 414, 421]
};

/**
 * Mengambil data anime (slug dan URL) dari halaman episode.
 * Menggunakan logika yang sudah diperbaiki sebelumnya.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {{slug: string | undefined, otakudesu_url: string | undefined}}
 */
const getAnimeData = ($) => {
    // Mencari link "See All Episodes" yang memiliki URL anime
    const animeLinkElement = $('.flir a[href*="/anime/"]'); // [cite: 471]
    const otakudesu_url = animeLinkElement.attr('href'); // [cite: 472]
    
    // Ekstrak slug dari URL
    const slug = otakudesu_url
        ?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '') // [cite: 472]
        .replace('/', ''); // [cite: 472]

    return {
        slug: slug, // [cite: 473]
        otakudesu_url: otakudesu_url, // [cite: 473]
    };
};

/**
 * Mengambil navigasi episode (sebelumnya dan selanjutnya).
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {{
 * has_previous_episode: boolean,
 * previous_episode_slug: string | null,
 * has_next_episode: boolean,
 * next_episode_slug: string | null
 * }}
 */
const getNavigation = ($) => {
    // Menggunakan selector title yang lebih stabil daripada :first atau :last
    const prevEl = $('.flir a[title="Episode Sebelumnya"]');
    const nextEl = $('.flir a[title="Episode Selanjutnya"]');

    // Helper untuk mengekstrak slug dari href
    const getSlug = (el) => {
        const href = el.attr('href');
        // Pastikan linknya adalah link episode
        if (!href || !href.includes('/episode/')) return null;
        // Ambil bagian slug setelah '/episode/'
        return href.split('/episode/')[1]?.replace('/', '');
    };

    const prevSlug = getSlug(prevEl);
    const nextSlug = getSlug(nextEl);

    return {
        has_previous_episode: !!prevSlug, // [cite: 418-419]
        previous_episode_slug: prevSlug || null, // [cite: 419]
        has_next_episode: !!nextSlug, // [cite: 417-418]
        next_episode_slug: nextSlug || null, // [cite: 418]
    };
};

/**
 * Mengambil URL stream default dari iframe utama.
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {string | null} URL stream
 */
const getDefaultStream = ($) => {
    return $('#pembed iframe').attr('src') || null; // [cite: 422]
};

/**
 * Mengambil semua mirror stream (kualitas dan data ter-obfuscate).
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {Array<{quality: string, provider: string, data: Object | null}>}
 */
const getStreamMirrors = ($) => {
    const mirrors = [];
    // Loop setiap <ul> (m360p, m480p, m720p)
    $('.mirrorstream ul').each((i, ul) => {
        const quality = $(ul).attr('class')?.replace('m', '').trim(); // e.g., "360p"
        if (!quality) return;

        // Loop setiap <li><a> di dalam <ul>
        $(ul).find('li a').each((j, a) => {
            const provider = $(a).text().trim();
            const dataContent = $(a).attr('data-content');
            let parsedData = null;

            // Dekode data-content (Base64) jika ada
            if (dataContent) {
                try {
                    // [cite: 449]
                    parsedData = JSON.parse(Buffer.from(dataContent, 'base64').toString('utf8'));
                } catch (e) {
                    console.error(`Gagal parse data-content untuk ${provider}: ${e.message}`);
                }
            }

            mirrors.push({
                quality,
                provider,
                data: parsedData, // Ini adalah data JSON: { id, i, q }
            });
        });
    });
    return mirrors;
};

/**
 * Mengambil semua link download (MP4, MKV, dll.).
 * @param {import('cheerio').CheerioAPI} $ - Objek Cheerio
 * @returns {Array<{format_title: string, formats: Array<Object>}>}
 */
const getDownloadLinks = ($) => {
    const downloadGroups = [];
    
    // Loop setiap div.download (biasanya ada 1) [cite: 453]
    $('.download').each((i, el) => {
        const formatTitle = $(el).find('h4').text().trim();
        const formatGroups = [];

        // Loop setiap <ul> (satu untuk MP4, satu untuk MKV) [cite: 455, 462]
        $(el).find('ul').each((j, ul) => {
            // Loop setiap <li> (satu untuk tiap resolusi)
            $(ul).find('li').each((k, li) => {
                const resolution = $(li).find('strong').text().trim(); // "Mp4 360p" [cite: 460, 467]
                const size = $(li).find('i').text().trim(); // "34.8 MB" [cite: 405]
                const providerLinks = [];

                // Loop setiap <a> (link provider)
                $(li).find('a').each((l, a) => {
                    providerLinks.push({
                        provider: $(a).text().trim(), // [cite: 459, 466]
                        url: $(a).attr('href'), // [cite: 459, 466]
                    });
                });

                if (providerLinks.length > 0) {
                    formatGroups.push({
                        resolution,
                        size,
                        links: providerLinks, // [cite: 460, 467]
                    });
                }
            });
        });

        downloadGroups.push({
            format_title: formatTitle,
            formats: formatGroups,
        });
    });

    return downloadGroups;
};


/**
 * Fungsi utama untuk scrape halaman episode.
 * Dibuat ulang menjadi sinkron (synchronous) karena tidak lagi
 * melakukan resolving stream di sisi server.
 * @param {string} html - Konten HTML halaman episode
 * @returns {Object | undefined}
 */
const scrapeEpisode = (html) => {
    const $ = load(html);

    const episodeTitle = getEpisodeTitle($); // [cite: 414]
    // Jika tidak ada judul, anggap halaman tidak valid
    if (!episodeTitle) return undefined; // [cite: 416]

    const animeData = getAnimeData($); // [cite: 415]
    const navigation = getNavigation($);
    const defaultStream = getDefaultStream($);
    const streamMirrors = getStreamMirrors($);
    const downloadData = getDownloadLinks($); // [cite: 414]

    return {
        episode: episodeTitle, // [cite: 417]
        anime: animeData, // [cite: 417]
        ...navigation, // Menggabungkan: has_previous_episode, previous_episode_slug, ... [cite: 417-419]
        stream_url: defaultStream, // URL stream default 
        streamList: streamMirrors, // Daftar semua mirror (FIX TYPO dari 'steramList') 
        download_urls: downloadData, // Daftar semua link download 
    };
};

export default scrapeEpisode;
