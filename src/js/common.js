

var EVENT_PARAMS = { bubbles: true };
const GLOBAL_E_GET_MERCHANT_REGEX = new RegExp("redToMerchantURL\\s+:\\s+\"(.+?)\"", "i");


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
