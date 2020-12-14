const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const app = express();

const Medicine = require('./mongoose-models/medicine.model');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/api', async (req, res) => {
	const { search } = req.query;
	let results = [];
	if (search) {
		const regex = new RegExp(escapeRegex(search), 'gi');
		results = await Medicine.find({ $or: [{ title: regex }, { formula: regex }] });

		if (!results || !results.length) {
			crawl(search, (resultArr) => { res.json(resultArr) });
		} else {
			res.json(results);
		}
	} else {
		res.json({});
	}
});

const escapeRegex = (text) => {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const crawl = async (search, cb) => {
	axios
		.get(`https://dvago.pk/search?type=product&q=${search}`)
		.then(response => {
			const $ = cheerio.load(response.data);
			const links = [];
			$('.productgrid--items .productitem--image-link').each((i, el) => {
				const a = $(el).attr('href');
				links.push(`https://dvago.pk/${a}`);
			});
			return links;
		})
		.then(links => links.map(link => {
			return axios.get(link)
				.then(response => {
					const $ = cheerio.load(response.data);

					const title = $('.product-title').text().replace(/\s\s+/g, ' ');

					let type = '';
					if (title.toLowerCase().includes('mg') || title.toLowerCase().includes('table')) {
						type = 'Tablets';
					} else if (title.toLowerCase().includes('ml') || title.toLowerCase().includes('liquid')) {
						type = 'Liquid';
					} else if (title.toLowerCase().includes('sachet')) {
						type = 'Sachet';
					} else {
						type = 'Others';
					}

					const formula = $('.tit a span').eq(0).text();

					const price = $('.money').eq(1).text().replace(/\s\s+/g, ' ');

					const company = $('.product-vendor a').text();

					const image = $('.product-gallery--image img').attr('src');

					const obj = {
						title: title,
						formula: formula,
						price: price,
						company: company,
						type: type,
						image: image,
						site: 'https://dvago.pk/'
					};
					return obj;
				})
				.then(object => {
					//console.log(object);
					return Medicine.create(object);
				})

		}))
		.then(promises => Promise.all(promises))
		.then(dvagoProds => {
			axios
				.get(`https://dawaai.pk/search/index?search=${search}`)
				.then(response => {
					const $ = cheerio.load(response.data);
					const links = [];
					const types = [];
					const images = [];
					$('.card').each((i, el) => {
						const a = $(el).find('a').attr('href');
						const t = $(el).find('.meta span').eq(0).text();
						const im = $(el).find('.image img').attr('src');
						types.push(t);
						links.push(a);
						images.push(im);
					});
					const object = {
						types,
						links,
						images
					}
					return object;
				})
				.then(object => object.links.map((link, i) => {
					return axios.get(link)
						.then(response => {
							const $ = cheerio.load(response.data);

							const title = $('.product-details h1').text().replace(/\s\s+/g, ' ');

							const formula = $('.product-details .composition-clas a').text();

							const price = $('.drug-price-box h2')
								.clone() //clone the element
								.children() //select all the children
								.remove() //remove all the children
								.end() //again go back to selected element
								.text()
								.replace(/\s\s+/g, ' ');

							const company = $('.product-details .brand-name a').text();

							const image = object.images[i];

							const type = object.types[i];

							const obj = {
								title: title,
								formula: formula,
								price: price,
								company: company,
								type: type,
								image: image,
								site: 'https://dawaai.pk/'
							};
							return obj;
						})
						.then(object => {
							//console.log(object);
							return Medicine.create(object);
						})

				}))
				.then(promises => Promise.all(promises))
				.then( dawaiiProds => {
					const products = [...dvagoProds, ...dawaiiProds];
					console.log(products);
					console.log('crawl finished');
					cb(products);
				})
		})
		.catch(error => {
			// handle error
			console.log(error);
		});
};

module.exports = app;