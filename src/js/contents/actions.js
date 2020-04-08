

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
	// console.log('[starting] ?', result) // && result.data.activation
	if (result.updated && result.data && result.data.profile) {
		setInterval(function () {
			autofill_count++;
			startAutoFill(result);
		},
			DURATION * 10
		);
		setTimeout(function () {
			setInterval(function () {
				// click event
				if (result.data && result.data.options && result.data.options.autoCheckout && result.data.options.autoCheckout === true)
					processCheckout(result);
			}, DURATION);
		}, DURATION * 20);

	}
});

function startAutoFill(result) {
	if (isDocumentLoadingComplete()) {
		operationAfterDocLoaded(result);
	}
}

function operationAfterDocLoaded(result) {
	operateTextBoxByType(result, "input");
	operateTextBoxByType(result, "textarea");
	operateSelect(result);
}

function operateTextBoxByType(result, tagName) {
	for (var input of document.getElementsByTagName(tagName)) {
		operateSingleInputElement(input, result);
	}
}

function operateSelect(result) {
	for (var input of document.getElementsByTagName("select")) {
		if (validElement(input) || href.includes("pci-connect.square")) {
			if (elements.includes(input)) {
				continue;
			}

			if (operateSelectWithPattern(getNameofSelect(input), input, result)) {
				postProcess(input);
				continue;
			}

			var ac = getVal(input.getAttribute("autocomplete"));
			if (ac) {
				var address = result.data.profile.bill;
				if (result.data.profile.ship && ac.includes("shipping")) {
					address = result.data.profile.ship;
				}

				if (operateSelectAutoComplete(ac, "country", input, address.country) ||
					operateSelectAutoComplete(ac, "address-level1", input, address.province)) {
					postProcess(input);
					continue;
				}
			}

			if (operateSelectWithPattern(getLabelText(input), input, result)) {
				postProcess(input);
				continue;
			}

			if (operateSelectWithPattern(getVal(input.id), input, result)) {
				postProcess(input);
				continue;
			}
		}
	}
}

function processCheckout(result) {
	for (let button of document.querySelectorAll('button')) {
		attemptCheckout(button, result.data.mode);
	}
	for (let submit of document.querySelectorAll('input[type="submit"]')) {
		attemptCheckout(submit, result.data.mode);
	}
}

