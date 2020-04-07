

var booleanMapDefault = new Map();
var ADD_LISTENER = "addListener";
booleanMapDefault.set(ADD_LISTENER, true);

var href = getVal(window.location.href);
var ref = isIframe() && document.referrer ? getVal(document.referrer) : getVal(document.location.href);
var items = [];
var elements = [];
var autofill_count = 0;

// start point
chrome.extension.sendMessage({ msgType: "data" }, result => {
	// console.log('[starting] ?', result) //
	if (result.data && result.data.activation && result.data.profile && isIncludedSite(result.data.excludedSites)) {

		setInterval(function () {
			autofill_count++;
			processAIO(result);
		},
			DELAY
		);
		setTimeout(function () {
			setInterval(function () {
				// click event
				processCheckout(result);
			}, DELAY);
		}, DELAY * 20);

	}
});

function processInputWithDispatchEvent(elem, value, mode) {
	try {
		setValue(elem, value ? value.trim() : value);
	} catch (e) {
		console.error(e);
	}
	
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

function processAutoComplete(ac, attribute, elem, value, mode) {
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
	return processAutoComplete(ac, "email", input, email, mode) ||
		processAutoComplete(ac, "given-name", input, address.fName, mode) ||
		processAutoComplete(ac, "family-name", input, address.lName, mode) ||
		processAutoComplete(ac, "name", input, address.fName + " " + address.lName, mode) ||
		processAutoComplete(ac, "cc-name", input, address.fName + " " + address.lName, mode);
}

function processAcCard(ac, input, card, mode) {
	return processAutoComplete(ac, "cc-number", input, card.number, mode) ||
		processAutoComplete(ac, "cc-exp-month", input, card.expMonth, mode) ||
		processAutoComplete(ac, "cc-exp-year", input, card.expYear, mode) ||
		processAutoComplete(ac, "cc-exp", input, card.expMonth + " / " + card.expYear.substring(2, 4), mode) ||
		processAutoComplete(ac, "cc-csc", input, card.cvv, mode);
}

function processRegexNameAndEmail(name, input, result, address, mode) {
	return processName(PATTERN_FULL_NAME, name, input, address.fName + " " + address.lName, mode) ||
		processName(PATTERN_FIRST_NAME, name, input, address.fName, mode) ||
		processName(PATTERN_LAST_NAME, name, input, address.lName, mode) ||
		processName(PATTERN_EMAIL, name, input, result.data.profile.email, mode); 
		// ||
		// processName(PATTERN_CARD_NAME, name, input, address.fName + " " + address.lName, mode) ||
		// processName(PATTERN_DISCORD_TAG, name, input, result.data.discord, mode) ||
		// processName(PATTERN_TWITTER_HANDLE, name, input, result.data.twitter, mode);
}

function processRegexCard(name, input, card, mode) {
	return processName(PATTERN_CARD_NUMBER, name, input, card.number, mode) ||
		processName(PATTERN_CARD_EXP_MONTH, name, input, card.expMonth, mode) ||
		processName(PATTERN_CARD_EXP_YEAR, name, input, card.expYear, mode) ||
		processName(PATTERN_CARD_EXP_DATE, name, input, card.expMonth + card.expYear.substring(2, 4), mode) ||
		processName(PATTERN_CARD_EXP_DATE_MMYY, name, input, card.expMonth + "/" + card.expYear.substring(2, 4), mode) ||
		processName(PATTERN_CARD_EXP_DATE_MM, name, input, card.expMonth, mode) ||
		processName(PATTERN_CARD_EXP_DATE_YY, name, input, card.expYear.substring(2, 4), mode) ||
		processName(PATTERN_CARD_EXP_DATE_YYYY, name, input, card.expYear, mode) ||
		processName(PATTERN_CARD_CVV, name, input, card.cvv, mode);
}

function processRegexCheckbox(name, input) {
	return processCheckboxOrRadio(PATTERN_CHECKBOX, name, input);
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

	let regx = PATTERN_TO_CHECKOUT;
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
			input.addEventListener("focus", function (evt) {
				focusEvent(evt, result);
			});
			mutationObserver.observe(input, { attributes: true });
			booleanMapDefault.set(ADD_LISTENER, false);
		}

		for (var input of document.getElementsByTagName("textarea")) {
			input.addEventListener("focus", function (evt) {
				focusEvent(evt, result);
			});
			mutationObserver.observe(input, { attributes: true });
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
		processName(PATTERN_ADDRESS_2, name, input, address.address2, mode) ||
		processName(PATTERN_ADDRESS_1, name, input, address.address1, mode) ||
		processName(PATTERN_CITY, name, input, address.city, mode) ||
		processName(PATTERN_STATE, name, input, address.province ? address.province.split("/")[0] : "", mode) ||
		processName(PATTERN_ZIP, name, input, address.zip, mode) ||
		processName(PATTERN_PHONE, name, input, address.phone, mode) ||
		processName(PATTERN_DISCOUNT_CODE, name, input, result.data.discount, mode) ||
		processRegexCard(name, input, result.data.profile.card, mode) ||
		processRegexCheckbox(name, input) ||
		processRegexCard(name, input, result.data.profile.card, mode) ||
		processRegexDIY(name, input, result, mode) ||
		(isShopifyCheckoutPages() && result.data.profile.ship && processCheckboxOrRadio(PATTERN_DIFFERENT_BILLING_ADDRESS, name, input));
}

function processRegexDIY(name, elem, result, mode) {
	if (result.data.customs) {
		for (var diy of result.data.customs) {
			if (matchKeyword(name.toLowerCase(), diy.keyword.toLowerCase())) {
				return processInputWithDispatchEvent(elem, diy.value, mode);
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

function matchKeyword(title, keyword) {
	// if (title.toLowerCase() == 'discord') 
	if (title) {
		// for (var group of keywords) {
		var isMatch = true;
		// for (var keyword of group) {
		if (keyword.startsWith("-")) {
			if (title.toLowerCase().includes(keyword.replace("-", ""))) {
				isMatch = false;
				// break;
			}
			// continue;
		}

		if (!title.toLowerCase().includes(keyword)) {
			isMatch = false;
			// break;
		}
		// }

		if (isMatch) {
			return true;
		}
		// }

		return false;
	}

	return true;
}

function processRegexSelect(name, input, result) {
	if (name === undefined || name === null || name === "") {
		return false;
	}

	var address = getAddress(name, result);

	return processNameSelect(PATTERN_STATE, name, input, address.province, false) ||
		processNameSelect(PATTERN_COUNTRY, name, input, address.country, false) ||
		processNameSelect(PATTERN_CARD_EXP_MONTH, name, input, result.data.profile.card.expMonth, true) ||
		processNameSelect(PATTERN_CARD_EXP_YEAR, name, input, result.data.profile.card.expYear, true) ||
		processNameSelect(PATTERN_CARD_EXP_YEAR, name, input, result.data.profile.card.expYear.substring(2, 4), true) ||
		processNameSelect(PATTERN_CARD_TYPE, name, input, (result.data.profile.card.number), false);
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
				processAutoComplete(ac, "street-address", input, address.address1 + " " + address.address2, mode) ||
				processAutoComplete(ac, "address-line1", input, address.address1, mode) ||
				processAutoComplete(ac, "address-line2", input, address.address2, mode) ||
				processAutoComplete(ac, "country", input, address.country, mode) ||
				processAutoComplete(ac, "address-level1", input, address.province, mode) ||
				processAutoComplete(ac, "address-level2", input, address.city, mode) ||
				processAutoComplete(ac, "postal-code", input, address.zip, mode) ||
				processAutoComplete(ac, "tel", input, address.phone, mode) ||
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
						items.push({ "src": image.src, "alt": image.getAttribute("alt") });
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
					items.push({ "src": AUTO_FILL_ICON, "alt": getVal(product.innerText) });
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
							alt = product.innerText.split("\n").slice(0, 3).join("\n");
						} catch (e) {
							alt = img.alt;
						}
						items.push({ "src": image.src, "alt": alt });
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
						items.push({ "src": image.src, "alt": image.getAttribute("alt") });
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
						items.push({ "src": image.src, "alt": product.innerText });
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
							alt = product.innerText.split("\n").slice(1, 5).join("\n");
						} catch (e) {
							alt = img.alt;
						}
						items.push({ "src": image.src, "alt": alt });
					}
				}
			}
			sendItems(items, url);
			return;
		}

		if (href.match(GLOBAL_E_PAGE_REGEX)) {
			url = getGlobalEMerchant();
			items.push({ "src": "", "alt": "" });
			sendItems(items, url);
			return;
		}

		if (href.includes("supremenewyork.com/checkout") || href.match(GOOGLE_FORM_REGEX)) {
			items.push({ "src": "", "alt": "" });
			sendItems(items, url);
			return;
		}

		if (href.includes("js.stripe.com/v3/elements-inner-card")) {
			items.push({ "src": "", "alt": "" });
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