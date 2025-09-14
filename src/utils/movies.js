import { load } from 'cheerio';
import axios from 'axios';
import fs from 'fs';
import pagination from '../lib/pagination.js';
const ANOBOY = process.env.ANOBOY || 'https://v8.kuramanime.tel/';
const movies = async (page = 1) => {
    console.log(`${ANOBOY}quick/movie?order_by=latest&page=${page}`);
    const { data } = await axios.get(`${ANOBOY}quick/movie?order_by=latest&page=${page}`,
        {headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },}
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


