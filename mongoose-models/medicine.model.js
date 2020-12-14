const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema({
    title: {
        type: String,
		unique: true,
		index: true,
        default: null
    },
    price: {
        type: String,
        default: null
    },
    formula: {
        type: String,
        default: null
    },
    company: {
        type: String,
        default: null
    },
	type: {
		type: String,
		default: null
    },
	image: {
		type: String,
		default: null
    },
    site: {
        type: String,
        default: null
    }
})

const Medicine = mongoose.model("Medicine", medicineSchema);

module.exports = Medicine;