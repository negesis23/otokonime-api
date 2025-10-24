import axios from 'axios';
import { load } from 'cheerio';
const BASEURL = process.env.BASEURL || 'https://otakudesu.best';
const jadwalRilis = async () => {
    const { data } = await axios.get(`${BASEURL}/jadwal-rilis`);
    const $ = load(data);
    const result = {};
    $('.kgjdwl321').each((_, element) => {
        const day = $(element).find('h2').text();
        const animeList = [];
        $(element).find('ul li a').each((_, el) => {
            animeList.push($(el).text());
        });
        result[day] = animeList;
    });
    return result;
};
export default jadwalRilis;
