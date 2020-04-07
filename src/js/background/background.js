// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let itemsMap = new Map();
const DEFAULT_URL_REGEX = new RegExp("^(https?://[\\w.-]+)/?.*", "i");
const SHOPIFY_URL_REGEX = new RegExp("^(https?://.+?)/.*(?:checkouts|orders)/(\\w+)?(?:$|\\?|/thank_you)", "i");
const BIGCARTEL_URL_REGEX = new RegExp("^(https?://checkout.bigcartel.com)/(\\w+)/.*", "i");
let version = chrome.runtime.getManifest().version;

let result;
let data_updated = false;

reloadData();

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	// console.log('[background]-onMessage', request, sender, sendResponse, request.msgType);
	var msgType = request.msgType;

	if (msgType === "data") {
		// chrome.storage.local.get(["data"], function (res) {
		// 	if (res && res.data) {
		// 		result = res.data;

		// 	}
		// })
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

// restrict the activation based active domains
chrome.runtime.onInstalled.addListener(function () {
	console.log('[Installed]');
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions: [new chrome.declarativeContent.PageStateMatcher({
				// pageUrl: {hostEquals: 'developer.chrome.com'},
			})
			],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});
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
			console.log('[reload Data]', result, data_updated);
		}
	})
}

function getWebhook() {
	console.log('[BK] - getWebhook');
	return webhooks[getRandomNumber(0, webhooks.length)];
}

function processItems(request, sender) {
	console.log('[bk] - processItems', request, sender);
	if (request.url) {
		var m = sender.url.match(BIGCARTEL_URL_REGEX);
		if (m) {
			itemsMap.set(sender.tab.id, {url: m[1], key: m[2], items: request.items, store: request.url});
			return;
		}

		m = request.url.match(DEFAULT_URL_REGEX);
		if (m) {
			if (request.items) {
				itemsMap.set(sender.tab.id, {url: m[1], items: request.items});
			} else {
				itemsMap.set(sender.tab.id, {url: m[1]});
			}
		}
	} else {
		var url = sender.url.toLowerCase();
		var m = url.match(SHOPIFY_URL_REGEX);
		if (m) {
			itemsMap.set(sender.tab.id, {url: m[1], key: m[2], items: request.items});
			return;
		}

		if (url.includes("/checkouts/")) {
			return;
		}
		
		m = url.match(DEFAULT_URL_REGEX);
		if (m) {
			itemsMap.set(sender.tab.id, {url: m[1], items: request.items});
			return;
		}
	}
}