const url = require('url');
const express = require('express');
const db = require('../data/db');
const router = express.Router();

// display the home page to the user
router.get('/', function(req, res) {
	// if the user has already logged in, then redirect to the user page
	if(req.session.loggedin)
		return res.redirect(`/user/${req.session.user}`);
	res.render('index', {error_message: ''});
});

// redirect the user to the profile page when the user logs in or create a new account and redirect to the profile for register
router.post('/', function(req, res) {
	const action = req.body.form_button;
	const username = req.body.name_field.trim();
	const password = req.body.password_field;
	
	// if one of the input fields is empty, return a error message
	if(username === '' || password === '')
		return res.render('index', {error_message: 'Please enter your username/password'});
	
	// check does the user exist and did the user provide correct login information
	let select_user_sql = 'SELECT username FROM users WHERE username = ? AND password = ?';
	db.get(select_user_sql, [username, password], (err, row) => {
		try {
			if(err) throw err;
			
			// redirect to the profile page if the user has provided correct login information
			if(action === 'login') {
				if(!row)
					return res.render('index', {error_message: 'Incorrect username/password. Please try again.'});
				
				req.session.loggedin = true;
				req.session.user = row.username;
				res.redirect(`/user/${username}`);
			}
			// redirect to the profile page if the user has provided a valid username for registration
			else if(action === 'register') {
				if(row)
					return res.render('index', {error_message: 'The username has already been taken'});
				
				let insert_user_sql = 'INSERT INTO users VALUES(?,?)';
				db.run(insert_user_sql, [username, password], function(err) {
					try {
						if(err) throw err;
						
						req.session.loggedin = true;
						req.session.user = username;
						res.redirect(`/user/${username}`);
					} catch(e) {
						res.render('index', {error_message: 'The username has already been taken'});
					}
				});
			}
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

router.get('/logout', function(req, res) {
	req.session.loggedin = false;
	res.redirect('/');
});

module.exports = router;