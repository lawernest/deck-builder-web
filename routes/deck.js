const url = require('url');
const express = require('express');
const db = require('../data/db');
const router = express.Router();

// the min/max values for the deck size
const maxDeckSize = 60;
const minDeckSize = 40;

router.param('deckID', function(req, res, next, value) {
	let select_sql = 'SELECT * FROM decks WHERE id = ?';
	db.get(select_sql, [value], function(err, row) {
		try {
			if(err) throw err;
			
			// if the deck doesn't exists or the deck is privated, redirect to the deck list page
			if(!row || (row.publicity === 0 && row.creator !== req.session.user))
				return res.redirect('/deck');
			
			req.deck = row;
			next();
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// List all the public decks to the user, expects the decks that are created by the user.
router.get('/', function(req, res) {
	if(!req.session.loggedin)
		return res.redirect('/');
	
	let select_sql = 'SELECT id,name,creator FROM decks WHERE publicity = ? AND creator != ?';
	// if search query exists, add additional serach conditions to the sql statement
	if(req.query.keyword) {
		let search_keyword = req.query.keyword.trim();
		if(req.query.type === 'deck') {
			select_sql += " AND name LIKE '%" + search_keyword + "%'";
		} else if(req.query.type === 'user') {
			select_sql += " AND creator LIKE '%" + search_keyword + "%'";
		}
	}
	
	// get all the public decks from the database and show to the user
	db.all(select_sql, [1, req.session.user], function(err, rows) {
		try {
			if(err) throw err;
			res.render('deck_list', {title: 'Public Decks', req_path: '/deck', deck_list: rows});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// Display the deck with the associated deck ID
router.get('/view/:deckID', function(req, res) {
	if(!req.session.loggedin)
		return res.redirect('/');
	
	let select_contains_sql = 'SELECT contains.deck_id,contains.card_name,cards.description,cards.type card_type, monsters.type monster_type, monsters.attribute, monsters.level, monsters.attack, monsters.defense,contains.value FROM contains LEFT JOIN cards ON contains.card_name = cards.name LEFT JOIN monsters ON cards.name = monsters.name WHERE contains.deck_id = ?';
	let deck_id = req.deck.id;
	db.all(select_contains_sql, [deck_id], function(err, rows) {
		try {
			if(err) throw err;

			// render the edit deck page if deck belongs to the user
			if(req.deck.creator === req.session.user)
				return res.redirect('/deck/build/' + deck_id);
			
			let username = req.session.user;
			let deck = rows;
			deck.name = req.deck.name;
			
			let select_favourite_sql = 'SELECT * FROM favourites WHERE username = ? AND deck_id = ?';
			db.get(select_favourite_sql, [username, deck_id], function(err, row) {
				try {
					if(err) throw err;
					
					let isFavourited = row ? true : false;
					let deckSize = getDeckSize(deck);
					res.render('view_deck.pug', {deck: deck, deckSize: deckSize, isFavourited: isFavourited});
				} catch(e) {
					res.status(500).send("500 Internal Server Error");
				}
			});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// Display a list of decks that are favourited by the user
router.get('/favourite', function(req, res) {
	if(!req.session.loggedin)
		return res.redirect('/');
	
	let select_favourite_sql = 'SELECT decks.id,decks.name,decks.creator FROM decks INNER JOIN favourites ON decks.id = favourites.deck_id WHERE favourites.username = ? AND decks.publicity = ?';
	
	// if search query exists, add additional condition to the sql statement
	if(req.query.keyword) {
		let search_keyword = req.query.keyword.trim();
		if(req.query.type === 'deck') {
			select_favourite_sql += " AND decks.name LIKE '%" + search_keyword + "%' ORDER BY decks.name";
		} else if(req.query.type === 'user') {
			select_favourite_sql += " AND decks.creator LIKE '%" + search_keyword + "%' ORDER BY decks.creator";
		}
	}
	
	db.all(select_favourite_sql, [req.session.user, 1], function(err, rows) {
		try {
			if(err) throw err;
			res.render('deck_list', {title: "Favourite Decks", req_path: '/deck/favourite', deck_list: rows});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// Display the build deck page for new deck
router.get('/build', function(req, res) {	
	if(!req.session.loggedin)
		return res.redirect('/');
	
	let select_card_sql = 'SELECT cards.name,cards.description,cards.type card_type,monsters.type monster_type, monsters.attribute, monsters.level, monsters.attack, monsters.defense FROM cards LEFT JOIN monsters ON cards.name = monsters.name ORDER BY cards.name';
	db.all(select_card_sql, [], (err, rows) => {
		try {
			if(err) throw err;
			res.render('deck_builder', {card_list: rows});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// Display the build deck page for existing deck
router.get('/build/:deckID', function(req, res) {	
	if(!req.session.loggedin) {
		return res.redirect('/');
	}
	
	// if the accessing user is not the deck owner, then redirect back to the deck list page
	if(req.deck.creator !== req.session.user)
		return res.redirect('/deck');
	
	let select_card_sql = 'SELECT cards.name,cards.description,cards.type card_type,monsters.type monster_type, monsters.attribute, monsters.level, monsters.attack, monsters.defense FROM cards LEFT JOIN monsters ON cards.name = monsters.name ORDER BY cards.name';;
	db.all(select_card_sql, [], (err, rows) => {
		try {
			if(err) throw err;
			
			let cards = rows;
			let select_sql = 'SELECT contains.card_name,cards.type,contains.value FROM contains INNER JOIN cards ON contains.card_name = cards.name WHERE contains.deck_id = ? ORDER BY card_name';
			db.all(select_sql, [req.deck.id], function(err, rows) {
				try {
					if(err) throw err;
					let deckSize = getDeckSize(rows);
					res.render('deck_builder', {deck_info: req.deck, deck: rows, deckSize: deckSize, card_list: cards});
				} catch(e) {
					res.status(500).send("500 Internal Server Error");
				}
			});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// Add/remove the deck to/from the user's favourite list
router.post('/favourite', function(req, res) {
	let username = req.session.user;
	let deck_id = req.body.id;
	let action = req.body.action;
	let favourite_sql = '';
	
	if(action.toLowerCase() === 'add')
		favourite_sql = 'INSERT INTO favourites VALUES(?,?)';
	else if(action.toLowerCase() === 'remove')
		favourite_sql = 'DELETE FROM favourites WHERE username = ? AND deck_id = ?';

	db.run(favourite_sql, [username, deck_id], function(err) {
		try {
			if(err) throw err;
			res.status(200).send();
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// create and save the new deck into the database
router.post('/build', function(req, res) {
	let creator = req.session.user;
	let deck_name = req.body.deck_data.name;
	let user_deck = req.body.deck_data.deck_content;
	let deckSize = getDeckSize(user_deck);
	let deck_publicity = req.body.deck_data.publicity;
	
	if(deck_name.trim() === '')
		return res.status(400).json({'message': 'Please enter a deck name'});

	// if the deck size is invalid, then reject the request
	if(deckSize < minDeckSize || deckSize > maxDeckSize)
		return res.status(400).json({'message': 'Your deck must have 40-60 cards'});
	
	// add the deck to the database
	let insert_deck_sql = 'INSERT INTO decks VALUES(?,?,?,?)';
	db.run(insert_deck_sql, [null, deck_name, deck_publicity, creator], function(err) {
		try {
			if(err) throw err;
		
			let deck_id = this.lastID;
			let select_deck_sql = 'SELECT id FROM decks WHERE rowid = ?';
			db.get(select_deck_sql, [deck_id], function(err, row) {
				try {
					if(err) throw err;
					
					// create a sql statement to insert into the containss table
					let insert_contain_sql = 'INSERT INTO contains VALUES(?,?,?)';
					for(let i = 1; i < user_deck.length; i++)
						insert_contain_sql += ',(?,?,?)';
					
					// add the deck id to the user deck
					for(let i = 0; i < user_deck.length; i++)
						user_deck[i].id = row.id;
					
					// format the deck data into a single array
					let deck_values = flattenArray(user_deck);
					db.run(insert_contain_sql, deck_values, function(err) {
						try {
							if(err) throw err;
							res.status(201).json({'id': deck_id,'message': 'Saved'});
						} catch(e) {
							res.status(500).send("500 Internal Server Error");
						}
					});
				} catch(e) {
					res.status(500).send("500 Internal Server Error");
				}
			});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// display the deck based on the deck id to the user, and allow them to modify the deck
router.post('/build/:deckID', function(req, res) {	
	let deck_data = req.body.deck_data;
	let user_deck = deck_data.deck_content;
	let deckSize = getDeckSize(user_deck);
	
	if(deck_data.name.trim() === '')
		return res.status(400).json({'message': 'Please enter a deck name'});
	
	// if the deck size is invalid, then reject the request
	if(deckSize < minDeckSize || deckSize > maxDeckSize)
		return res.status(400).json({'message': 'Your deck must have 40-60 cards'});
	
	// update the deck info
	let update_deck_sql = 'UPDATE decks SET name = ?, publicity = ? WHERE id = ?';
	db.run(update_deck_sql, [deck_data.name, deck_data.publicity, deck_data.id], function(err) {
		try {
			if(err) throw err;
			
			let delete_card_sql = 'DELETE FROM contains WHERE deck_id = ?';
			db.run(delete_card_sql, [deck_data.id], function(err) {
				try {
					if(err) throw err;
					
					// create a sql statement to insert into the containss table
					let insert_contain_sql = 'INSERT INTO contains VALUES(?,?,?)';
					for(let i = 1; i < user_deck.length; i++)
						insert_contain_sql += ',(?,?,?)';
					
					// add the deck id to the user deck
					for(let i = 0; i < user_deck.length; i++)
						user_deck[i].id = deck_data.id;
					
					let deck_values = flattenArray(user_deck);
					db.run(insert_contain_sql, deck_values, function(err) {
						try {
							if(err) throw err;
							res.status(200).json({'message': 'Saved'});
						} catch(e) {
							res.status(500).send("500 Internal Server Error");
						}
					});
				} catch(e) {
					res.status(500).send("500 Internal Server Error");
				}
			});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

// helper function to re-organize the object values and flatten it into a single array
function flattenArray(array) {
	let newArray = array.map(obj => [obj.id, obj.name, obj.value]);
	return newArray.flat();
}

// helper function to get the deck size
function getDeckSize(deck) {
	let total = 0;
	for(let i = 0; i < deck.length; i++) {
		total += deck[i].value;
	}
	return total;
}

module.exports = router;