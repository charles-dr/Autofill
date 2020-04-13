

const APP_SETTINGS = {
	auth_recheck: false,
	auth_endpoint: "https://www.restockintel.com/api/v1",
	auth_key: 'ak_ihs5TCJ8TX6FXCrxMf5d'
}
const DISPATCH_PARAM = { bubbles: true };
const PATTERN_G_MERCHANT = new RegExp("redToMerchantURL\\s+:\\s+\"(.+?)\"", "i");
var mutationObserver = new MutationObserver(mutationCallback);
const AF_ATTRIBUTE = 'REST_AF_DONE';

function docReady(fn) {
	// see if DOM is already available
	if (document.readyState === "complete" || document.readyState === "interactive") {
		// call on next available tick
		setTimeout(fn, 1);
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

function ajaxPost(url, data, headers) {
	var xhttp = new XMLHttpRequest();
	return new Promise((resolve, reject) => {
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				console.log(xhttp.responseText);
				resolve(JSON.parse(xhttp.responseText));
			} else if (this.status == 404) {
				reject(404);
			} else if (this.status >= 400) {
				reject(400);
			}
		};
		xhttp.open("POST", url, true);
		for (let key in headers) {
			xhttp.setRequestHeader(key, headers[key]);
		}
		xhttp.setRequestHeader('Authorization', `Bearer ${APP_SETTINGS.auth_key}`);
		xhttp.send(JSON.stringify(data));
	})
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
		xhttp.setRequestHeader('Authorization', `Bearer ${APP_SETTINGS.auth_key}`);
		xhttp.send();
	})
}

function getGlobalEMerchant() {
	var html = document.getElementsByTagName("html")[0];
	if (html && html.innerHTML) {
		var m = html.innerHTML.match(PATTERN_G_MERCHANT);
		if (m) {
			// debugger;
			// console.log('match', m);
			return m[1];
		}
	}
	return "https://webservices.global-e.com";
}

function authURL(url) {
	return APP_SETTINGS.auth_endpoint + url;
}

function storeActivationInfo(info, callback = null) {
	chrome.storage.local.get(["data"], function (store) {
		console.log('[Activation] loaded', store);
		let data = {};
		if (store && store.data) {
			data = store.data;
		}
		data.activation = info;
		chrome.storage.local.set({ data: data }, function () {
			console.log('[Activation] saved', store);
			if (callback && typeof callback === 'function') callback();
		});
	})
}

function unauthorizeUser(callback = null) {
	chrome.storage.local.get(['data'], function (store) {
		if (store && store.data) {
			store.data.activation = null;
			chrome.storage.local.set({ data: store.data }), function () {
				console.log('Unauthorized!');
				if (callback && typeof callback === 'function') {
					callback();
				}
			}
		}
	});
}

function showAlertModal(content, title, showOk = true, showCancel = false) {
	if (!!title) {
		document.querySelector('.modal .modal-header').classList.remove('hidden');
		document.querySelector('.modal .modal-header').innerText = title;
	} else {
		document.querySelector('.modal .modal-header').classList.add('hidden');
	}

	document.querySelector('.modal .modal-body').innerText = content;

	if (showOk) {
		document.querySelector('.modal .modal-ok').classList.remove('hidden');
	} else {
		document.querySelector('.modal .modal-ok').classList.add('hidden');
	}

	if (showCancel) {
		document.querySelector('.modal .modal-cancel').classList.remove('hidden');
	} else {
		document.querySelector('.modal .modal-cancel').classList.add('hidden');
	}
	showModal();
}

function dispatchEvent(elem, params, type) {
	if (typeof elem.dispatchEvent === "function") {
		elem.dispatchEvent(new Event(type, params));
	}
}

function dispatchChangeEvent(elem) {
	if (elem) {
		dispatchEvent(elem, DISPATCH_PARAM, "change");
	}
}

function getVal(value) {
	if (value) {
		return value.trim().toLowerCase().replace(/\s+/, " ");;
	}
	return "";
}

function dispatchKeydownEvent(elem) {
	if (elem) {
		dispatchEvent(elem, DISPATCH_PARAM, "keydown");
	}
}

// function dispatchClickEvent(elem) {
// 	if (elem) {
// 		dispatchEvent(elem, DISPATCH_PARAM, "mousedown");
// 		elem.dispatchEvent(new Event('mousedown'));
// 		const attrName = 'auto-checkout-done';
// 		if (elem.attributes[attrName] === undefined) {
// 			elem.click(); //console.log('[dispatched]', elem);
// 			elem.attributes[attrName] = 'true';
// 		}

// 		// var e = document.createEvent('HTMLEvents');
// 		// e.initEvent('mousedown', false, true);
// 		// elem.dispatchEvent(e);
// 	}
// }

function dispatchClickEvent(elem) {
	if (elem) {
		// dispatchEvent(elem, DISPATCH_PARAM, "mousedown");
		// elem.dispatchEvent(new Event('mousedown'));
		const attrName = 'auto-checkout-done';
		// if (elem.attributes[attrName] === undefined) {
		elem.click(); //console.log('[dispatched]', elem);
		elem.attributes[attrName] = 'true';
		// }

		// var e = document.createEvent('HTMLEvents');
		// e.initEvent('mousedown', false, true);
		// elem.dispatchEvent(e);
	}
}

