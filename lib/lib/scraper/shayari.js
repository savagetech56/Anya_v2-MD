const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches Shayari based on the given type.
 *
 * @param {string} [type=false] - The category type of Shayari to fetch. 
 *                               Valid options are: 'hindi-jokes', 'sad', 'love', 'pyar', 'dosti', 'dard'.
 *                               If no type is provided, an error message will be returned.
 * @returns {Promise<Object>} - A Promise that resolves to an object with the following keys:
 *                              - `status` {boolean}: Indicates the success of the operation.
 *                              - `creator` {string}: Identifier of the function's author.
 *                              - `message` {string}: Error message or success message.
 *                              - `page` {number}: The randomly selected page number (if successful).
 *                              - `total` {number}: The total number of Shayari entries on the page (if successful).
 *                              - `data` {Array<Object>}: An array of Shayari objects containing:
 *                                - `title` {string}: Title of the Shayari.
 *                                - `lines` {string}: The content of the Shayari.
 * @throws {Error} - If an error occurs during the request or data parsing.
 * creator: @PikaBotz
 * 🤌🏻 Please give me credits if you're using it
 */
async function shayariByTypes(type = false) {
    const _v = ['hindi-jokes', 'sad', 'love', 'pyar', 'dosti', 'dard'];
    const url = 'https://shayari.net';
    if (!type) return { status: false, creator: '@PikaBotz', message: `Choose a type: ${_v.join('/')}` };
    if (!_v.includes(type)) return { status: false, creator: '@PikaBotz', message: `Invalid type provided. Choose one of the following: ${_v.join('/')}` };
    try {
        const { data } = await axios.get(`${url}/${type}`);
        const $ = cheerio.load(data);
        const __p = [];
        $('ul.page-numbers li a.page-numbers').each((index, element) => {
            const __p2 = parseInt($(element).text().trim());
            if (!isNaN(__p2)) {
                __p.push(__p2);
            }
        });
        const max = Math.max(...__p);
        if (isNaN(max)) return { status: false, creator: '@PikaBotz', message: 'Invalid Page Data' };
        const random = Math.floor(Math.random() * (max + 1));
        const randomUrl = `${url}/${type}/page/${random}/`;
        const { data: r } = await axios.get(randomUrl);
        const rc = cheerio.load(r);
        const list = [];
        rc('.article').each((index, element) => {
            const title = rc(element).find('h4.st').text().trim();
            const lines = rc(element)
                .find('div.shair p')
                .map((i, p) => rc(p).text().trim())
                .get()
                .join('\n');
            if (title && lines) {
                list.push({ title, lines });
            }
        });
        if (list.length < 1) return { status: false, creator: '@PikaBotz', message: 'No results found!' }
        else return {
            status: true,
            creator: '@PikaBotz',
            page: random,
            total: list.length,
            data: list
        };
    } catch (error) {
        console.error('Error fetching page data:', error);
        return { status: false, creator: '@PikaBotz', message: error.message };
    }
}

module.exports = { shayariByTypes }
