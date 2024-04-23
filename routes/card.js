const url = require('url');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/card.db');
const router = express.Router();

// get the requested card data from the database and send to the client
router.get('/', function(req, res) {	
	let card_name = req.query.name.trim();
	let select_card_sql = 'SELECT cards.name,cards.description,cards.type card_type,monsters.type monster_type, monsters.attribute, monsters.level, monsters.attack, monsters.defense FROM cards LEFT JOIN monsters ON cards.name = monsters.name';

	// generate a search condition for the select sql statement based on the given query params
	if(card_name)
		select_card_sql += " WHERE cards.name LIKE '%" + card_name + "%'";
	
	if(!card_name && req.query.ctype)
		select_card_sql += " WHERE cards.type LIKE '%" + req.query.ctype + "'";
	else if(req.query.ctype)
		select_card_sql += " AND cards.type LIKE '%" + req.query.ctype + "'";
	
	if(req.query.mtype)
		select_card_sql += " AND cards.type LIKE '" + req.query.mtype + "%'";
	if(req.query.mtype2)
		select_card_sql += " AND monsters.type LIKE '" + req.query.mtype2 + "'";
	if(req.query.stype)
		select_card_sql += " AND cards.type LIKE '" + req.query.stype + "%'";
	if(req.query.ttype)
		select_card_sql += " AND cards.type LIKE '" + req.query.ttype + "%'";
	
	select_card_sql += ' ORDER By cards.name';	
	db.all(select_card_sql, [], function(err, rows) {
		try {
			if(err) throw err;
			res.status(200).json({'cards': rows});
		} catch(e) {
			res.status(500).send("500 Internal Server Error");
		}
	});
});

module.exports = router;