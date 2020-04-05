var ADIDAS_YS_PAYMENT_PAGE_REGEX = new RegExp("^https?://(?:www.)?(?:adidas|yeezysupply).+?/(?:delivery|payment|COShipping-Show|COSummary2-Start).*", "i");
var OFFWHITE_PAYMENT_PAGE_REGEX = new RegExp("^https?://(?:www.)?off---white.com/.+?/checkout/payment.*", "i");
var FOOTSITE_PAYMENT_PAGE_REGEX = new RegExp("^https?://(?:www.)?(?:footlocker|champssports|footaction|eastbay).+?/checkout.*", "i");
var FOOTSITE_EU_REGEX = new RegExp("^https?://(?:www.)?(?:footlocker).+?/INTERSHOP.*", "i");
var GLOBAL_E_PAGE_REGEX = new RegExp("^https?://webservices.global-e.com/Checkout/v2/.*", "i");
var GOOGLE_FORM_REGEX = new RegExp("^https?://docs.google.com/forms/.*?/viewform", "i");
var ADD_LISTENER = "addListener";
var mutationObserver = new MutationObserver(mutationCallback);
var DELAY = 25;
var CARD_TYPE_MAP = new Map(); /* Thanks to https://gist.github.com/genecyber/5a13ba6a553e3995bbcc9cc2e61075fa */
var AUTO_FILL_ICON = "https://i.imgur.com/dI7i9Wl.png";

CARD_TYPE_MAP.set(new RegExp("^4"), "Visa");
CARD_TYPE_MAP.set(new RegExp("^5[1-5]"), "Mastercard");
CARD_TYPE_MAP.set(new RegExp("^3[47]"), "American Express");
CARD_TYPE_MAP.set(new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)"), "Discover");
CARD_TYPE_MAP.set(new RegExp("^36"), "Diners");
CARD_TYPE_MAP.set(new RegExp("^30[0-5]"), "Diners - Carte Blanche");
CARD_TYPE_MAP.set(new RegExp("^35(2[89]|[3-8][0-9])"), "JCB");
CARD_TYPE_MAP.set(new RegExp("^(4026|417500|4508|4844|491(3|7))"), "Visa Electron");

var booleanMapDefault = new Map();
booleanMapDefault.set(ADD_LISTENER, true);

var href = getVal(window.location.href);
var ref = isIframe() && document.referrer ? getVal(document.referrer) : getVal(document.location.href);
var items = [];
var elements = [];

var autofill_count = 0;


function dispatchInputEvent(elem) {
	if (elem) {
		dispatchEvent(elem, EVENT_PARAMS, "input");
	}
}

function dispatchKeydownEvent(elem) {
	if (elem) {
		dispatchEvent(elem, EVENT_PARAMS, "keydown");
	}
}

