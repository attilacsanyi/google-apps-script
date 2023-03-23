import * as Cheerio from "cheerio";

/** Supported currencies */
type Currency = "GBP" | "USD" | "EUR";

const cacheTimeoutInSec = 5 * 60; // 5 min

/**
 * Gets a cache that is common to all users of the script.
 * Docs: https://developers.google.com/apps-script/reference/cache/cache-service?hl=en
 */
const getCache_ = () => CacheService.getScriptCache();
/**
 * Return MNB price of a currency on a specific date.
 *
 * @param {text} currency The currency (GBP, EUR, USD, etc.).
 * @param {date} dateStr The currency value in HUF on this date.
 * @return MNB price of a currency on the  date
 * @customfunction
 */
const mnb = (currency: Currency = "GBP", dateStr: string = "2021.04.18.") => {
  // console.log(`Input currency: ${currency}, date: ${dateStr}`);

  // https://www.mnb.hu/arfolyam-tablazat?query=daily,2023.02.14.
  return readMNBPrice_(
    currency,
    `https://www.mnb.hu/arfolyam-tablazat?query=daily,${adjustDate_(dateStr)}`
  );
};

/**
 * Return the price of a given crypto
 *
 * @param {text} crypto The cryptocurrency long name (Bitcoin, Medieval Empires, etc.).
 * @return Current Coinmarketcap price of a crypto
 * @customfunction
 */
const crypto = (crypto = "bitcoin"): number => {
  let cryptoPrice: number = -1;
  // console.log(`Input crypto: ${crypto}`);
  const hyphenedName = crypto.trim().replace(/\s/g, "-");

  const cryptoCacheKey = `${hyphenedName.toLowerCase()}`;

  const cachedPrice = getCache_().get(cryptoCacheKey);

  if (cachedPrice) {
    cryptoPrice = convertNumber_(cachedPrice);
  } else {
    // https://coinmarketcap.com/currencies/bitcoin/
    const freshPrice = readCryptoPrice_(
      `https://coinmarketcap.com/currencies/${hyphenedName}`
    );

    cryptoPrice = freshPrice;
    getCache_().put(cryptoCacheKey, `${freshPrice}`, cacheTimeoutInSec);
  }

  return cryptoPrice;
};

/**
 * Adjust date to previous Friday if it was weekend
 */
const adjustDate_ = (dateStr: string) => {
  let date = new Date(dateStr);
  // console.log(`Day: ${date.getDay()}`);
  let offset = 0;

  // If Saturday, set to Friday
  if (date.getDay() === 6) offset = 1;

  // If Sunday, set to Friday
  if (date.getDay() === 0) offset = 2;

  date.setDate(date.getDate() - offset);

  const adjustedDate = `${date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })}`.replace(/ /g, "");

  // console.log(`Adjusted date: ${adjustedDate}`);

  return adjustedDate;
};

const readMNBPrice_ = (currency: Currency, url: string): number => {
  const $ = cheerioLoad_(url);
  const currencyPrice = convertNumber_(
    $(priceSelector_(currency)).text(),
    "hu-HU"
  );

  // console.log(`Output price: ${currencyPrice} (414.50 ${currency})`);

  return currencyPrice;
};

const readCryptoPrice_ = (url: string): number => {
  const $ = cheerioLoad_(url);
  const cryptoPrice = convertNumber_(
    $(".priceSection > .priceTitle > .priceValue > span").text()
  );

  // console.log(`Crypto price: ${cryptoPrice}`);

  return cryptoPrice;
};

/**
 * Courtesy: https://tutorial.eyehunts.com/js/locale-string-to-number-javascript-example-code/
 */
const convertNumber_ = (numStr: string, locale = "en-US") => {
  const { format } = new Intl.NumberFormat(locale);
  const match = /^0(.)1$/.exec(format(0.1));
  if (match) {
    const [, decimalSign] = match;
    return +numStr
      .replace(new RegExp(`[^${decimalSign}\\d]`, "g"), "")
      .replace(decimalSign, ".");
  } else throw new Error("Error during converting number.");
};

/**
 * Provide price CSS selector based on given currency
 */
const priceSelector_ = (currency: Currency) => {
  let index = 0;
  switch (currency) {
    case "GBP":
      index = 24;
      break;
    case "USD":
      index = 71;
      break;
    case "EUR":
      index = 21;
      break;
    default:
      assertUnreachable_(currency);
  }
  return `#main > div > div > table > tbody > tr > td:nth-child(${index})`;
};

/**
 * Load url with Cheerio
 */
const cheerioLoad_ = (url: string) =>
  Cheerio.load(UrlFetchApp.fetch(url).getContentText());

const assertUnreachable_ = (value: never): never => {
  throw new Error(`Statement should be unreachable! Uncovered case ${value}`);
};