function setSelectValue(elem, val, isNumeric) {
	if (elem && elem.options && val) {
		for (var val of val.split("/")) {
			for (var opt of elem.options) {
				value = getStringOrNumeric(val, isNumeric);
				if (getStringOrNumeric(opt.value, isNumeric) === value || getStringOrNumeric(opt.innerText, isNumeric) === value
					|| (opt.getAttribute("data-code") && getStringOrNumeric(opt.getAttribute("data-code"), isNumeric) === value)) {
					if (opt.selected || elem.value === opt.value || elem.getAttribute("af")) {
						elem.setAttribute("af", true);
						break;
					} else {
						opt.selected = true;
						elem.value = opt.value;
						elem.setAttribute("af", true);
						dispatchChangeEvent(elem);
						return true;
					}
				}
			}
		}
	}

	return false;
}

function setValue(elem, val) {
	if (elem) { // && elem.attributes[AF_ATTRIBUTE]===undefined
		// elem.dispatchEvent(new Event('focus'));
		elem.value = val;
		elem.dispatchEvent(new Event('blur'));
		elem.attributes[AF_ATTRIBUTE] = 'true';
		return true;
	}
	return false;
}

function getValue(elem) {
	if (elem) {
		return elem.value.trim();
	}

	return "";
}

function getValNumeric(value) {
	if (value) {
		return parseInt(value);
	}
	return NaN;
}

function getStringOrNumeric(value, isNumeric) {
	if (isNumeric) {
		return getValNumeric(value);
	}

	return getVal(value);
}

function focusElement(elem) {
	if (elem) {
		elem.focus();
	}
}

function blurElement(elem) {
	if (elem) {
		elem.blur();
	}
}

function dispatchInputEvent(elem) {
	if (elem) {
		dispatchEvent(elem, DISPATCH_PARAM, "input");
	}
}

function isDocumentLoadingComplete() {
	return document.readyState === "interactive" || document.readyState === "complete";
}

function validElement(elem) {
	return elem && isVisible(elem) && (!isElementInViewport(elem) || isShopifyCheckoutPages()) && !isDisabled(elem) && !isParentFormTransparent(elem);
}

function isVisible(elem) {
	return elem.offsetWidth > 0 && elem.offsetHeight > 0;
}

function isDisabled(elem) {
	return (elem.getAttribute("disabled") && elem.getAttribute("disabled").toLowerCase() === "disabled") || elem.disabled;
}

function isShopifyCheckoutPages() {
	if (window.location.href.toLowerCase().includes("/checkouts/")) {
		if (document.getElementById("shopify-digital-wallet")) {
			return true;
		}

		var html = document.getElementsByTagName("html")[0];
		if (html) {
			var text = html.innerHTML.toLowerCase();

			return text.includes("shopify.com") || text.includes("shopify-bag-outline") || text.includes("window.shopifybuy");
		}
	}

	return false;
}

function isElementInViewport(elem) {
	/** Credit to http://jsfiddle.net/cferdinandi/b13ctvd7/ */
	var bounding = elem.getBoundingClientRect();
	var out = {};
	out.top = Math.trunc(bounding.top) < 0;
	out.left = Math.trunc(bounding.left) < 0;
	out.bottom = Math.trunc(bounding.bottom) > (Math.trunc(window.innerHeight) || Math.trunc(document.documentElement.clientHeight));
	out.right = Math.trunc(bounding.right) > (Math.trunc(window.innerWidth) || Math.trunc(document.documentElement.clientWidth));
	out.any = out.top || out.left || out.bottom || out.right;

	return out.any;
}

function isParentFormTransparent(elem) {
	if (elem.form) {
		const parent_opacity = window.getComputedStyle(elem.form).getPropertyValue("opacity");
		return Number(parent_opacity) === 0 ? true : false;
	}
	return false;
}

/** accepts excluded sites list paramter **/
function isIncludedSite(excludedSites) {
	if (excludedSites) {
		var sites = excludedSites.toLowerCase().split(",");
		if (sites && sites.length > 0) {
			var referrer = isIframe() && document.referrer ? document.referrer.toLowerCase() : document.location.href;
			for (var site of sites) {
				site = getVal(site);
				if (site === "") {
					continue;
				}
				if (referrer.includes(site)) {
					return false;
				}
			}
		}
	}

	return true;
}

function isIframe() {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}

function getValCustomSite(val) {
	if (val === "number" && href.includes("supremenewyork.com")) {
		return "card number";
	}

	return getVal(val);
}

function mutationCallback(mutationsList) {
	mutationsList.forEach(mutation => {
		if (mutation.attributeName === "class") {
			var target = mutation.target;
			if (target && getVal(target.className).includes("invalid")) {
				focusElement(target);
			}
		}
	});
}

function getCardType(number) {
	for (const [key, value] of MAP_CARD_TYPE) {
		if (number.match(key)) {
			return value;
		}
	}

	return "";
}

function getLabelText(input) {
	var id = input.id;
	if (id) {
		var label = document.querySelector("label[for='" + id + "']");
		if (label) {
			return getVal(label.innerText);
		}
	}

	var parent = input.parentElement;
	if (parent) {
		if (parent.tagName.toLowerCase() === "label") {
			return getVal(parent.innerText);
		}

		var previous = parent.previousElementSibling;
		if (previous && previous.tagName.toLowerCase() === "label") {
			return getVal(previous.innerText);
		}
	}

	return "";
}

function getAddress(name, result) {
	var address = result.data.profile.bill;
	if (result.data.profile.ship && name.includes("ship")) {
		address = result.data.profile.ship;
	}

	return address;
}

function getAttr(input, attr) {
	var attribute = "";
	if (input) {
		attribute = getVal(input.getAttribute(attr));
	}
	return attribute;
}

function isDefaultMode(mode) {
	return mode === undefined || mode === "1"
}