function dispatchClickEvent(elem) {
	if (elem) {
		// dispatchEvent(elem, EVENT_PARAMS, "mousedown");
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
	if (elem) {
		elem.value = val;
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

function processInputWithDispatchEvent(elem, value, mode) {
	if (elem && getValue(elem).length == 0) {
		if (value) {
			focusElement(elem);
			if (isDefaultMode(mode)) {
				dispatchKeydownEvent(elem);
			}
			setValue(elem, value ? value.trim() : value);
			if (isDefaultMode(mode)) {
				dispatchChangeEvent(elem);
				dispatchInputEvent(elem);
			}
			blurElement(elem);
		}
		return true;
	}
	return false;
}

function isDocumentInteractiveComplete() {
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
	if (elem.form.style.opacity) console.log('opacity', elem.form.style.opacity)
	return elem.form.style.opacity === 0 ? true : false;
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

function isIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function processName(regex, name, elem, value, mode) {
	if (name.match(regex)) {
		return processInputWithDispatchEvent(elem, value, mode);
	}
	return false;
}

function processNameSelect(regex, name, elem, value, isNumeric) {
	if (name.match(regex)) {
		return setSelectValue(elem, value, isNumeric);
	}
	return false;
}

function processAc(ac, attribute, elem, value, mode) {
	if (ac === attribute || ac.includes(attribute)) {
		return processInputWithDispatchEvent(elem, value, mode);
	}
	return false;
}

function processAcSelect(ac, attribute, elem, value) {
	if (ac === attribute || ac.includes(attribute)) {
		return setSelectValue(elem, value, false);
	}
	return false;
}

function getSelectName(input) {
	var attr = getAttr(input, "data-auto-id");
	if (attr) {
		return attr;
	}

	var parent = input.parentElement;
    if (parent) {
 		attr = getAttr(parent, "data-auto-id");
 		if (attr) {
 			return attr;
 		}
	}

	var name = getVal(input.name);

	if (name) {
		return name;
	}

	return null;
}

function processAcNameAndEmail(ac, input, email, address, mode) {
	return processAc(ac, "email", input, email, mode) ||
		processAc(ac, "given-name", input, address.fName, mode) ||
		processAc(ac, "family-name", input, address.lName, mode) ||
		processAc(ac, "name", input, address.fName + " " + address.lName, mode) ||
		processAc(ac, "cc-name", input, address.fName + " " + address.lName, mode);
}

function processAcCard(ac, input, card, mode) {
	return processAc(ac, "cc-number", input, card.number, mode) ||
		processAc(ac, "cc-exp-month", input, card.expMonth, mode) ||
		processAc(ac, "cc-exp-year", input, card.expYear, mode) ||
		processAc(ac, "cc-exp", input, card.expMonth + " / " + card.expYear.substring(2,4), mode) ||
		processAc(ac, "cc-csc", input, card.cvv, mode);
}

function processRegexNameAndEmail(name, input, result, address, mode) {
	return processName(REGEX_NAME_FULL_NAME, name, input, address.fName + " " + address.lName, mode) ||
		processName(REGEX_NAME_FIRST_NAME, name, input, address.fName, mode) ||
		processName(REGEX_NAME_LAST_NAME, name, input, address.lName, mode) ||
		processName(REGEX_NAME_EMAIL, name, input, result.data.profile.email, mode) ||
		processName(REGEX_NAME_CARD_NAME, name, input, address.fName + " " + address.lName, mode) ||
		processName(REGEX_NAME_DISCORD_TAG, name, input, result.data.discord, mode) ||
		processName(REGEX_NAME_TWITTER_HANDLE, name, input, result.data.twitter, mode);
}

function processRegexCard(name, input, card, mode) {
	return processName(REGEX_NAME_CARD_NUMBER, name, input, card.number, mode) ||
		processName(REGEX_NAME_CARD_EXP_MONTH, name, input, card.expMonth, mode) ||
		processName(REGEX_NAME_CARD_EXP_YEAR, name, input, card.expYear, mode) ||
		processName(REGEX_NAME_CARD_EXP_DATE, name, input, card.expMonth + card.expYear.substring(2,4), mode) ||
		processName(REGEX_NAME_CARD_EXP_DATE_MMYY, name, input, card.expMonth + "/" + card.expYear.substring(2,4), mode) ||
		processName(REGEX_NAME_CARD_EXP_DATE_MM, name, input, card.expMonth, mode) ||
		processName(REGEX_NAME_CARD_EXP_DATE_YY, name, input, card.expYear.substring(2,4), mode) ||
		processName(REGEX_NAME_CARD_EXP_DATE_YYYY, name, input, card.expYear, mode) ||
		processName(REGEX_NAME_CARD_CVV, name, input, card.cvv, mode);
}

function processRegexCheckbox(name, input) {
	return processCheckboxOrRadio(REGEX_NAME_CHECKBOX, name, input);
}

function processCheckboxOrRadio(regex, name, input) {
	if (input && (getVal(input.type) === "checkbox" || getVal(input.type) === "radio")) {
		if (input.checked) {
			return true;
		} else if (name.match(regex) || getAttr(input, "data-auto-id").match(regex)) {
			if (input.nextElementSibling && getVal(input.nextElementSibling.tagName) === "ins") {
				input.nextElementSibling.click();
			} else {
				input.click();
				input.checked = true;
			}
			return true;
		}
	}

	return false;
}

function getCardType(number) {
	for (const [key, value] of CARD_TYPE_MAP) {
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


// start point
chrome.extension.sendMessage({msgType: "data"}, result => {
	console.log('[starting] ?', result)
	if (result.data && result.data.activation && result.data.profile && isIncludedSite(result.data.excludedSites)) {
		
		setInterval(function() {
				autofill_count ++;
				processAIO(result);
			},
			DELAY
		);
		setTimeout(function() {
			setInterval(function() {
				// click event
				processCheckout(result);
			}, DELAY);			
		}, DELAY * 20);

	}
});

function processAIO(result) {
	if (isDocumentInteractiveComplete()) {
		process(result);
	}
}

function process(result) {
	processInputAIO(result, "input");
	processInputAIO(result, "textarea");
	processSelect(result);
}

function attemptCheckout(elem, mode) {
	// id, text, value
	const strId = elem.attributes['id'] ? elem.attributes['id'].value : '';
	const strText = elem.innerText || '';
	const strValue = elem.value || '';

	let regx = REGEX_NAME_TO_CHECKOUT;
	if (!isDefaultMode(mode)) { return; }
	if (!validElement(elem)) return;

	if (!!strId && strId.match(regx)) {
		dispatchClickEvent(elem);
	} else if (!!strText && strText.match(regx)) {
		dispatchClickEvent(elem);
	} else if (!!strValue && strValue.match(regx)) {
		dispatchClickEvent(elem);
	}
}

function processCheckout(result) {
	// dispatchClickEvent(document.getElementById('continue_button')) ;
	// console.log(document.querySelectorAll('button').length, document.querySelectorAll('input[type="submit"]').length);
	for (let button of document.querySelectorAll('button')) { 
		attemptCheckout(button, result.data.mode);
	}
	for (let submit of document.querySelectorAll('input[type="submit"]')) {
		attemptCheckout(submit, result.data.mode);
	}
}

function addListeners(result) {
	if (booleanMapDefault.get(ADD_LISTENER)) {
		for (var input of document.getElementsByTagName("input")) {
			input.addEventListener("focus", function(evt) {
				focusEvent(evt, result);
			});
			mutationObserver.observe(input, {attributes: true});
			booleanMapDefault.set(ADD_LISTENER, false);
		}
		
		for (var input of document.getElementsByTagName("textarea")) {
			input.addEventListener("focus", function(evt) {
				focusEvent(evt, result);
			});
			mutationObserver.observe(input, {attributes: true});
			booleanMapDefault.set(ADD_LISTENER, false);
		}
	}
}

function focusEvent(evt, result) {
	processSingleInput(evt.target, result);
}

function processRegex(name, input, result) {
	if (name === undefined || name === null || name === "") {
		return false;
	}

	var address = getAddress(name, result);
	var mode = getMode(result.data.mode);

	return processRegexNameAndEmail(name, input, result, address, mode) ||
		processName(REGEX_NAME_ADDRESS_2, name, input, address.address2, mode) ||
		processName(REGEX_NAME_ADDRESS_1, name, input, address.address1, mode) ||
		processName(REGEX_NAME_CITY, name, input, address.city, mode) ||
		processName(REGEX_NAME_STATE, name, input, address.province ? address.province.split("/")[0] : "", mode) ||
		processName(REGEX_NAME_ZIP, name, input, address.zip, mode) ||
		processName(REGEX_NAME_PHONE, name, input, address.phone, mode) ||
		processName(REGEX_NAME_DISCOUNT_CODE, name, input, result.data.discount, mode) ||
		processRegexCard(name, input, result.data.profile.card, mode) ||
		processRegexCheckbox(name, input) ||
		processRegexCard(name, input, result.data.profile.card, mode) ||
		processRegexDIY(name, input, result, mode) ||
		(isShopifyCheckoutPages() && result.data.profile.ship && processCheckboxOrRadio(REGEX_NAME_DIFFERENT_BILLING_ADDRESS, name, input));
}

function processRegexDIY(name, elem, result, mode) {
	if (result.data.diy) {
		for (var diy of result.data.diy) {
			if (matchKeyword(name, diy.keyword)) {
				return processInputWithDispatchEvent(elem, diy.answer, mode);
			}
		}
	}
	return false;
}

function processMath(regex, name, input, mode) {
     var m = name.replace(/\s/, "").match(regex);
 
     if (m) {
         try {
         	var val = eval(m[0].replace(/x/, "*").replace(/\[/, "(").replace(/\]/, ")").replace(/\{/, "(").replace(/\}/, ")").replace(/\=/, "").replace(/\?/, ""));
         	if (val) {
            	return processInputWithDispatchEvent(input, getVal(new String(val)), mode);
            }
        } catch (e) {
             // do nothing
        }
    }
 
     return false;
}

function matchKeyword(title, keywords) {
	if (title) {
		for (var group of keywords) {
			var isMatch = true;
			for (var keyword of group) {
				if (keyword.startsWith("-")) {
					if (title.toLowerCase().includes(keyword.replace("-", ""))) {
						isMatch = false;
						break;
					}
					continue;
				}

				if (!title.toLowerCase().includes(keyword)) {
					isMatch = false;
					break;
				}
			}
			
			if (isMatch) {
				return true;
			}
		}
		
		return false;
	}

	return true;
}

function processRegexSelect(name, input, result) {
	if (name === undefined || name === null || name === "") {
		return false;
	}

	var address = getAddress(name, result);

	return processNameSelect(REGEX_NAME_STATE, name, input, address.province, false) ||
		processNameSelect(REGEX_NAME_COUNTRY, name, input, address.country, false) ||
		processNameSelect(REGEX_NAME_CARD_EXP_MONTH, name, input, result.data.profile.card.expMonth, true) ||
		processNameSelect(REGEX_NAME_CARD_EXP_YEAR, name, input, result.data.profile.card.expYear, true) ||
		processNameSelect(REGEX_NAME_CARD_EXP_YEAR, name, input, result.data.profile.card.expYear.substring(2,4), true) ||
		processNameSelect(REGEX_NAME_CARD_TYPE, name, input, getCardType(result.data.profile.card.number), false);
}

function processInputAIO(result, tagName) {
	for (var input of document.getElementsByTagName(tagName)) {
		processSingleInput(input, result);
	}
}

function processSingleInput(input, result) {
	if (validElement(input) || href.includes("pci-connect.square")) {
		if (elements.includes(input)) {
			return;
		}

		if (processRegex(getAttr(input, "data-auto-id"), input, result)) {
			postProcess(input);
			return;
		}

		var ac = getVal(input.getAttribute("autocomplete"));
		if (ac) {
			var address = getAddress(ac, result);
			var mode = getMode(result.data.mode);

			if (processAcNameAndEmail(ac, input, result.data.profile.email, address, mode) ||
				processAc(ac, "street-address", input, address.address1 + " " + address.address2, mode) ||
				processAc(ac, "address-line1", input, address.address1, mode) ||
				processAc(ac, "address-line2", input, address.address2, mode) ||
				processAc(ac, "country", input, address.country, mode) ||
				processAc(ac, "address-level1", input, address.province, mode) ||
				processAc(ac, "address-level2", input, address.city, mode) ||
				processAc(ac, "postal-code", input, address.zip, mode) ||
				processAc(ac, "tel", input, address.phone, mode) ||
				processAcCard(ac, input, result.data.profile.card, mode)) {
				postProcess(input);
				return;
			}
		}

		if (processRegex(getLabelText(input), input, result)) {
			postProcess(input);
			return;
		}

		if (processRegex(getVal(input.name), input, result)) {
			postProcess(input);
			return;
		}

		if (processRegex(getValCustomSite(input.placeholder), input, result)) {
			postProcess(input);
			return;
		}

		if (processRegex(getVal(input.id), input, result) || processRegex(input.getAttribute("data-checkout"), input, result) || processMath(REGEX_MATH, getLabelText(input), input, mode)) {
			postProcess(input);
			return;
		}

		var text = decodeHTML(input.getAttribute("aria-label"));
		if (href.includes("docs.google.com/forms") && (processRegex(text, input, result) || processMath(REGEX_MATH, text, input, mode))) {
			postProcess(input);
			return;
		}
	}
}

function processSelect(result) {
	for (var input of document.getElementsByTagName("select")) {
		if (validElement(input) || href.includes("pci-connect.square")) {
			if (elements.includes(input)) {
				continue;
			}

			if (processRegexSelect(getSelectName(input), input, result)) {
				postProcess(input);
				continue;
			}

			var ac = getVal(input.getAttribute("autocomplete"));
			if (ac) {
				var address = result.data.profile.bill;
				if (result.data.profile.ship && ac.includes("shipping")) {
					address = result.data.profile.ship;
				}

				if (processAcSelect(ac, "country", input, address.country) ||
					processAcSelect(ac, "address-level1", input, address.province)) {
					postProcess(input);
					continue;
				}
			}

			if (processRegexSelect(getLabelText(input), input, result)) {
				postProcess(input);
				continue;
			}

			if (processRegexSelect(getVal(input.id), input, result)) {
				postProcess(input);
				continue;
			}
		}
	}
}

function postProcess(input) {
	elements.push(input);
	if (items.length == 0) {
		var url = null;
		href = getVal(window.location.href);

		if (isShopifyCheckoutPages()) {
			var products = document.getElementsByClassName("product__image");
			if (products) {
				for (var product of products) {
					var image = product.getElementsByTagName("img")[0];
					if (image) {
						items.push({"src": image.src, "alt": image.getAttribute("alt")});
					}
				}
				sendItems(items, url);
			}
			return;
		}

		if (href.includes("checkout.bigcartel.com")) {
	     	var products = document.getElementsByClassName("product");
			if (products) {
				for (var product of products) {
					items.push({"src": AUTO_FILL_ICON, "alt": getVal(product.innerText)});
				}

				var sf = document.getElementsByName("storefront")[0];
				var a = document.getElementsByTagName("a")[0];

				url = sf ? sf.content : (a ? a.href : "https://checkout.bigcartel.com/")
				sendItems(items, url);
			}
			return;
		}

		if (href.match(ADIDAS_YS_PAYMENT_PAGE_REGEX)) {
			var products = document.getElementsByClassName("line_item___1coA5") && document.getElementsByClassName("line_item___1coA5").length > 0 ? document.getElementsByClassName("line_item___1coA5") : document.getElementsByClassName("line-item");
			if (products) {
				for (var product of products) {
					var image = product.getElementsByTagName("img")[0];
					if (image) {
						var alt;
						try {
							alt = product.innerText.split("\n").slice(0,3).join("\n");
						} catch (e) {
							alt = img.alt;
						}
						items.push({"src": image.src, "alt": alt});
					}
				}
			}
			sendItems(items, url);
			return;
		}

		if (href.match(OFFWHITE_PAYMENT_PAGE_REGEX)) {
			var products = document.getElementsByClassName("cart-items-image");
			if (products) {
				for (var product of products) {
					var image = product.getElementsByTagName("img")[0];
					if (image) {
						items.push({"src": image.src, "alt": image.getAttribute("alt")});
					}
				}
			}
			sendItems(items, url);
			return;
		}

		if (href.match(FOOTSITE_PAYMENT_PAGE_REGEX)) {
			var products = document.getElementsByClassName("FulfillmentProducts-product");
			if (products) {
				for (var product of products) {
					var image = product.getElementsByTagName("img")[0];
					if (image) {
						items.push({"src": image.src, "alt": product.innerText});
					}
				}
			}
			sendItems(items, url);
			return;
		}

		if (href.match(FOOTSITE_EU_REGEX)) {
			var products = document.getElementsByClassName("fl-cart-summary--list--item");
			if (products) {
				for (var product of products) {
					var image = product.getElementsByTagName("img")[0];
					if (image && image.src.startsWith("http")) {
						var alt;
						try {
							alt = product.innerText.split("\n").slice(1,5).join("\n");
						} catch (e) {
							alt = img.alt;
						}
						items.push({"src": image.src, "alt": alt});
					}
				}
			}
			sendItems(items, url);
			return;
		}

		if (href.match(GLOBAL_E_PAGE_REGEX)) {
			url = getGlobalEMerchant();
			items.push({"src": "", "alt": ""});
			sendItems(items, url);
			return;
		}

		if (href.includes("supremenewyork.com/checkout") || href.match(GOOGLE_FORM_REGEX)) {
			items.push({"src": "", "alt": ""});
			sendItems(items, url);
			return;
		}

		if (href.includes("js.stripe.com/v3/elements-inner-card")) {
			items.push({"src": "", "alt": ""});
			chrome.extension.sendMessage({
	            msgType: "items",
	            url: document.referrer
	        });
	        return;
		}
	}	
}

function sendItems(items, url) {
	if (items.length > 0) {
		chrome.extension.sendMessage({
			msgType: "items",
			items: items,
			url: url
		});
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

function decodeHTML(text) {
    var textArea = document.createElement("textarea");
    textArea.innerHTML = text;
    return textArea.value;
}

function getMode(mode) {
	if (ref.includes("cybersole.io")) {
		return "2";
	}

	return mode;
}