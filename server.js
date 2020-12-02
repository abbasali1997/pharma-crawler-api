/* eslint-disable no-unused-vars */
const server = require("./app");
const port = process.env.PORT || 3001;
const { connect } = require("./config/mongoose.config");

server.listen(port, async () => {
	await connect();
	console.log('We are live on ' + port);
})

module.exports = server;