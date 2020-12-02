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
			results = await crawl(search, () => {res.redirect(`/api?search=${search}`)});
			
		} else {
			res.json(results)
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
		.get(`https://dawaai.pk/search/index?search=${search}`)
		.then(async function (response) {
			const $ = cheerio.load(response.data);
			const links = [];
			$('.card').each((i, el) => {
				const a = $(el).find('a').attr('href');

				links.push(a);
			});

			links.map(async (link) => {
				await axios.get(link)
					.then( async (response) => {
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

						const image = $('.image').eq(8).attr('src');
				
						await Medicine.create({
							title: title,
							formula: formula,
							price: price,
							company: company,
							image: image,
						});
					
					})
			});
			console.log('Crawl Finished');
		})
		.catch(function (error) {
			// handle error
			console.log(error);
		})
		.then( async function () {
			// always executed
			cb();
		});
};

module.exports = app;