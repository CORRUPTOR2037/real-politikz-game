var game;

var player;

var turn = 0;

// Overwrite an array with numbers from one to the array's length in a random order.
Array.prototype.randomize = function(length) {
	length = (length || this.length);
	var num;
	var indexArray = [];

	for (var i = 0; i < length; i++)
		indexArray[i] = i;

	for (var i = 0; i < length; i++) {
		// Generate random number between 0 and indexArray.length - 1.
		num = Math.floor(Math.random() * indexArray.length);
		this[i] = indexArray[num] + 1;

		indexArray.splice(num, 1);
	}
};

function wrapMoney(amount) {
    return moneySign[0] + amount + moneySign[1];
}

Math.range = function(min, max){
	return Math.floor(Math.random() * (max - min)) + min;
}

function sort_deck(array) {
	array.index = 0;
	array.deck = [];
	for (var i = 0; i < array.length; i++) array.deck[i] = i;
	array.deck.sort(function() {return Math.random() - 0.5;});
}


// Game Panels

function GameLog() {
	this.log = $("#game-log");
	
	this.add = function(alertText, playerInfo, color){
		playerInfo = playerInfo ? '<div class="party-icon ' + playerInfo.style + '"></div>' : "";
		color = (color && color != 0) ? (' class="' + (color > 0 ? "gain" : "loss") + '"') : "";

		alertText = "<span" + color + ">" + alertText + "</span>";
		$(document.createElement("div")).html(playerInfo + alertText).appendTo(this.log);

		// Animate scrolling down alert element.
		this.scrollTop();
	
		if (!player[turn].human) {
			player[turn].AI.alertList += "<div>" + alertText + "</div>";
		}
	}
	this.scrollTop = function(){
		this.log.stop().animate({"scrollTop": this.log.prop("scrollHeight")}, 1000);
	}
}
var gameLog = new GameLog();

function Alert() {
	this.popup = $("#popup");
	this.text = $("#popup-text");

	this.showAccept = function(HTML, action) {
		this.text.html(HTML);
		this.text.append("<div><button id='popupclose'>" + getString("OK") + "</button></div>");
		
		$("#popupclose").on("click", this.fadeOut).on('click', action).focus();
		this.fadeIn();
	}
	this.showConfirm = function(HTML, action) {
		this.text.html(HTML);
		this.text.append("<div><button id='popupyes'>" + getString("yes") + "</button><button id='popupno'>" + getString("no") + "</button></div>");
	
		$("#popup-yes, #popup-no").off("click").on("click", this.fadeOut);
	
		$("#popup-yes").on("click", action);
		this.fadeIn();
	}
	this.showInput = function(HTML, action) {
		this.text.html(HTML);
		this.text.append("<div><input id='popup-input'/><button id='popup-accept'>" + getString("OK") + "</button><button id='popup-pass'>" + getString("pass") + "</button></div>");
		
		$("#popup-accept").on("click", this.fadeOut).on('click', function(){
			action($('#popup-input').val());
		}).focus();
		$("#popup-pass").on("click", this.fadeOut).on('click', function(){
			action();
		}).focus();
		this.fadeIn();
	}
	this.showRoll = function(HTML, action) {
		var dice = game.rollDice();
		this.text.html(
			'<span style="display: block">' + getString("you-rolled").replace("%value", dice) + "</span>" + 
			'<img id="dieAlert" title="Die" class="die die-no-img"></div>' + HTML +
			"<div><button id='popupclose'>" + getString("OK") + "</button></div>"
		);
		updateDice($('#dieAlert'), dice);
		
		$("#popupclose").on("click", this.fadeOut).on('click', () => action(dice)).focus();
		this.fadeIn();
	}
	this.showChoose = function(HTML, buttons, actions) {
		this.text.html(HTML);
		
		HTML = "";
		for (var i = 0; i < buttons.length; i++){
			HTML += "<button id='popup-" + buttons[i] + "'>" + getString(buttons[i]) + "</button>";
		}
		this.text.append("<div>" + HTML + "</div>");
	
		for (var i = 0; i < buttons.length; i++){
			let j = i;
			$("#popup-" + buttons[i]).off("click").on("click", this.fadeOut).on('click', function() {
				if (Array.isArray(actions)) actions[j]();
                else actions(j);
			});
		}
	
		this.fadeIn();
	}
	this.fadeIn = function(){
		$("#popupbackground").fadeIn(400, function() {
			$("#popupwrap").show();
		});
	}
	this.fadeOut = function(){
		$("#popupwrap").hide();
		$("#popupbackground").fadeOut(400);
	}
}
var browserAlert = alert;
var alert = new Alert();


// 'enlarge' for mouse, 'control-enlarge' for center panel
function setEnlarge(square, enlargeID){
	var list = ["enlarge"]; square.classList.forEach(function(i){ list.push(i); });
	if (list[2] != "board-corner") {
        list[2] = "board-bottom";
    }
	$("#" + enlargeID)
			.removeClass()
			.addClass(list.join(' '))
			.html(square.innerHTML)
			.show();
	$("#" + enlargeID + " .chip-dock").remove();
}



