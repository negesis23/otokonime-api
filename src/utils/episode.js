import axios from 'axios';
import episodes from './episodes.js';
import scrapeEpisode from '../lib/scrapeEpisode.js';
const BASEURL = process.env.BASEURL   || 'https://otakudesu.best';
const episode = async ({ episodeSlug, animeSlug, episodeNumber }) => {
    let slug = '';
    console.log(episodeSlug, animeSlug, episodeNumber);
    if (episodeSlug)
        slug = episodeSlug;
    if (animeSlug) {
        const episodeLists = await episodes(animeSlug);
        if (!episodeLists)
            return undefined;
        const clean = episodeLists.map(ep => {
            const match = ep.episode.match(/Episode\s+(\d+)/i);
            const num = match ? match[1] : null;

            return {
              ...ep,
              episode: num
            };
        });
        const firstEps = parseInt(clean[0].episode);
        episodeLists.forEach((ep, index) => {
            if (ep.episode.includes(`Episode ${episodeNumber}`)) {
                slug = ep.slug;
            }
        });
        slug = firstEps == 0 ? episodeLists[episodeNumber].slug : slug;
        console.log(slug);
    }
    const { data } = await axios.get(`${BASEURL}/episode/${slug}`);
    const result = await scrapeEpisode(data);
    return result;
};
export default episode;
