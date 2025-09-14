import { load } from 'cheerio';
import fs from 'fs';
import axios from 'axios';
const ANOBOY = process.env.ANOBOY || 'https://v8.kuramanime.tel';
const movie = async (slug) => {
    console.log(`${ANOBOY}/anime${slug}`);
    const { data } = await axios.get(`${ANOBOY}/anime${slug}`,{
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    });
    const $ = load(data);
    const movie = {};
    movie.title = $('.anime__details__title h3').text().toLowerCase().split('sub')[0];
    movie.poster = $('.anime__details__pic.set-bg').attr('data-setbg');
    movie.sinopsi = $('#synopsisField').text().trim();
    //https://www.sankavollerei.com/anime/kura/watch/3138/dandadan/1
    const animex = await axios.get(`https://www.sankavollerei.com/anime/kura/watch${slug}/1`,{
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Referer': 'https://www.google.com/',
            'Connection': 'keep-alive',
        }
    });
    movie.download_urls = animex.data.video;
    movie.stream_url = animex.data.video;

    return movie;
};
export default movie;