function operateInputWIthDispatch(elem, value, mode) {
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

function operateInputWithName(regex, name, elem, value, mode) {
	if (name.match(regex)) {
		return operateInputWIthDispatch(elem, value, mode);
	}
	return false;
}

function operateSelectWithName(regex, name, elem, value, isNumeric) {
	if (name.match(regex)) {
		return setSelectValue(elem, value, isNumeric);
	}
	return false;
}

function operateInputAutoComplete(ac, attribute, elem, value, mode) {
	if (ac === attribute || ac.includes(attribute)) {
		return operateInputWIthDispatch(elem, value, mode);
	}
	return false;
}

function operateSelectAutoComplete(ac, attribute, elem, value) {
	if (ac === attribute || ac.includes(attribute)) {
		return setSelectValue(elem, value, false);
	}
	return false;
}

function operateAutoCompleteWIthNameAndEmail(ac, input, email, address, mode) {
	return operateInputAutoComplete(ac, "email", input, email, mode) ||
		operateInputAutoComplete(ac, "given-name", input, address.fName, mode) ||
		operateInputAutoComplete(ac, "family-name", input, address.lName, mode) ||
		operateInputAutoComplete(ac, "name", input, address.fName + " " + address.lName, mode) ||
		operateInputAutoComplete(ac, "cc-name", input, address.fName + " " + address.lName, mode);
}

function operateAuthCompleteCard(ac, input, card, mode) {
	return operateInputAutoComplete(ac, "cc-number", input, card.number, mode) ||
		operateInputAutoComplete(ac, "cc-exp-month", input, card.expMonth, mode) ||
		operateInputAutoComplete(ac, "cc-exp-year", input, card.expYear, mode) ||
		operateInputAutoComplete(ac, "cc-exp", input, card.expMonth + " / " + card.expYear.substring(2, 4), mode) ||
		operateInputAutoComplete(ac, "cc-csc", input, card.cvv, mode);
}

function operateRegexNameAndEmail(name, input, result, address, mode) {
	return operateInputWithName(PATTERN_FULL_NAME, name, input, address.fName + " " + address.lName, mode) ||
		operateInputWithName(PATTERN_FIRST_NAME, name, input, address.fName, mode) ||
		operateInputWithName(PATTERN_LAST_NAME, name, input, address.lName, mode) ||
		operateInputWithName(PATTERN_EMAIL, name, input, result.data.profile.email, mode);
}

function operateCardWithParttern(name, input, card, mode) {
	return operateInputWithName(PATTERN_CARD_NUMBER, name, input, card.number, mode) ||
		operateInputWithName(PATTERN_CARD_EXP_MONTH, name, input, card.expMonth, mode) ||
		operateInputWithName(PATTERN_CARD_EXP_YEAR, name, input, card.expYear, mode) ||
		operateInputWithName(PATTERN_CARD_EXP_DATE, name, input, card.expMonth + card.expYear.substring(2, 4), mode) ||
		operateInputWithName(PATTERN_CARD_EXP_DATE_MMYY, name, input, card.expMonth + "/" + card.expYear.substring(2, 4), mode) ||
		operateInputWithName(PATTERN_CARD_EXP_DATE_MM, name, input, card.expMonth, mode) ||
		operateInputWithName(PATTERN_CARD_EXP_DATE_YY, name, input, card.expYear.substring(2, 4), mode) ||
		operateInputWithName(PATTERN_CARD_EXP_DATE_YYYY, name, input, card.expYear, mode) ||
		operateInputWithName(PATTERN_CARD_CVV, name, input, card.cvv, mode);
}

function operateCheckboxWithPattern(name, input) {
	return operateCheckboxOrRadio(PATTERN_CHECKBOX, name, input);
}

function operateCheckboxOrRadio(regex, name, input) {
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


function getNameofSelect(input) {
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

function compareWithPatterns(name, input, result) {
	if (name === undefined || name === null || name === "") {
		return false;
	}

	var address = getAddress(name, result);
	var mode = getMode(result.data.mode);

	return operateRegexNameAndEmail(name, input, result, address, mode) ||
		operateInputWithName(PATTERN_ADDRESS_2, name, input, address.address2, mode) ||
		operateInputWithName(PATTERN_ADDRESS_1, name, input, address.address1, mode) ||
		operateInputWithName(PATTERN_CITY, name, input, address.city, mode) ||
		operateInputWithName(PATTERN_STATE, name, input, address.province ? address.province.split("/")[0] : "", mode) ||
		operateInputWithName(PATTERN_ZIP, name, input, address.zip, mode) ||
		operateInputWithName(PATTERN_PHONE, name, input, address.phone, mode) ||
		operateInputWithName(PATTERN_DISCOUNT_CODE, name, input, result.data.discount, mode) ||
		operateCardWithParttern(name, input, result.data.profile.card, mode) ||
		operateCheckboxWithPattern(name, input) ||
		operateCardWithParttern(name, input, result.data.profile.card, mode) ||
		operateCustomsWithPattern(name, input, result, mode) ||
		(isShopifyCheckoutPages() && result.data.profile.ship && operateCheckboxOrRadio(PATTERN_DIFFERENT_BILLING_ADDRESS, name, input));
}

function operateCustomsWithPattern(name, elem, result, mode) {
	if (result.data.customs) {
		for (var custom of result.data.customs) {
			if (matchKeyword(name.toLowerCase(), custom.keyword.toLowerCase())) {
				return operateInputWIthDispatch(elem, custom.value, mode);
			}
		}
	}
	return false;
}

function operateSelectWithPattern(name, input, result) {
	if (name === undefined || name === null || name === "") {
		return false;
	}

	var address = getAddress(name, result);

	return operateSelectWithName(PATTERN_STATE, name, input, address.province, false) ||
		operateSelectWithName(PATTERN_COUNTRY, name, input, address.country, false) ||
		operateSelectWithName(PATTERN_CARD_EXP_MONTH, name, input, result.data.profile.card.expMonth, true) ||
		operateSelectWithName(PATTERN_CARD_EXP_YEAR, name, input, result.data.profile.card.expYear, true) ||
		operateSelectWithName(PATTERN_CARD_EXP_YEAR, name, input, result.data.profile.card.expYear.substring(2, 4), true) ||
		operateSelectWithName(PATTERN_CARD_TYPE, name, input, (result.data.profile.card.number), false);
}

function operateSingleInputElement(input, result) {
	if (validElement(input) || href.includes("pci-connect.square")) {
		if (elements.includes(input)) {
			return;
		}

		if (compareWithPatterns(getAttr(input, "data-auto-id"), input, result)) {
			postProcess(input);
			return;
		}

		var ac = getVal(input.getAttribute("autocomplete"));
		if (ac) {
			var address = getAddress(ac, result);
			var mode = getMode(result.data.mode);

			if (operateAutoCompleteWIthNameAndEmail(ac, input, result.data.profile.email, address, mode) ||
				operateInputAutoComplete(ac, "street-address", input, address.address1 + " " + address.address2, mode) ||
				operateInputAutoComplete(ac, "address-line1", input, address.address1, mode) ||
				operateInputAutoComplete(ac, "address-line2", input, address.address2, mode) ||
				operateInputAutoComplete(ac, "country", input, address.country, mode) ||
				operateInputAutoComplete(ac, "address-level1", input, address.province, mode) ||
				operateInputAutoComplete(ac, "address-level2", input, address.city, mode) ||
				operateInputAutoComplete(ac, "postal-code", input, address.zip, mode) ||
				operateInputAutoComplete(ac, "tel", input, address.phone, mode) ||
				operateAuthCompleteCard(ac, input, result.data.profile.card, mode)) {
				postProcess(input);
				return;
			}
		}

		if (compareWithPatterns(getLabelText(input), input, result)) {
			postProcess(input);
			return;
		}

		if (compareWithPatterns(getVal(input.name), input, result)) {
			postProcess(input);
			return;
		}

		if (compareWithPatterns(getValCustomSite(input.placeholder), input, result)) {
			postProcess(input);
			return;
		}

		if (compareWithPatterns(getVal(input.id), input, result) || compareWithPatterns(input.getAttribute("data-checkout"), input, result) || processMath(REGEX_MATH, getLabelText(input), input, mode)) {
			postProcess(input);
			return;
		}

		var text = decodeHTML(input.getAttribute("aria-label"));
		if (href.includes("docs.google.com/forms") && (compareWithPatterns(text, input, result) || processMath(REGEX_MATH, text, input, mode))) {
			postProcess(input);
			return;
		}
	}
}

function messageItemsToBackground(items, url) {
	if (items.length > 0) {
		chrome.extension.sendMessage({
			msgType: "items",
			items: items,
			url: url
		});
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
	operateSingleInputElement(evt.target, result);
}

function processMath(regex, name, input, mode) {
	var m = name.replace(/\s/, "").match(regex);

	if (m) {
		try {
			var val = eval(m[0].replace(/x/, "*").replace(/\[/, "(").replace(/\]/, ")").replace(/\{/, "(").replace(/\}/, ")").replace(/\=/, "").replace(/\?/, ""));
			if (val) {
				return operateInputWIthDispatch(input, getVal(new String(val)), mode);
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
				messageItemsToBackground(items, url);
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
				messageItemsToBackground(items, url);
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
			messageItemsToBackground(items, url);
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
			messageItemsToBackground(items, url);
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
			messageItemsToBackground(items, url);
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
			messageItemsToBackground(items, url);
			return;
		}

		if (href.match(GLOBAL_E_PAGE_REGEX)) {
			url = getGlobalEMerchant();
			items.push({ "src": "", "alt": "" });
			messageItemsToBackground(items, url);
			return;
		}

		if (href.includes("supremenewyork.com/checkout") || href.match(GOOGLE_FORM_REGEX)) {
			items.push({ "src": "", "alt": "" });
			messageItemsToBackground(items, url);
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

function decodeHTML(text) {
	var textArea = document.createElement("textarea");
	textArea.innerHTML = text;
	return textArea.value;
}

function getMode(mode) {
	return mode;
}