function Buttons() {
    this.rollDices = $("#roll-dices");
	this.endTurn = $("#end-turn");
	this.buy = $("#buy-menu-item");
	this.manage = $("#manage-menu-item");
	
	this.lastButtonsConfig = [];
	this.update = function(items) {
		this.lastButtonsConfig = items;
		Array.from($("#menu .menu-item")).forEach(function(i){
			i.classList.add("hidden");
		});
		
		this.rollDices.hide();
		this.endTurn.hide();
		
		if (items != undefined && items.length > 0) {
			items.forEach(function(i){
				$("#menu #" + i + "-menu-item").removeClass("hidden");
			});
			if (items.includes('roll-dices')) this.rollDices.show();
			if (items.includes('end-turn')) this.endTurn.show();
		}
	}
	this.performEndTurn = function(){
		this.update();
		this.rollDices.hide();
		this.endTurn.show();
	}
	this.performRoll = function(){
		this.update();
		this.rollDices.show();
		this.endTurn.hide();
	}
	this.savedButtons = [];
	this.saveButtons = function(){
		this.savedButtons = this.lastButtonsConfiguration;
	}
	this.loadButtons = function(){
		this.update(this.savedButtons);
	}
}
var buttons = new Buttons();



function LandedPanel() {
    this.object = $("#landed");
	
	this.show = function(text){
		this.object.html(text);
		this.object.show();
	};
	this.hide = function(){
		this.object.hide();
	}
}
var landedPanel = new LandedPanel();



function Stats() {
    this.show = function(){
		var HTML, sq, p;
		var mortgagetext,
		housetext;
		var write;
		HTML = "<table align='center'><tr>";
	
		for (var x = 1; x < player.length; x++) {
			write = false;
			p = player[x];
			if (x == 5) {
				HTML += "</tr><tr>";
			}
			// Player name
			HTML += "<td class='statscell' id='statscell'><div class='statsplayername'>" +
					    '<div class="party-icon ' + p.style + '"></div>' +
						'<span class="p-name" >' + p.name + '</span></div>';
	
			// Player money
			HTML += "<span class='statscellheader icon money-icon left'></span><span class='statscellheader'>" + getString('money-header') + ": " + wrapMoney(p.money) + "</span>";
			
			// Rating info
			HTML += "<span class='statscellheader icon people-icon left'></span><span class='statscellheader'>" +
				getString('people-rating-header') + ": " + p.peopleRating + "/" + p.maxPeopleRating() + "</span>";
			HTML += "<span class='statscellheader icon assembly-icon left'></span><span class='statscellheader'>" +
				getString('assembly-rating-header') + ": " + p.assemblyRating + "/" + p.maxAssemblyRating() + "</span>";
			
			// Lobby info
			HTML += "<span class='statscellheader'>" + getString('lobby-header') + "</span><ul class='stats-lobby-rating'>";
			Object.keys(p.lobby).forEach(function(key) {
				HTML += "<li>" + getString('lobby-type-' + key) + ": " + p.lobby[key] + " " + getString("points") + "</li>";
			});
			HTML += "</ul>";
			
			Object.keys(p.stats).forEach(function(key) {
				HTML += "<span class='statscellheader'>" + getString('stats-' + key) + ": " + p.stats[key] + "</span>";
			});
	
			HTML += "</td>";
		}
		HTML += "</tr></table><div id='titledeed'></div>";
	
		document.getElementById("statstext").innerHTML = HTML;
		// Show using animation.
		$("#statsbackground").fadeIn(400, function() {
			$("#statswrap").show();
		});
	}
	$("#viewstats").on("click", this.show);
	$("#statsclose").on("click", function() {
		$("#statswrap").hide();
		$("#statsbackground").fadeOut(400);
	});
}
var stats = new Stats();



function LobbyScreen() {
    this.object = $("#lobbyscreen");
	
	this.usedOnThisTurn = [];
	this.show = function(){
		var currentPlayer = player[turn];
		var rows = $("#lobbyscreen tr");
		for (var j = 1; j < rows.length-1; j++) {
			var cells = rows[j].getElementsByTagName("td");
			for(var i = 0; i < cells.length; i++){
				cells[i].classList.remove('selected');
				cells[i].removeAttribute('onclick');
				var key = lobbyTypes[j-1].name;
				if (currentPlayer.lobby[key] == i) {
                    cells[i].classList.add('selected');
					if (!this.usedOnThisTurn.includes(key)) {
						cells[i].onclick = function(){
							var target = event.target.getAttribute('name');
							alert.showRoll(getString("lobby-you-need-roll").replace("%value", currentPlayer.party.lobbyRollBarrier), function(value){
								lobbyScreen.usedOnThisTurn.push(target);
								currentPlayer.setLobbyRating(target, currentPlayer.lobby[target] + currentPlayer.party.lobbyAddition(value));
								lobbyScreen.show();
							});
						};
					} else {
						cells[i].classList.add('used');
					}
                }
			}
		}
		$("#popupbackground").fadeIn(400, function() {
			$("#lobbyscreen").show();
		});
	};
	this.hide = function(){
		$("#lobbyscreen").hide();
		$("#popupbackground").fadeOut(400);
	};
	
	var HTML = "<tr>";
	for (var j = 0; j < lobbyProgressLength; j++) {
		HTML += '<th><span>' + j + '</span></th>';
	}
	HTML += "</tr>";
	for (var i = 0; i < lobbyTypes.length; i++) {
        HTML += "<tr>";
		for (var j = 0; j < lobbyProgressLength; j++) {
			var cl = lobbyTypes[i].name;
			if (j % lobbyLevelLength == lobbyLevelLength - 1) {
				cl += " last";
			}
            HTML += '<td name="' + lobbyTypes[i].name + '"><div class="' + cl + '"></div></td>';
		}
		HTML += '<td><span class="lobby-title">' + getString("lobby-type-" + lobbyTypes[i].name) + '</span></td>'
		HTML += "</tr>";
    }
	HTML += "<tr>";
	for (var j = 0, i = 0; j < lobbyProgressLength; j += lobbyLevelLength, i++) {
		HTML += '<td colspan=' + lobbyLevelLength + '>';
		HTML += '<span class="level-description positive">' + getString('lobby-level-descriptionPos-' + i) + '</span>';
		HTML += '<span class="level-description negative">' + getString('lobby-level-descriptionNeg-' + i) + '</span>';
		HTML += '</td>';
	}
	HTML += "</tr>";
	this.object.find("table").html(HTML);
	
	let self = this;
	$("#lobbyclose").on("click", function() {
		self.hide();
	});
}
var lobbyScreen = new LobbyScreen();
/*
 *
 * UPDATE MAP
 *
 */

