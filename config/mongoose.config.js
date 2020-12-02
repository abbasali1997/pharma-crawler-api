const mongoose = require('mongoose');

const connect = async function () {
	return mongoose.connect("mongodb+srv://se-project:projectpass@pharma-crawler.sobbn.mongodb.net/<dbname>?retryWrites=true&w=majority", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	});
}

module.exports = {
	connect
}