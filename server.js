// Server Setup
const express = require('express');
const session = require('express-session');
const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

// Serve static resources from public, if they exist
app.use(express.static("public"));
app.use(express.json()); // recognize request as json
app.use(express.urlencoded({extended: true})); // recognize request as string
app.use(session({secret: 'COMP3005 secret', resave:false, saveUninitialized: false}));

const PORT = process.env.PORT || 3000; // define the port

//read routes modules
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const deckRouter = require('./routes/deck');
const cardRouter = require('./routes/card');

app.use('/user', userRouter);
app.use('/deck', deckRouter);
app.use('/card', cardRouter);
app.use('/', indexRouter);

// send a 404 response when the user enters an invalid URL
app.get('/*', function(req, res) {
	res.status(404).send("404. Page Not Found");
});

//start server
app.listen(PORT, (err) => {
	if(err) {
		console.log(err);
		return;
	}
	else {
		console.log("Server listening at http://localhost:" + PORT);
	}
});