function updatePosition() {
	p = player[turn];
	square[p.position].cell.getElementsByClassName("chip-dock")[0].appendChild(p.chip);
	setEnlarge(square[p.position].cell, "control-enlarge");
}

function updateMoney() {
	var currentPlayer = player[turn];

	$("#qs-money").html(wrapMoney(currentPlayer.money));
	$("#qs-assembly-rating").html(currentPlayer.assemblyRating);
	$("#qs-people-rating").html(currentPlayer.peopleRating);

	if (currentPlayer.money < 0) {
		buttons.rollDices.hide();
	}
	updateTickets();
}

function updateTickets() {
	var currentPlayer = player[turn];
	var html = "";
	Object.keys(currentPlayer.tickets).forEach(function(key){
		if (currentPlayer.tickets[key] > 0) {
			html += "<a class='card " + key + "' title='" + getString(key + "-title") + "' onclick='useTicket(\"" + key + "\")'></a>";
			html += "<span class='cardcount'>" + currentPlayer.tickets[key] + "</span>";
		} else {
			html += "<span class='card " + key + "' title='" + getString(key + "-title") + "'></span>";
		}
		html += "<br>"
	});
    $("#player-tickets").html(html);
}

function updateDices() {
	updateDice($("#die0"), game.getDie(1));
	updateDice($("#die1"), game.getDie(2));
}

function updateDice(node, value) {
	node.show();

	node.removeClass("die-no-img");
	node.prop('title', getString("dice-title").replace("%value", value));

	node.prop('src', "images/Die_" + value + ".png");
}

function updateOwned() {
	var currentPlayer = player[turn];
	var checkedproperty = getCheckedProperty();

	var count = 0;
	var squareItem;

	for (var i = 0; i < cellsCount; i++) {
		squareItem = square[i];
		if (squareItem.group == undefined) continue;
		if (squareItem.owner == turn) {
            count++;
        }
		
		$("#cell" + i + "owner").attr('class', "cell-owner " + (squareItem.owner > 0 ? player[squareItem.owner].style : "hidden") + (squareItem.forceMove ? " protected" : ""));
		$("#cell" + i + " .cell-spec").attr('class', "cell-spec" + (currentPlayer.party.specialization.includes(squareItem.group) ? " active" : ""));
		
		var array = $("#" + squareItem.cell.id + " .cell-card div");
		for (var j = 0; j < 3; j++) {
			array[j].className = "";
			if (i != currentPlayer.position || buttons.rollDices.is(":visible")) continue;
			if (j < squareItem.state) {
				array[j].className = "bill-state-green";
			} else if (j == squareItem.state && i == player[turn].position) {
				array[j].className = "bill-state-yellow";
            }
        }
		
		var amandments = $("#cell" + i + "amandments");
		if (squareItem.state == 0) {
            amandments.attr('class', 'hidden');
			continue;
        }
		
		var direction = Math.trunc(squareItem.direction * 100) / 100;
		if (direction > 0){
			direction = "+" + direction;
			amandments.attr('class', 'cell-amandments up');
		} else if (direction < 0) {
			amandments.attr('class', 'cell-amandments down');
		} else {
			amandments.attr('class', 'cell-amandments neutral');
		}
		amandments.html("<span class='cell-rating'>" + direction + "</span><br><span class='cell-paper'>" + squareItem.amendments + "</span>");
	}

	setEnlarge(square[p.position].cell, "control-enlarge");
	var accepted = currentPlayer.stats["state1"] + currentPlayer.stats["state2"] + currentPlayer.stats["state3"];
	document.getElementById("owned").innerHTML =
		getString("review-bills-count") + count + " / " + getString("accepted-bills-count") + accepted + " / " + getString("rejected-bills-count") + currentPlayer.stats["rejected"];
}

var selectCellCallback = undefined;
function selectBill(p, criterion, action) {
	var properBills = [];
	for (var i = 0; i < square.length; i++){
		if (square[i].type == 'bill' && criterion(square[i])) {
            properBills.push(square[i]);
        }
	}
	if (p.isAI) {
        sort_deck(properBills);
		action(properBills[properBills.deck[0]]);
    } else {
		for (var i = 0; i < square.length; i++){
			square[i].cell.classList.add('non-selectable');
		}
		for (var i = 0; i < properBills.length; i++){
			properBills[i].cell.classList.remove('non-selectable');
			properBills[i].cell.classList.add('selectable');
		}
		selectCellCallback = action;
		buttons.saveButtons();
		buttons.update(["confirm-selection", "cancel-selection"]);
	}
}
function confirmSelection() {
    for (var i = 0; i < square.length; i++){
		if (square[i].cell.classList.contains('selected')) {
            selectCellCallback(square[i]);
			cancelSelection();
			return;
        }
	}
	alert.showAccept(getString("nothing-selected"), null);
}
function cancelSelection() {
    buttons.loadButtons();
	selectCellCallback = undefined;
	for (var i = 0; i < square.length; i++){
		square[i].cell.classList.remove('non-selectable');
		square[i].cell.classList.remove('selectable');
		square[i].cell.classList.remove('hovered');
		square[i].cell.classList.remove('selected');
	}
}

