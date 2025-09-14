import { load } from 'cheerio';
import axios from 'axios';
import fs from 'fs';
import pagination from '../lib/pagination.js';
const ANOBOY = process.env.ANOBOY || 'https://v8.kuramanime.tel/';
const movies = async (page = 1) => {
    console.log(`${ANOBOY}quick/movie?order_by=latest&page=${page}`);
    const { data } = await axios.get(`${ANOBOY}quick/movie?order_by=latest&page=${page}`,
        {headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
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
        }}
    );
    let $ = load(data);
    fs.writeFileSync('anime.html', data, 'utf8');
    const movies = [];
    $('div[class="col-lg-4 col-md-6 col-sm-6"]').each((index, element) => {
        const $ = load(element);
        const animex = $('a').first().attr('href')?.replace(ANOBOY, '').split('/');
        console.log(animex)
        movies.push({
            title: $('h5 a').text().trim(),
            code: animex[1],
            slug: animex[2],
            poster: $('.product__item__pic.set-bg').attr('data-setbg'),
            otakudesu_url: $('a').first().attr('href')
        });
    });
    
    return {
        movies,
        pagination: pagination($('div.product__pagination').toString(), true)
    }
};
export default movies;


