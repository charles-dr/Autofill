

var EVENT_PARAMS = { bubbles: true };
const GLOBAL_E_GET_MERCHANT_REGEX = new RegExp("redToMerchantURL\\s+:\\s+\"(.+?)\"", "i");
const API_ENDPOINT = "https://www.restockintel.com/api/v1";
const API_KEY = 'ak_ihs5TCJ8TX6FXCrxMf5d';

function getGlobalEMerchant() {
    var html = document.getElementsByTagName("html")[0];
    if (html && html.innerHTML) {
        var m = html.innerHTML.match(GLOBAL_E_GET_MERCHANT_REGEX);
        if (m) {
            debugger;
            console.log('match', m);
            return m[1];
        }
    }
    return "https://webservices.global-e.com";
}

function getVal(value) {
    if (value) {
        return value.trim().toLowerCase().replace(/\s+/, " ");;
    }
    return "";
}

function dispatchChangeEvent(elem) {
    if (elem) {
        dispatchEvent(elem, EVENT_PARAMS, "change");
    }
}

function dispatchEvent(elem, params, type) {
    if (typeof elem.dispatchEvent === "function") {
        elem.dispatchEvent(new Event(type, params));
    }
}

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

function authURL(url) {
    return API_ENDPOINT + url;
}

function storeActivationInfo(info, callback = null) {
    chrome.storage.local.get(["data"], function (store) { console.log('[Activation] loaded', store);
        if (store && store.data) {
            store.data.activation = info; 
            chrome.storage.local.set({data: store.data}, function() {
                console.log('[Activation] saved', store);
                if (callback && typeof callback === 'function') callback();
            });
        }
    })
}

function unauthorizeUser(callback = null) {
    chrome.storage.local.get(['data'], function(store) { 
        if (store && store.data) {
            store.data.activation = null;
            chrome.storage.local.set({data: store.data}), function() {
                console.log('Unauthorized!');
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        }
    });
}