function getCard() {
	var p = player[turn];
	var s = square[p.position];
	
	var chest;

	// Community Chest
	if (s.type == "com-chest") {
		chest = communityChestCards;
	} else if (s.type == "chance") {
        chest = chanceCards;
    }
	var card = chest[chest.deck[chest.index]];
	chest.index++;

	if (chest.index >= chest.deck.length) {
		chest.index = 0;
	}

	return card;
}

function gotojail() {
	var p = player[turn];
	gameLog.add(p.name + " was sent directly to jail.", p);
	landedPanel.show("You are in jail.");

	p.jail = true;
	game.doublecount = 0;

	buttons.endTurn();

	if (p.human) {
		buttons.rollDices.focus();
	}

	updatePosition();
	updateOwned();

	if (!p.human) {
		alert.showAccept(p.AI.alertList, game.next);
		p.AI.alertList = "";
	}
}

function buyChooseSide(playerIndex, bill, cost) {
	if (!playerIndex) {
        p = player[turn];
		playerIndex = turn;
		bill = square[p.position], 
		cost = bill.price().buy;
    }
	if (!player[playerIndex].AI) {
        alert.showChoose(getString("buy-choose-side-text").replace("%player", p.name).replace("%bill", bill.uiName), bill.sides, function(index){
			buy(playerIndex, bill, cost, 1 - index);
		});
    } else {
		buy(playerIndex, bill, cost, player[playerIndex].party.groupsReaction[bill.style]);
	}
}

function buy(playerIndex, bill, cost, direction) {
	var p = player[playerIndex];

	if (p.money >= cost) {
		p.pay(cost);

		bill.owner = playerIndex;
		bill.direction += direction;
		bill.moveState();
		gameLog.add(getString("buy-message").replace("%player", p.name).replace("%bill", bill.uiName).replace("%price", cost), p, -1);

		updateOwned();

	} else {
		if (!p.AI)
            alert.showAccept(getString("you-need-money").replace("%money", (cost - p.money)));
	}
	nextTurn();
}

function moveBill() {
    var p = player[turn];
	var bill = square[p.position];

	var cost = bill.price().buy;
	if (p.money >= cost) {
		p.pay(cost);
		bill.moveState();
		gameLog.add(getString("move-state-message").replace("%player", p.name).replace("%name", bill.uiName).replace("%price", cost), p, -1);

		updateOwned();

	} else {
		if (!p.AI)
            alert.showAccept(getString("you-need-money").replace("%money", (cost - p.money)));
	}
	nextTurn();
}

function passBuy() {
	var p = player[turn];
	var bill = square[p.position];
	if (bill.state == 0) {
        makeAuction(bill);
    }
	buttons.performEndTurn();
}

function amend() {
	var p = player[turn];
	var bill = square[p.position];
    var cost = bill.price().visit;
	if (p.money >= cost) {
		p.pay(cost);
		bill.amendments++;
		gameLog.add(getString("amended-to").replace("%player", p.name).replace("%place", bill.uiName).replace("%price", cost), p, -1);
		if (p.AI) {
			bill.direction += p.party.groupsReaction[bill.style] * 0.1;
		} else {
			alert.showChoose(getString("amend-choose-side-text"), bill.sides, function(index){
				bill.direction += 0.1 * (1 - index);
			});
		}
		updateOwned();
	} else {
		if (!p.AI)
            alert.showAccept(getString("you-need-money").replace("%money", (cost - p.money)));
	}
	updateOwned();
	this.endTurn.show();
}

function askSay() {
	var bill = square[player[turn].position]; 
	if (bill.state == 0) {
		sayChooseSide(turn, bill);
	}
}

function sayChooseSide(playerIndex, bill) {
	if (!playerIndex) {
		playerIndex = turn;
		bill = square[player[playerIndex]]; 
    }
	var p = player[playerIndex];
	if (!player[playerIndex].AI) {
        alert.showChoose(getString("say-choose-side-text").replace("%player", p.name).replace("%bill", bill.uiName), bill.sides, function(index){
			say(playerIndex, bill, 1 - index);
		});
    } else {
		say(playerIndex, bill, player[playerIndex].party.groupsReaction[bill.style]);
	}
}

function say(playerIndex, bill, direction) {
	var p = player[playerIndex];
	gameLog.add(getString("say-message").replace("%player", p.name).replace("%bill", bill.uiName).replace("%action", getString(bill.sides[1 - direction])), p);
	var ratingAmount = direction * 2;
	p.setPeopleRating(p.peopleRating + ratingAmount);
	if (direction > 0) {
        gameLog.add(getString("increased-people-rating").replace("%player", p.name).replace("%amount", ratingAmount), p);
    } else if (direction < 0) {
		gameLog.add(getString("decreased-people-rating").replace("%player", p.name).replace("%amount", -ratingAmount), p);
	}
	
	updateMoney();	
	nextTurn();
}


function soldSoul() {
    //code
}

/*
 *
 *  ON VISIT EVENTS
 *
 */

function landOnBill(bill, playerIndex) {
	var p = player[playerIndex];
		// Allow player to buy the property on which he landed.
		if (bill.state == 0) {
			if (p.AI) {
				if (p.AI.buyProperty(p.position)) {
					buyChooseSide(playerIndex, bill, bill.price().buy);
				} else {
					say()
				}
				updateOwned();
			} else {
				buttons.update(["buy", "say"]);
			}
			return;
		}
	
		// Collect rent
		if (bill.state > 0){
			if (bill.owner != turn) {
				
				if (p.AI){
					amend();
				} else {
					buttons.update(["amend"]);
				}
			} else {
				if (p.AI){
					moveBill(bill);
				} else {
					buttons.update(['move']);
				}
			}
			return;
		}
}

