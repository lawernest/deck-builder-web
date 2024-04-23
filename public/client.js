let prev_selected_rowID = '';
let selected_rowID = '';

// this function will display the correct drop-down list based on the selected options
function selectCardType() {
	let selected_card_type = document.getElementById('card_type_select_box').value;
	let selected_card_type_lc = selected_card_type.toLowerCase();
	
	let monster_select_box = document.getElementById('monster_type_select_box');
	let spell_select_box = document.getElementById('spell_type_select_box');
	let trap_select_box = document.getElementById('trap_type_select_box');
	let monster_sub_select_box = document.getElementById('monster_subtype_select_box');
	
	if(selected_card_type_lc === 'monster') {
		monster_select_box.hidden = false;
		spell_select_box.hidden = true;
		trap_select_box.hidden = true;
		monster_sub_select_box.hidden = false;
		
		spell_select_box.selectedIndex = 0;
		trap_select_box.selectedIndex = 0;
	} else if(selected_card_type_lc === 'spell') {
		monster_select_box.hidden = true;
		spell_select_box.hidden = false;
		trap_select_box.hidden = true;
		monster_sub_select_box.hidden = true;
		
		monster_select_box.selectedIndex = 0;
		trap_select_box.selectedIndex = 0;
		monster_sub_select_box.selectedIndex = 0;
	} else if(selected_card_type_lc === 'trap') {
		monster_select_box.hidden = true;
		spell_select_box.hidden = true;
		trap_select_box.hidden = false;
		monster_sub_select_box.hidden = true;
		
		monster_select_box.selectedIndex = 0;
		spell_select_box.selectedIndex = 0;
		monster_sub_select_box.selectedIndex = 0;
	} else {
		monster_select_box.hidden = true;
		spell_select_box.hidden = true;
		trap_select_box.hidden = true;
		monster_sub_select_box.hidden = true;
		
		monster_select_box.selectedIndex = 0;
		spell_select_box.selectedIndex = 0;
		trap_select_box.selectedIndex = 0;
		monster_sub_select_box.selectedIndex = 0;
	}
}

// this function makes the 'add to deck' button visible when the user selects a row
function showHiddenRowElements() {
	if(prev_selected_rowID !== '') {
		let prev_row_html = document.getElementById(prev_selected_rowID);
		if(prev_row_html.lastElementChild.lastElementChild)
			prev_row_html.lastElementChild.lastElementChild.style.visibility = "hidden";
		
		let prev_rowID_value = prev_selected_rowID.split('_')[1];
		let prev_card_info = document.getElementById('card_' + prev_rowID_value);
		if(prev_card_info)
			prev_card_info.hidden = true;
	}
	
	selected_rowID = event.currentTarget.id;
	let row_html = document.getElementById(selected_rowID);
	if(row_html.lastElementChild.lastElementChild)
		row_html.lastElementChild.lastElementChild.style.visibility = "visible";
	prev_selected_rowID = selected_rowID;
	
	let rowID_value = selected_rowID.split('_')[1];	
	let curr_card_info = document.getElementById('card_' + rowID_value);
	if(curr_card_info)
		curr_card_info.hidden = false;
}

// this function hides all 'add to deck' buttons when the page is loaded
function hideAddButtonsOnLoad() {
	let card_table = document.getElementById('card_list');
	
	for(let i = 1; i < card_table.rows.length; i++) {
		card_table.rows[i].lastElementChild.lastElementChild.style.visibility = 'hidden';
	}
}

// this function will send the deck id that the user wants to add to the favourite list to the server
function addToFavouriteList() {
	let current_url = window.location.href;
	let deck_id = current_url.substring(current_url.lastIndexOf('/') + 1);
	
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(this.readyState === 4 && this.status === 200) {
			document.getElementById('add_favourite_button').hidden = true;
			document.getElementById('remove_favourite_button').hidden = false;
		}
	};

	xhr.open("POST", "/deck/favourite");
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify({'action': 'add', 'id': deck_id}));
}

// this function will send the deck id that the user wants to remove from the favourite list to the server
function removeFromFavouriteList() {
	let current_url = window.location.href;
	let deck_id = current_url.substring(current_url.lastIndexOf('/') + 1);
	
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(this.readyState === 4 && this.status === 200) {
			document.getElementById('add_favourite_button').hidden = false;
			document.getElementById('remove_favourite_button').hidden = true;
		}
	};

	xhr.open("POST", "/deck/favourite");
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify({'action': 'remove', 'id': deck_id}));
}

