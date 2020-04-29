'use strict';
const auth_endpoint = "https://www.restockintel.com/api/v1";
const auth_key = "ak_ihs5TCJ8TX6FXCrxMf5d";
let itemsMap = new Map();
const PATTERN_DEFAULT_URL = new RegExp("^(https?://[\\w.-]+)/?.*", "i");
const PATTERN_SHOPIFY = new RegExp("^(https?://.+?)/.*(?:checkouts|orders)/(\\w+)?(?:$|\\?|/thank_you)", "i");
const PATTERN_BIGCARTEL = new RegExp("^(https?://checkout.bigcartel.com)/(\\w+)/.*", "i");
const ENCRYPT_KEY = 'RESTOCK$$!WITH*(TAI:)';
let result;
let data_updated = false;

reloadData();

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	var msgType = request.msgType;
	if (msgType === "data") {
		sendResponse({ data: result, updated: data_updated });
	} else if (msgType === "reloadData") {
		reloadData();
	} else if (msgType === "items") {
		processItems(request, sender);
	} 
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
	reloadData();
	data_updated = false;
	if (info.status === 'complete') {

	}
});

// installation
// restrict the activation based active domains
chrome.runtime.onInstalled.addListener(function (details) {
	console.log(details)
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions: [new chrome.declarativeContent.PageStateMatcher({
				// pageUrl: {hostEquals: 'developer.chrome.com'},
			})
			],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});
	setInterval(function() {
		updateAuthStatus();
	}, 10000);
});


function ajaxTest(url, data, headers) {
	var xhttp = new XMLHttpRequest();
	return new Promise((resolve, reject) => {
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				// Typical action to be performed when the document is ready:
				console.log(xhttp.responseText);
				resolve(JSON.parse(xhttp.responseText));
				// document.getElementById("demo").innerHTML = xhttp.responseText;
			}
		};
		xhttp.open("POST", url, true);
		// xhttp.setRequestHeader('Content-Type', 'application/json');
		for (let key in headers) {
			xhttp.setRequestHeader(key, headers[key]);
		}
		xhttp.send(JSON.stringify(data));
	})
}

function reloadData() {
	chrome.storage.local.get(["data"], function (res) {
		if (res && res.data) {
			result = res.data;
			data_updated = true;
			// console.log('[reload Data]', result, data_updated);
		}
	})
}

function processItems(request, sender) {
	// console.log('[bk] - processItems', request, sender);
	if (request.url) {
		var m = sender.url.match(PATTERN_BIGCARTEL);
		if (m) {
			itemsMap.set(sender.tab.id, { url: m[1], key: m[2], items: request.items, store: request.url });
			return;
		}

		m = request.url.match(PATTERN_DEFAULT_URL);
		if (m) {
			if (request.items) {
				itemsMap.set(sender.tab.id, { url: m[1], items: request.items });
			} else {
				itemsMap.set(sender.tab.id, { url: m[1] });
			}
		}
	} else {
		var url = sender.url.toLowerCase();
		var m = url.match(PATTERN_SHOPIFY);
		if (m) {
			itemsMap.set(sender.tab.id, { url: m[1], key: m[2], items: request.items });
			return;
		}

		if (url.includes("/checkouts/")) {
			return;
		}

		m = url.match(PATTERN_DEFAULT_URL);
		if (m) {
			itemsMap.set(sender.tab.id, { url: m[1], items: request.items });
			return;
		}
	}
}

function authURL(url) {
    return auth_endpoint + url;
}

function ajaxGet(url, headers) {
    var xhttp = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                // console.log(xhttp.responseText);
                resolve(JSON.parse(xhttp.responseText));
            } else if (this.status == 404) {
                reject(404);
            } else if (this.status >= 400) {
                reject(400);
            }
        };
        xhttp.open("GET", url, true);
        for (let key in headers) {
            xhttp.setRequestHeader(key, headers[key]);
        }
        xhttp.setRequestHeader('Authorization', `Bearer ${auth_key}`);
        xhttp.send();
    })
}

function updateAuthStatus() {
	chrome.storage.local.get(["data"], function (store) {
		if (store && store.data && store.data.activation) {
			const token = store.data.activation.activation_token;
			ajaxGet(authURL(`/activations/${token}`), { 'Content-Type': 'application/json' })
			    .then(function (res) {
			        // console.log(res);
			        if (res.success && res.success === true) {

			        } else {
						unauthorizeUser(store)
			        }
			    })
			    .catch(function (error) {
					unauthorizeUser(store)
			    });
		} else {
			unauthorizeUser(store)
		}
	});
}

function unauthorizeUser(store, callback = null) {
	let data = {};
	if (store && store.data) {
		data = store.data;
	}
	data.activation = null;
	chrome.storage.local.set({data: data}, function() {
		if (!!callback && typeof callback === 'function') {
			callback();
		}
	});
}