function takeCard(s, playerIndex) {
	var p = player[playerIndex];
	var prizeCard = getCard();
	prizeCard.randomize(p);
    if (p.human) {
		alert.showAccept(prizeCard.text(),  () => prizeCard.action(p));
	} else {
		prizeCard.action(p);
	}
	buttons.performEndTurn();
}

function lobby(square, playerIndex) {
	var p = player[playerIndex];
	if (p.isAI) {
        p.AI.rollLobby();
		nextTurn();
    } else {
		buttons.update(["lobby", "end-turn"]);
	}
}
function corruptionVisit(square, player) {
    nextTurn();
}
function corruptionTake(square, player) {
    updateMoney();
	updatePosition();

	if (p.human) {
		alert.showAccept("<div>Go to jail. Go directly to Jail. Do not pass GO. Do not collect $200.</div>", goToJail);
	} else {
		gotojail();
	}
}
function meeting(square, player) {
	nextTurn();
}
function vacation(square, player) {
	nextTurn();
}
function scandal(square, player) {
	nextTurn();
}

function useTicket(type) {
	var p = player[turn];
	if (p.tickets[type] <= 0) {
		alert.showAccept(getString("player-dont-have-card"));
        return;
    }
	if (!canPerformAction(p, type)) {
        alert.showAccept(getString(type + "-card-cant-be-used"));
        return;
    }
	updateTickets();
	performAction(p, type);
}

function canPerformAction(p, type) {
    switch (type) {
        case "jailCard": {
			return p.jail;
		} break;
		case "moveBillCard": {
			for (var i = 0; i < square.length; i++) {
                if (player[square[i].owner] == p && square[i].state > 0) return true;
            }
			return false;
		} break;
		case "createBillCard": {
			for (var i = 0; i < square.length; i++) {
                if (square[i].state == 0) return true;
            }
			return false;
		} break;
		case "ownCard": {
			for (var i = 0; i < square.length; i++) {
                if (square[i].state > 0) return true;
            }
		} break;
		case "gotoCard": {
			return !p.jail;
		} break;
    }
}
function performAction(p, type) {
    switch (type) {
        case "jailCard": {
			getOutOfJail();
			afterPerformAction(p, type);
		} break;
		case "moveBillCard": {
			selectBill(p, function(cell){
				return player[cell.owner] == p && cell.state > 0;
			}, function(cell){
				cell.forceMove = true;
				afterPerformAction(p, type);
			});
		} break;
		case "createBillCard": {
			
		} break;
		case "ownCard": {
			
		} break;
		case "gotoCard": {
			
		} break;
    }
}
function afterPerformAction(p, type) {
	gameLog.add(getString("player-used").replace("%player", p.name).replace("%thing", getString(type + "-title")), p);
	p.removeTicket(type);
	updateTickets();
	updateOwned();
}

function getOutOfJail() {
    var currentPlayer = player[turn];
	currentPlayer.jail = false;
	if (currentPlayer.isAI) {
        roll();
    } else {
		buttons.rollDices.show();
	}
}
/*
 *
 * HANDLING TURNS
 *
 */

function land() {
	
	var currentPlayer = player[turn];
	var s = square[p.position];

	var squareName = s.uiName;
	landedPanel.show(getString("you-landed").replace("#name", currentPlayer.name) + " " + squareName + ".");
	gameLog.add(getString("landed-on").replace("%player", currentPlayer.name).replace("%place", squareName), currentPlayer);
	
	updatePosition();

	if (currentPlayer.AI)
		currentPlayer.AI.onLand();
	s.onVisit(s, turn);

	updateMoney();
	updateOwned();
}

function roll() {
	var currentPlayer = player[turn];

	buttons.buy.show();
	buttons.manage.hide();

	if (currentPlayer.human) {
		buttons.rollDices.focus();
	}

	game.rollDices();
	var die1 = game.getDie(1);
	var die2 = game.getDie(2);
	
	gameLog.add(
		getString("rolled").replace("%player", currentPlayer.name).replace("%number", (die1 + die2)) +
		(die1 == die2 ? " - " + getString("doubles") + "." : "."), p
	);

	if (die1 == die2 && !currentPlayer.jail) {
		updateDices();

		if (game.doublecount < 3) {
			buttons.rollDices.attr('value', getString("roll-again"));
			buttons.rollDices.attr('title', getString("threw-doubles-title"));

		// If player rolls doubles three times in a row, send him to jail
		} else if (game.doublecount === 3) {
			currentPlayer.jail = true;
			game.doublecount = 0;
			gameLog.add(getString("rolled-doubles-three-times").replace("%player", p.name));
			updateMoney();

			if (currentPlayer.human) {
				alert.showAccept(getString("go-to-jail-after-doubles"), goToJail);
			} else {
				gotojail();
			}

			return;
		}
	}

	updatePosition();
	updateMoney();
	updateOwned();
	lobbyScreen.usedOnThisTurn = [];

	if (currentPlayer.jail === true) {
		currentPlayer.jailroll++;

		updateDices();
		if (die1 == die2) {
			document.getElementById("jail").style.border = "1px solid black";
			document.getElementById("cell11").style.border = "2px solid " + p.color;
			$("#landed").hide();

			currentPlayer.jail = false;
			currentPlayer.jailroll = 0;
			currentPlayer.position = 10 + die1 + die2;
			doublecount = 0;

			gameLog.add(currentPlayer.name + " rolled doubles to get out of jail.", p);

			land();
		} else {
			if (currentPlayer.jailroll === 3) {

				if (currentPlayer.human) {
					alert.showAccept("<p>You must pay the $50 fine.</p>", function() {
						payFifty();
						payfifty();
						currentPlayer.position=10 + die1 + die2;
						land();
					});
				} else {
					payfifty();
					currentPlayer.position = 10 + die1 + die2;
					land();
				}
			} else {
				$("#landed").show();
				document.getElementById("landed").innerHTML = "You are in jail.";

				if (!currentPlayer.human) {
					alert.showAccept(currentPlayer.AI.alertList, game.next);
					currentPlayer.AI.alertList = "";
				}
			}
		}


	} else {
		updateDices();

		// Move player
		currentPlayer.position += die1 + die2;

		// Collect $200 salary as you pass GO
		if (currentPlayer.position >= cellsCount) {
			currentPlayer.position -= cellsCount;
			currentPlayer.money += startPayment - currentPlayer.party.partyFee;
			gameLog.add(getString("new-session-pay").replace("%player", currentPlayer.name).replace("%amount", wrapMoney(startPayment)), p, 1);
			gameLog.add(getString("party-fee-pay").replace("%player", currentPlayer.name).replace("%amount", wrapMoney(currentPlayer.party.partyFee)), p, -1);
		}

		land();
	}
}

