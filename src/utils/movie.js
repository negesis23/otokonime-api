import { load } from 'cheerio';
import fs from 'fs';
import axios from 'axios';
const ANOBOY = process.env.ANOBOY || 'https://v8.kuramanime.tel';
const movie = async (slug) => {
    console.log(`${ANOBOY}/anime${slug}`);
    const { data } = await axios.get(`${ANOBOY}/anime${slug}`,{
        headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "accept-encoding": "gzip, deflate, br, zstd",
            "accept-language": "en-US,en;q=0.7",
            "cookie": "sel_timezone_v2=Asia/Bangkok; auto_timezone_v2=yes; full_timezone_v2=+07; short_timezone_v2=+07; preferred_stserver=kuramadrive; should_do_galak=hide; XSRF-TOKEN=eyJpdiI6IlhBYlJkMXRsNkJISEx1Unc2aTRtT3c9PSIsInZhbHVlIjoiam9NRjdNUlhRUjVTUzIwbysyaFdGQTRteklJeE9OTVkxVzNBaGFJL2RwWnRPTVRxMUNYdWZSdFZIdkl5N0RwenYzUjh4QnFMNFhaUEd6L0NDYyt4eUlndnBNYmY5Umx3RXg2Y251NlVvcGVNYklTRGlZTnBKLzV6OWVxc1dpVVAiLCJtYWMiOiI0ZjM1OGFjY2E5ZTA1YWM5Y2I1MDI3ZTZhODM5NzUzMjBiMjVmNzYxNmM5Y2JhN2IwN2I5Yzc1ZjNiYWQyMmYyIiwidGFnIjoiIn0%3D; kuramanime_session=eyJpdiI6IktJOUZtbUo1NTJ6eGt4UTM5WjBHOEE9PSIsInZhbHVlIjoiSTdld3BNYjByYjVUY0JkcHl0Ukc5TnF0c09nZTgvcEhqcmtNYk15UVcyZlFHYlQ2R2tMcHNDcll5ZkVzMmZEWXdwc01CWnc1RVJRaFRTdy8rNEN3N3pDTmtnbzRQTDQ4YzVYT0lXVW00d0hlVWtPUk1WNGZacXBlcmN1N2FYKzMiLCJtYWMiOiI4MTJmYzQ1YzUzYjFmNDdhNDZmNzJjMjViM2Y1NGJkNmIyOWEyMmY4ZGViMGM5YTQ4Mzc0NjEwNDJlMGYwMGI0IiwidGFnIjoiIn0%3D",
            "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Brave\";v=\"140\"",
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": "\"Android\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "sec-gpc": "1",
            "upgrade-insecure-requests": "1",
            "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
            "referer": "https://v8.kuramanime.tel/"
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