// this function will get all the deck data and send it to the server
function saveDeck() {
	let user_table_html = document.getElementById('user_deck_list');
	let user_table_rows = user_table_html.rows;
	let deck_data = {};
	let user_deck = [];
	deck_data.name = document.getElementById('deck_name').value;
	deck_data.publicity = document.getElementById('public_deck').checked;

	for(let i = 1; i < user_table_rows.length; i++) {
		let card_name = user_table_rows[i].firstChild.textContent;
		let quantity = parseInt(user_table_rows[i].childNodes[2].textContent);
		user_deck.push({name: card_name, value: quantity});
	}
	
	let current_url = window.location.href;
	let deck_id = parseInt(current_url.substring(current_url.lastIndexOf('/') + 1));
	let request_path = "/deck/build";
	if(!isNaN(deck_id)) {
		request_path += "/" + deck_id;
		deck_data.id = deck_id;
	}	
	
	deck_data.deck_content = user_deck;	
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(this.readyState === 4) {
			if(this.status === 201) {
				let response = JSON.parse(this.responseText);
				window.location.replace(current_url + '/' + response.id);
				alert(JSON.parse(this.responseText).message);
			} else if(this.status === 200) {
				alert(JSON.parse(this.responseText).message);
			} else if(this.status === 400) {
				alert(JSON.parse(this.responseText).message);
			}
		}
	};

	xhr.open("POST", request_path);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify({'deck_data': deck_data}));
}

// add the selected card to the player deck when the Add to deck button is clicked
function addCardToDeck() {
	let row_html = document.getElementById(selected_rowID);
	let card_name = row_html.firstChild.textContent;
	let card_type = row_html.childNodes[1].textContent;
	let card_quantity = getCardQuantity(card_name);
	
	if(card_quantity >= 3)
		return;
	
	let user_table = document.getElementById('user_deck_list').getElementsByTagName('tbody')[0];
	if(card_quantity > 0) {
		let card_html = getCardHTMLFromTable(user_table, card_name);
		card_html.childNodes[2].textContent = card_quantity + 1;
	} else {
		let removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.id = card_name.toLowerCase();
		removeBtn.textContent = '-';
		removeBtn.onclick = removeFromDeck;
		
		let newRow = user_table.insertRow();
		let nameCell = newRow.insertCell();
		let typeCell = newRow.insertCell();
		let quantityCell = newRow.insertCell();
		let removeBtnCell = newRow.insertCell();
		
		newRow.className = 'card_row';
		nameCell.appendChild(document.createTextNode(card_name));
		typeCell.appendChild(document.createTextNode(card_type));
		quantityCell.appendChild(document.createTextNode('1'));
		removeBtnCell.appendChild(removeBtn);
	}
	
	updateCardCounter(1);
}

// this function will remove a card from the deck and update the html elements
function removeFromDeck() {
	let btnID = event.currentTarget.id;
	let user_table = document.getElementById('user_deck_list').getElementsByTagName('tbody')[0];
	let card_html = getCardHTMLFromTable(user_table, btnID);
	let card_qty = card_html.childNodes[2];
	card_qty.textContent = parseInt(card_qty.textContent) - 1;
	if(card_qty.textContent === '0')
		user_table.deleteRow(card_html.rowIndex-1);
	
	updateCardCounter(-1);
}

// this function will send the selection filter to server and get the matched cards
function searchCards() {
	let selection_filter = {
		card_name: document.getElementById('card_search_box').value,
		card_type: document.getElementById('card_type_select_box').value,
		monster_type: document.getElementById('monster_type_select_box').value,
		spell_type: document.getElementById('spell_type_select_box').value,
		trap_type: document.getElementById('trap_type_select_box').value,
		monster_subtype: document.getElementById('monster_subtype_select_box').value
	};
	
	// format the query params
	let query_url = '?name=' + selection_filter.card_name;
	if(selection_filter.card_type.toLowerCase() !== 'all')
		query_url += '&ctype=' + selection_filter.card_type;	
	if(selection_filter.monster_type.toLowerCase() !== 'all')
		query_url += '&mtype=' + selection_filter.monster_type;
	if(selection_filter.spell_type.toLowerCase() !== 'all') 
		query_url += '&stype=' + selection_filter.spell_type;
	if(selection_filter.trap_type.toLowerCase() !== 'all')
		query_url += '&ttype=' + selection_filter.trap_type;
	if(selection_filter.monster_subtype.toLowerCase() !== 'all')
		query_url += '&mtype2=' + selection_filter.monster_subtype;
	
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(this.readyState === 4 && this.status === 200) {
			// update the card list
			let card_table = document.getElementById('card_list');
			let cards = JSON.parse(this.responseText).cards;
			updateCardTable(card_table, cards);
		}
	};

	xhr.open("GET", "/card" + query_url);
	xhr.send();
}