function nextTurn() {
	var currentPlayer = player[turn];
	if (currentPlayer.AI){
		if (currentPlayer.money < 0) {
			currentPlayer.AI.payDebt();
	
			if (currentPlayer.money < 0) {
				popup("<p>" + p.name + " is bankrupt. All of its assets will be turned over to " + player[p.creditor].name + ".</p>", game.bankruptcy);
			} else {
				roll();
			}
		} else if (game.shouldEndTurn()) {
			play();
		} else {
			roll();
		}
	} else {
		if (game.shouldEndTurn()) {
			buttons.performEndTurn();
		} else {
			buttons.performRoll();
		}
	}
}

function openLobby() {
	buttons.performEndTurn();
	lobbyScreen.show();
}

function play() {
	turn++;
	if (turn >= player.length) {
		turn = 1;
	}

	var currentPlayer = player[turn];
	if (currentPlayer.missMove > 0) {
        currentPlayer.missMove--;
		if (!currentPlayer.isAI) {
            alert.showAccept(getString("miss-move"), play);
        } else {
			play();
		}
		return;
    }
	game.resetDice();

	gameLog.add(getString("it-is-turn").replace("%player", currentPlayer.name), currentPlayer);

	// Check for bankruptcy.
	currentPlayer.pay(0);

	$("#landed, #option, #manage").hide();
	$("#board, #control, #moneybar, #viewstats, #buy").show();

	$("#die0").hide();
	$("#die1").hide();

	if (currentPlayer.jail) {
		$("#landed").show();
		document.getElementById("landed").innerHTML = "You are in jail.<input type='button' title='Pay $50 fine to get out of jail immediately.' value='Pay $50 fine' onclick='payfifty();' />";

		if (currentPlayer.communityChestJailCard || p.chanceJailCard) {
			document.getElementById("landed").innerHTML += "<input type='button' id='gojfbutton' title='Use &quot;Get Out of Jail Free&quot; card.' onclick='useJailCard();' value='Use Card' />";
		}

		document.getElementById("roll-dices").title = "Roll the dice. If you throw doubles, you will get out of jail.";

		if (currentPlayer.jailroll === 0)
			gameLog.add("This is " + currentPlayer.name + "'s first turn in jail.");
		else if (currentPlayer.jailroll === 1)
			gameLog.add("This is " + currentPlayer.name + "'s second turn in jail.");
		else if (currentPlayer.jailroll === 2) {
			document.getElementById("landed").innerHTML += "<div>NOTE: If you do not throw doubles after this roll, you <i>must</i> pay the $50 fine.</div>";
			gameLog.add("This is " + currentPlayer.name + "'s third turn in jail.");
		}

		if (currentPlayer.AI && currentPlayer.AI.postBail()) {
			if (currentPlayer.communityChestJailCard || currentPlayer.chanceJailCard) {
				useJailCard();
			} else {
				payfifty();
			}
		}
	}
	
	$(".moneybarcell").removeClass("selected");
	$("#moneybarrow" + turn + " .moneybarcell").addClass("selected");

	buttons.update();
	buttons.endTurn.hide();
	buttons.rollDices.show();
	updateMoney();
	updatePosition();
	updateOwned();

	if (currentPlayer.AI) {
		if (!currentPlayer.AI.beforeTurn()) {
			roll();
		}
	}
}

function cellInner(point, id){
	var content =
	    '<div class="cell-inner">' +
			'<div class="chip-dock"></div>';
	if (point.constructor.name == 'Bill') {
        content +=
			'<div class="cell-top-panel">' +
				'<div class="cell-owner hidden" id="cell' + id + 'owner"></div>' +
				'<div class="cell-amandments" id="cell' + id + 'amandments"></div>' +
			'</div>' +
			'<div class="cell-card">' +
			   '<span class="cell-cat">' + getString(point.group.name) + '</span>' +
		       '<span class="cell-name">' + getString(point.name) + '</span>' +
		       '<div><span class="cell-goal">' + getString('first-goal') + '</span><span class="cell-money">' + point.prices[0].buy + '/' + point.prices[0].visit + '</span></div>' +
		       '<div><span class="cell-goal">' + getString('second-goal') + '</span><span class="cell-money">' + point.prices[1].buy + '/' + point.prices[1].visit + '</span></div>' +
		       '<div><span class="cell-goal">' + getString('third-goal') + '</span><span class="cell-money">' + point.prices[2].buy + '/' + point.prices[2].visit + '</span></div>' +
			   '<div class="cell-spec"></div>' +
		   '</div>';
	}
	content +=
		'</div>';
	return content;
}

