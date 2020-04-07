

const API_ENDPOINT = "https://www.restockintel.com/api/v1";
const API_KEY = 'ak_ihs5TCJ8TX6FXCrxMf5d';
var EVENT_PARAMS = { bubbles: true };
const GLOBAL_E_GET_MERCHANT_REGEX = new RegExp("redToMerchantURL\\s+:\\s+\"(.+?)\"", "i");

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
        xhttp.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
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
        xhttp.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
        xhttp.send();
    })
}

function getGlobalEMerchant() {
    var html = document.getElementsByTagName("html")[0];
    if (html && html.innerHTML) {
        var m = html.innerHTML.match(GLOBAL_E_GET_MERCHANT_REGEX);
        if (m) {
            // debugger;
            // console.log('match', m);
            return m[1];
        }
    }
    return "https://webservices.global-e.com";
}

function getValue(value) {
    if (value) {
        return value.trim().toLowerCase().replace(/\s+/, " ");;
    }
    return "";
}

function authURL(url) {
    return API_ENDPOINT + url;
}

function dispatchChangeEvent(elem) {
    if (elem) {
        dispatchEvent(elem, EVENT_PARAMS, "change");
    }
}

function storeActivationInfo(info, callback = null) {
    chrome.storage.local.get(["data"], function (store) {
        console.log('[Activation] loaded', store);
        if (store && store.data) {
            store.data.activation = info;
            chrome.storage.local.set({ data: store.data }, function () {
                console.log('[Activation] saved', store);
                if (callback && typeof callback === 'function') callback();
            });
        }
    })
}

function dispatchEvent(elem, params, type) {
    if (typeof elem.dispatchEvent === "function") {
        elem.dispatchEvent(new Event(type, params));
    }
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
	if (elem && elem.value) {
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

	return getValue(value);
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
		dispatchEvent(elem, EVENT_PARAMS, "input");
	}
}
