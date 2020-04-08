
const PATTERN_ADDRESS_1 = new RegExp("^address$|address[_-]?line(one)?|address1|addr1|street", "i");
const PATTERN_ADDRESS_2 = new RegExp("address[_-]?line(2|two)|address.?2|addr2|street.?(?:#|no|num|nr)|suite|unit", "i");
const PATTERN_CARD_CVV = new RegExp(
    "verification|card.?identification|security.?code|card.?code"
    + "|security.?value"
    + "|security.?number|card.?pin|c-v-v"
    + "|(cvn|cvv|cvc|csc|cvd|cid|ccv)(field)?"
    + "|\\bcid\\b", "i");
const PATTERN_CARD_EXP_DATE = new RegExp("expir|exp.*date|^expfield$", "i");
const PATTERN_CARD_EXP_DATE_MM = new RegExp("^\\s*MM\\s*$", "i");
const PATTERN_CARD_EXP_DATE_MMYY = new RegExp("^\\s*MM\\s*/\\s*YY\\s*$", "i");
const PATTERN_CARD_EXP_DATE_YY = new RegExp("^\\s*YY\\s*$", "i");
const PATTERN_CARD_EXP_DATE_YYYY = new RegExp("^\\s*YYYY\\s*$", "i");
const PATTERN_CARD_EXP_MONTH = new RegExp("exp.*mo|ccmonth|card.?month|addmonth", "i");
const PATTERN_CARD_EXP_YEAR = new RegExp("(?:exp|payment|card).*(?:year|yr)", "i");
const PATTERN_CARD_NAME = new RegExp("card.?(?:holder|owner)|name.*(\\b)?on(\\b)?.*card", "i");
const PATTERN_CARD_NUMBER = new RegExp("(add)?(?:card|cc|acct).?(?:number|#|no|num|field)|carn|credit.*?card.*?cnb", "i");
const PATTERN_CARD_TYPE = new RegExp("(credit)?card.*type", "i");
const PATTERN_CHECKBOX = new RegExp("(order)?.*?terms|(?:agree|consent).*?(checkbox)?", "i");
const PATTERN_CITY = new RegExp("city|town", "i");
const PATTERN_COUNTRY = new RegExp("country|countries", "i");
const PATTERN_DISCORD_TAG = new RegExp("discord.*?(tag)?", "i");
const PATTERN_EMAIL = new RegExp("e.?mail|google\\s+account|gmail", "i");
const PATTERN_FIRST_NAME = new RegExp("first.*name|initials|fname|first$|given.*name", "i");
const PATTERN_FULL_NAME = new RegExp("^name|full.?name|your.?name|customer.?name|bill.?name|ship.?name" + "|name.*first.*last|firstandlastname" , "i");
const PATTERN_LAST_NAME = new RegExp("last.*name|lname|surname|last$|secondname|family.*name", "i");
const PATTERN_PHONE = new RegExp("phone|mobile|contact.?number|tel", "i");
const PATTERN_STATE = new RegExp("(?<!(united|hist|history).?)state|county|region|province", "i");
const PATTERN_TO_CHECKOUT = new RegExp("continue.*?shipping|continue.*?button|pay.*?|donat.*?|complete.*?order|continue.*?payment", "i");
const PATTERN_ZIP = new RegExp("zip|postal|post.*code|pcode", "i");

var REGEX_MATH = new RegExp("[\\d\\.\\[\\]\\(\\)\\{\\}\\-\\+\\*\\/x\\s\\?\\=]+", "i");

var ADIDAS_YS_PAYMENT_PAGE_REGEX = new RegExp("^https?://(?:www.)?(?:adidas|yeezysupply).+?/(?:delivery|payment|COShipping-Show|COSummary2-Start).*", "i");
var OFFWHITE_PAYMENT_PAGE_REGEX = new RegExp("^https?://(?:www.)?off---white.com/.+?/checkout/payment.*", "i");
var FOOTSITE_PAYMENT_PAGE_REGEX = new RegExp("^https?://(?:www.)?(?:footlocker|champssports|footaction|eastbay).+?/checkout.*", "i");
var FOOTSITE_EU_REGEX = new RegExp("^https?://(?:www.)?(?:footlocker).+?/INTERSHOP.*", "i");
var GLOBAL_E_PAGE_REGEX = new RegExp("^https?://webservices.global-e.com/Checkout/v2/.*", "i");
var GOOGLE_FORM_REGEX = new RegExp("^https?://docs.google.com/forms/.*?/viewform", "i");
var ADD_LISTENER = "addListener";
var DURATION = 25;
var MAP_CARD_TYPE = new Map();
var AUTO_FILL_ICON = "https://i.imgur.com/dI7i9Wl.png";

MAP_CARD_TYPE.set(new RegExp("^4"), "Visa");
MAP_CARD_TYPE.set(new RegExp("^5[1-5]"), "Mastercard");
MAP_CARD_TYPE.set(new RegExp("^3[47]"), "American Express");
MAP_CARD_TYPE.set(new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)"), "Discover");
MAP_CARD_TYPE.set(new RegExp("^36"), "Diners");
MAP_CARD_TYPE.set(new RegExp("^30[0-5]"), "Diners - Carte Blanche");
MAP_CARD_TYPE.set(new RegExp("^35(2[89]|[3-8][0-9])"), "JCB");
MAP_CARD_TYPE.set(new RegExp("^(4026|417500|4508|4844|491(3|7))"), "Visa Electron");