function setup() {
	game = new GameState();
	
	// Initialize players
	var pc = parseInt(document.getElementById("playernumber").value, 10);
	player = [ undefined ];

	for (var i = 1; i <= pc; i++) {
		var name  = document.getElementById("player" + i + "name").value,
		    party = players[document.getElementById("player" + i + "color").value],
			type  = document.getElementById("player" + i + "ai").value == 1;
		
		player.push(new Player(name, party, type));
		player[i].index = i;
	}

	// Switch panels
	$("#board, #moneybar").show();
	$("#setup").hide();

	
	// Shuffle decks
	sort_deck(chanceCards);
	sort_deck(communityChestCards);
	

	/*var enlargeWrap = document.body.appendChild(document.createElement("div"));

	enlargeWrap.id = "enlarge-wrap";

	var HTML = "";
	for (var i = 0; i < 40; i++) {
		HTML += "<div id='enlarge" + i + "' class='enlarge'>";
		HTML += "<div id='enlarge" + i + "color' class='enlarge-color'></div><br /><div id='enlarge" + i + "name' class='enlarge-name'></div>";
		HTML += "<br /><div id='enlarge" + i + "price' class='enlarge-price'></div>";
		HTML += "<br /><div id='enlarge" + i + "token' class='enlarge-token'></div></div>";
	}

	enlargeWrap.innerHTML = HTML;
	*/
	
	for (var i = 0; i < square.length; i++) {
		var point = square[i];
		switch (point.type) {
			case 'bill': point.onVisit = landOnBill; break;
            case 'com-chest': point.onVisit = takeCard; break;
			case 'lobby': point.onVisit = lobby; break;
			case 'chance': point.onVisit = takeCard; break;
			case 'jail': point.onVisit = corruptionVisit; break;
			case 'scandal': point.onVisit = corruptionTake; break;
			case 'meeting': point.onVisit = meeting; break;
			case 'vacation': point.onVisit = vacation; break;
			case 'new-session': point.onVisit = nextTurn; break;
			default: console.log("error: unknown cell at " + i + ", " + point.type); break;
        }

    }
	
	var board = document.createElement("table"), tr;
	    
	// Top
	tr = document.createElement("tr");
	/// Vacation
	var cell = $("<td>", { class: "board-side-field", id: "vacation-side" });
	cell.appendTo(tr);
	for (var i = 0, j; i < squareSize[0]; i++) {
		j = squareSize[0] + squareSize[1] + i - 2;
		var point = square[j];
		cell = document.createElement("td");
		switch (i) {
            case 0:
			case squareSize[0] - 1:
				cell.className = "cell board-corner " + point.style;
				cell.id = point.style;
				break;
			default:
				cell.className = "cell board-top " + point.style;
				cell.id = "cell" + j;
				break;
        }
		cell.innerHTML = cellInner(point, j);
		tr.appendChild(cell);
		point.cell = cell;
	}
	cell = $("<td>", { class: "cell side-field", rowspan: squareSize[1] });
	cell.appendTo(tr);
	board.appendChild(tr);
	
	// Sides
	for (var i = 0; i < squareSize[1] - 2; i++) {
		tr = document.createElement("tr");
		var i1 = squareSize[0] + squareSize[1] - i - 3, i2 = 2 * squareSize[0] + squareSize[1] - 2 + i;
		var point1 = square[i1],
			point2 = square[i2];
		var cell1 = document.createElement("td"),
		    cell2 = document.createElement("td");
		cell1.className = "cell board-left " + point1.style;
		cell1.id = "cell" + i1;
		cell1.innerHTML = cellInner(point1, i1);
		cell2.className = "cell board-right " + point2.style;
		cell2.id = "cell" + i2;
		cell2.innerHTML = cellInner(point2, i2);
		if (i == 0) 
            tr.innerHTML += '<td rowspan="' + (squareSize[1] - 2) + '" class="board-side-field"></td>';
		tr.appendChild(cell1);
		point1.cell = cell1;
		tr.appendChild($('<td colspan="' + (squareSize[0] - 2) + '" class="board-center"></td>').get(0));
		tr.appendChild(cell2);
		point2.cell = cell2;
		if (i == 0) 
            tr.appendChild($('<td rowspan="' + (squareSize[1] - 2) + '" class="board-side-field"></td>').get(0));
		board.appendChild(tr);
	}
	
	// Bottom
	tr = document.createElement("tr");
	/// Jail
	cell = $("<td>", { class: "board-side-field jail", id: "jail-side" });
	cell.appendTo(tr);
	for (var i = 0; i < squareSize[0]; i++) {
		var j = squareSize[0] - i - 1;
		var point = square[j];
		cell = document.createElement("td"); 
		switch (i) {
            case 0:
			case squareSize[0] - 1:
				cell.className = "cell board-corner " + point.style;
				cell.id = point.style;
				break;
			default:
				cell.className = "cell board-bottom " + point.style;
				cell.id = "cell" + j;
				break;
        }
		cell.innerHTML = cellInner(point, j);
		tr.appendChild(cell);
		point.cell = cell;
	}
	board.appendChild(tr);
	
	
	
	var board_wrap = $('<div id="board"></div>');
	board_wrap.append(board);
	$(".game-window").append(board_wrap);

	/*
	// Add images to enlarges.
	document.getElementById("enlarge0token").innerHTML += '<img src="images/arrow_icon.png" height="40" width="136" alt="" />';
	document.getElementById("enlarge20price").innerHTML += "<img src='images/free_parking_icon.png' height='80' width='72' alt='' style='position: relative; top: -20px;' />";
	document.getElementById("enlarge38token").innerHTML += '<img src="images/tax_icon.png" height="60" width="70" alt="" style="position: relative; top: -20px;" />';
	*/

	// Create event handlers for hovering and draging.

	var drag, dragX, dragY, dragObj, dragTop, dragLeft;

	$(".cell").on("mouseover", function(e){
		if (selectCellCallback == undefined) {
            setEnlarge(this, "enlarge");
        } else {
			if (this.classList.contains("selectable")) {
				this.classList.add("hovered");
            }
		}
		
	}).on("mouseout", function(e) {
		$("#enlarge").hide();
		if (selectCellCallback != undefined) {
			if (this.classList.contains("hovered")) {
				this.classList.remove("hovered");
            }
		}
	}).on("mousemove", function(e) {
		var element = document.getElementById("enlarge");

		if (e.clientY + 20 > window.innerHeight - 204) {
			element.style.top = (window.innerHeight - 204) + "px";
		} else {
			element.style.top = (e.clientY + 20) + "px";
		}

		element.style.left = (e.clientX + 10) + "px";
	}).on("click", function(e){
		if (selectCellCallback != undefined) {
			if (this.classList.contains("selectable")) {
				for (var i = 0; i < square.length; i++) {
                    this.classList.remove("selected");
                }
				this.classList.add("selected");
            }
		}
	});
	
	$("body").on("mousemove", function(e) {
		var object;

		if (e.target) {
			object = e.target;
		} else if (window.event && window.event.srcElement) {
			object = window.event.srcElement;
		}
		if (drag) {
			if (e) {
				dragObj.style.left = (dragLeft + e.clientX - dragX) + "px";
				dragObj.style.top = (dragTop + e.clientY - dragY) + "px";

			} else if (window.event) {
				dragObj.style.left = (dragLeft + window.event.clientX - dragX) + "px";
				dragObj.style.top = (dragTop + window.event.clientY - dragY) + "px";
			}
		}
	});
	$("body").on("mouseup", function() {
		drag = false;
	});
	$('.panel').on('mousedown', function(e) {
		dragObj = this;
		dragObj.style.position = "relative";

		dragTop = parseInt(dragObj.style.top, 10) || 0;
		dragLeft = parseInt(dragObj.style.left, 10) || 0;

		if (window.event) {
			dragX = window.event.clientX;
			dragY = window.event.clientY;
		} else if (e) {
			dragX = e.clientX;
			dragY = e.clientY;
		}

		drag = true;
	});

	buttons.buy.click(function() {
		buttons.buy.show();
		buttons.manage.hide();

		// Scroll alerts to bottom.
		$("#alert").scrollTop($("#alert").prop("scrollHeight"));
	});

	buttons.manage.click(function() {
		buttons.manage.show();
		buttons.buy.hide();
	});


	$("#trade-menu-item").click(game.trade);

	/// Generate stats block
	for (var i = 1; i < player.length; i++) {
		var element = 
			'<tr id="moneybarrow' + i + '" class="money-bar-row">' +
				'<td><div class="party-icon ' + player[i].style + '"></div></td>' +
				'<td class="moneybarcell">' +
					'<div class=""><span class="p-name" >' + player[i].name + '</span></div>' +
				'</td>' +
			'</tr>';
		$("#moneybar table").append(element);
	}
	
	play();
	
}

