/*

Source: https://cs.chromium.org/chromium/src/components/autofill/core/common/autofill_REGEX_NAME_constants.cc?g=0

*/
const REGEX_NAME_FULL_NAME = new RegExp(
    "^name|full.?name|your.?name|customer.?name|bill.?name|ship.?name"
    + "|name.*first.*last|firstandlastname" , "i");
const REGEX_NAME_FIRST_NAME = new RegExp(
	"first.*name|initials|fname|first$|given.*name", "i");
const REGEX_NAME_LAST_NAME = new RegExp(
	"last.*name|lname|surname|last$|secondname|family.*name", "i");
const REGEX_NAME_ADDRESS_1 = new RegExp(
    "^address$|address[_-]?line(one)?|address1|addr1|street", "i");
const REGEX_NAME_ADDRESS_2 = new RegExp(
	"address[_-]?line(2|two)|address.?2|addr2|street.?(?:#|no|num|nr)|suite|unit", "i");
const REGEX_NAME_CITY = new RegExp(
	"city|town", "i");
const REGEX_NAME_STATE = new RegExp(
    "(?<!(united|hist|history).?)state|county|region|province", "i");
const REGEX_NAME_COUNTRY = new RegExp(
    "country|countries", "i");
const REGEX_NAME_ZIP = new RegExp(
    "zip|postal|post.*code|pcode", "i");
const REGEX_NAME_EMAIL = new RegExp(
	"e.?mail|google\\s+account|gmail", "i");
const REGEX_NAME_PHONE = new RegExp(
    "phone|mobile|contact.?number|tel", "i");
const REGEX_NAME_CARD_NAME = new RegExp(
    "card.?(?:holder|owner)|name.*(\\b)?on(\\b)?.*card", "i");
const REGEX_NAME_CARD_NUMBER = new RegExp(
    "(add)?(?:card|cc|acct).?(?:number|#|no|num|field)|carn|credit.*?card.*?cnb", "i");
const REGEX_NAME_CARD_CVV = new RegExp(
    "verification|card.?identification|security.?code|card.?code"
    + "|security.?value"
    + "|security.?number|card.?pin|c-v-v"
    + "|(cvn|cvv|cvc|csc|cvd|cid|ccv)(field)?"
    + "|\\bcid\\b", "i");
const REGEX_NAME_CARD_EXP_MONTH = new RegExp(
    "exp.*mo|ccmonth|card.?month|addmonth", "i");
const REGEX_NAME_CARD_EXP_YEAR = new RegExp(
    "(?:exp|payment|card).*(?:year|yr)", "i");
const REGEX_NAME_CARD_TYPE = new RegExp(
    "(credit)?card.*type", "i");
const REGEX_NAME_CARD_EXP_DATE = new RegExp(
    "expir|exp.*date|^expfield$", "i");
const REGEX_NAME_CARD_EXP_DATE_MMYY = new RegExp(
    "^\\s*MM\\s*/\\s*YY\\s*$"
, "i");
const REGEX_NAME_CARD_EXP_DATE_MM = new RegExp(
    "^\\s*MM\\s*$"
, "i");
const REGEX_NAME_CARD_EXP_DATE_YY = new RegExp(
    "^\\s*YY\\s*$"
, "i");
const REGEX_NAME_CARD_EXP_DATE_YYYY = new RegExp(
    "^\\s*YYYY\\s*$"
, "i");
const REGEX_NAME_DISCORD_TAG = new RegExp(
    "discord.*?(tag)?"
, "i");
const REGEX_NAME_TWITTER_HANDLE = new RegExp(
    "twitter.*?handle"
, "i");
const REGEX_NAME_DISCOUNT_CODE = new RegExp(
    "(?:discount|coupon|promo).*?code"
, "i");
const REGEX_NAME_CHECKBOX = new RegExp(
    "(order)?.*?terms|(?:agree|consent).*?(checkbox)?"
, "i");
const REGEX_NAME_DIFFERENT_BILLING_ADDRESS = new RegExp(
    "different.*?billing.*?address"
, "i");
var REGEX_MATH = new RegExp(
    "[\\d\\.\\[\\]\\(\\)\\{\\}\\-\\+\\*\\/x\\s\\?\\=]+"
, "i");
const REGEX_NAME_TO_CHECKOUT = new RegExp(
    "continue.*?shipping|continue.*?button|pay.*?|donat.*?|complete.*?order|continue.*?payment"
, "i");
