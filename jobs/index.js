/**
 * = background job that is scheduled to run 100x each hour after app launch
 * = this runs on express app lauch
 * = checks if database exists and creates if negative 
 * = populates the database with stores & customer data
 * = create methods to fetch and organise data from TOMTOM
 * = save it on the database
 * = generate images and fake reviews with AI ( bottleneck of 50 requests per hour )
 * = 
 * = create multiple files project @initialization
 */

const cron = require('node-cron');
const {
    createApi
} = require('unsplash-js');
const randomPhoneNumber = require('random-mobile');
require('dotenv').config();

const TOMTOM_KEY = process.env.TOMTOM_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

const SearchAPI = async (query = 'Coffee', options = {
    limit: 100,
    ofs: 0,
    countrySet: '',
    lat: '',
    long: ''
}) => {
    options = new URLSearchParams(options).toString();
    const url = `https://api.tomtom.com/search/2/poiSearch/${query}.json?key=${TOMTOM_KEY}&${options}`;
    try {
        const response = await fetch(url);
        if (response.status === 404) {
            throw new Error('Page not found');
        } else if (response.status === 500) {
            throw new Error('Server error');
        } else if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const iterations = data.summary.numResults;

        let init = 0;
        let results = [];
        while (init < iterations) {
            let answer = data.results[init];
            const item = {
                id: answer.id,
                name: answer.poi.name,
                location: {
                    lat: answer.position.lat,
                    lon: answer.position.lon
                },
                categories: answer.poi.categories,
                contact: answer.poi.url || answer.poi.phone || '+' + randomPhoneNumber({
                    formatted: true
                }),
            }
            results.push(item);
            init++
        }

        return results;
    } catch (error) {
        console.error(error);
    }
}

class Unsplash {
    constructor(accessKey){
        this.unsplash = createApi({
            accessKey: UNSPLASH_KEY
        })
    }
    generateImage = async (prompt, options = {
        page: 1,
        perPage: 3,
        color: undefined,
        orientation: 'landscape'
              }) => {
            if(prompt === undefined || prompt === '')return;
            const unsplash = createApi({
                accessKey: UNSPLASH_KEY
            });
    let reply = await unsplash.search.getPhotos({
        query: prompt,
        ...options
    });
    let photos = [];
        switch (reply.type) {
            case 'error':
                console.log('error occurred: ', reply.errors[0]);
            case 'success':
                reply.response.results.forEach((photo, index) => {
                photos[index] = {
                    width: photo.width,
                    height: photo.height,
                    alt: photo.alt_description,
                    url: photo.urls.regular }
                })
            return photos;
        }
    }
}

SearchAPI('Pizza and Tacos', {limit:3}).then(res => {
})

// const populateStores = cron.schedule("*/5 * * * * *", function(time){
//     console.log('runs at %s', time)
// }, {
//     scheduled: false
// })