function setPlayersSelection(count) {
	var setup = document.getElementById("setup");
	
	for (var i = 1; i <= count; i++){
		var player = document.createElement("div");
		player.id = "player-input-" + i;
		player.className = "player-input";
		var html = getString("player") + " " + i + ": ";
		html +=
			    '<input type="text" class="player-name" id="player' + i + 'name" title="Player name" maxlength="20" value="Player ' + i + '" />\n' + 
				'<select class="select-player" data-usesprite="russian-parties" onchange="updateSelection(this);" id="player' + i + 'color" title="Player color" style="width:250px">\n';
		for (var j = 0; j < players.length; j++){
			var p = players[j];
			var selected = (i - 1 == j ? 'selected=""' : "");
			html +=
					'<option ' + selected + ' value="' + j + '" class="russian-party ' + p.style + '">' + getString(p.text) + ' (' + getString(difficultiesNames[p.difficulty-1]) + ')</option>\n';
		}
		var sel0 = (i == 1 ? 'selected=""' : ""),
		    sel1 = (i != 1 ? 'selected=""' : "");
		html +=
				'</select>\n' + 
				'<select style="width:100px" class="select-player-ai" id="player' + i + 'ai" title="Выберите, будет ли этот игрок контролироваться вручную или компьютером." onclick="document.getElementById(\'player' + i + 'name\').disabled = this.value !== \'0\';">\n' + 
				'	<option ' + sel0 + ' value="0">' + getString('human') + '</option>\n' + 
				'	<option ' + sel1 + ' value="1">' + getString('ai') + '</option>\n' +
				'</select>'
		player.innerHTML = html;
		setup.appendChild(player);
	}
	$(".select-player").msDropdown('{"width": 250}');
	$(".select-player-ai").msDropdown();
}

function getCheckedProperty() {
	for (var i = 0; i < 42; i++) {
		if (document.getElementById("propertycheckbox" + i) && document.getElementById("propertycheckbox" + i).checked) {
			return i;
		}
	}
	return -1; // No property is checked.
}

