import axios from 'axios';
import scrapesearchresult from '../lib/scrapeSearchResult.js';
const BASEURL = process.env.BASEURL   || 'https://otakudesu.best';
const search = async (keyword) => {
    const response = await axios.post(`${BASEURL}/`,`s=${keyword}&post_type=anime`,{
        headers: {
          "Accept": "*/*",
          "Accept-Encoding": "deflate, gzip",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
          "Host": "otakudesu.best"
        }
    });
    const html = response.data;
    const searchResult = scrapesearchresult(html);
    return searchResult;
};
export default search;