// this function will update the card counter based on the given value
function updateCardCounter(value) {
	let card_counter = document.getElementById('total_card_qty');
	card_counter.removeAttribute('readonly');
	card_counter.value = parseInt(card_counter.value) + value;
	card_counter.setAttribute('readonly', true);
}

// helper function that updates the card tables with the given cards
function updateCardTable(card_table, cards) {
	let card_table_tbody = card_table.getElementsByTagName('tbody')[0];
	let card_info_div = document.getElementById('card_info_area');
	
	clearCardInfoDiv();
	let new_tbody = document.createElement('tbody');
	for(let i = 0; i < cards.length; i++) {
		let newRow = new_tbody.insertRow();
		newRow.className = 'card_row';
		newRow.id = 'row_' + i;
		generateCardRow(newRow, cards[i]);
		
		let newDiv = document.createElement('div');
		newDiv.className = 'card_info_container';
		newDiv.id = 'card_' + i;
		generateCardInfoDiv(newDiv, cards[i]);
		card_info_div.appendChild(newDiv);
		newDiv.hidden = true;
	}
	card_table.replaceChild(new_tbody, card_table_tbody);
	prev_selected_rowID = '';
	selected_rowID = '';
}

// helper function that clear the child nodes of the 'card_info_area' div
function clearCardInfoDiv() {
	let card_info_div = document.getElementById('card_info_area');
	while(card_info_div.firstChild) {
		card_info_div.removeChild(card_info_div.lastChild);
	}
}

// helper function that generates a new card_info div
function generateCardInfoDiv(newDiv, card) {
	let p_name = document.createElement('p');
	p_name.appendChild(document.createTextNode('Name: ' + card.name));
	newDiv.appendChild(p_name);
	
	let p_card_type = document.createElement('p');
	p_card_type.appendChild(document.createTextNode('Card Type: ' + card.card_type));
	newDiv.appendChild(p_card_type);
	
	if(card.monster_type) {
		let p_monster_type = document.createElement('p');
		p_monster_type.appendChild(document.createTextNode('Monster Type: ' + card.monster_type));
		newDiv.appendChild(p_monster_type);
	}
	
	if(card.attribute) {
		let p_attribute = document.createElement('p');
		p_attribute.appendChild(document.createTextNode('Attribute: ' + card.attribute));
		newDiv.appendChild(p_attribute);
	}
	
	if(card.level) {
		let p_level = document.createElement('p');
		p_level.appendChild(document.createTextNode('Level: ' + card.level));
		newDiv.appendChild(p_level);
	}
	
	let p_description = document.createElement('p');
	p_description.appendChild(document.createTextNode('Description: ' + card.description));
	newDiv.appendChild(p_description);
	
	if(card.monster_type) {
		let p_attack = document.createElement('p');
		p_attack.appendChild(document.createTextNode('Attack: ' + card.attack));
		newDiv.appendChild(p_attack);
	}
	
	if(card.monster_type) {
		let p_defense = document.createElement('p');
		p_defense.appendChild(document.createTextNode('Defense: ' + card.defense));
		newDiv.appendChild(p_defense);
	}
}

// helper function that generates a new card row
function generateCardRow(newRow, card) {
	let addBtn = document.createElement('button');
	addBtn.type = 'button';
	addBtn.textContent = 'Add to deck';
	addBtn.onclick = addCardToDeck;

	let nameCell = newRow.insertCell();
	let typeCell = newRow.insertCell();
	let addBtnCell = newRow.insertCell();
	newRow.onclick = showHiddenRowElements;
	nameCell.appendChild(document.createTextNode(card.name));
	typeCell.appendChild(document.createTextNode(card.card_type));
	addBtnCell.appendChild(addBtn);
	
	addBtn.style.visibility = 'hidden';
}

// helper function that get the table row that contains the given card name from the given table
function getCardHTMLFromTable(table, card_name) {
	for(let i = 0; i < table.rows.length; i++) {
		let contained_card_name = table.rows[i].firstChild.textContent;
		if(card_name.toLowerCase() === contained_card_name.toLowerCase()) {
			return table.rows[i];
		}
	}
	return null;
}

// helper function that is used to find the quantity of the card, when the "Add to deck" button is pressed
function getCardQuantity(card_name) {
	let user_table = document.getElementById('user_deck_list');	
	for(let i = 0; i < user_table.rows.length; i++) {
		let contained_card_name = user_table.rows[i].firstChild.textContent;
		if(card_name.toLowerCase() === contained_card_name.toLowerCase()) {
			return parseInt(user_table.rows[i].childNodes[2].textContent);
		}
	}
	return 0;
}