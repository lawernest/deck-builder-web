const url = require('url');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/card.db');
const router = express.Router();

// If the user has logged in, then it will redirect to the user profile page. Otherwise, redirect to the login page.
router.get("/", function(req, res) {
	if(req.session.user && req.session.loggedin)
		return res.redirect(`/user/${req.session.user}`);
	res.redirect('/');
});

// Display the profile of the user with a list of decks that were created by the user
router.get("/:username", function(req, res) {
	let username = req.session.user;
	// if the user is not logged in or it is not the user's profile page, then redirect back to the home page
	if(!req.session.loggedin || username !== req.params.username)
		return res.redirect('/');
	
	// get all the decks that are created by the user from the database
	let select_decks_sql = 'SELECT id,name FROM decks WHERE creator = ?';
	db.all(select_decks_sql, [username], function(err, rows) {
		try {
			if(err) throw err;
			res.render('user', {username: username, decks: rows});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

module.exports = router;