import * as Cheerio from "cheerio";

/** Supported currencies */
type Currency = "GBP" | "USD" | "EUR";

/**
 * Return MNB price of a currency on a specific date.
 *
 * @param {text} currency The currency (GBP, EUR, USD, etc.).
 * @param {date} dateStr The currency value in HUF on this date.
 * @return MNB price of a currency on the  date
 * @customfunction
 */
const MNB = (currency: Currency = "GBP", dateStr: string = "2021.04.18.") => {
  // console.log(`Input currency: ${currency}, date: ${dateStr}`);

  // https://www.mnb.hu/arfolyam-tablazat?query=daily,2023.02.14.
  return readMNBPrice(
    currency,
    `https://www.mnb.hu/arfolyam-tablazat?query=daily,${adjustDate(dateStr)}`
  );
};

/**
 * Adjust date to previous Friday if it was weekend
 */
const adjustDate = (dateStr: string) => {
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

const readMNBPrice = (currency: Currency, url: string): number => {
  const resp = UrlFetchApp.fetch(url).getContentText();
  const $ = Cheerio.load(resp);
  const currencyPrice = convertNumber($(priceSelector(currency)).text());

  // console.log(`Output price: ${currencyPrice} (414.50 ${currency})`);

  return currencyPrice;
};

/**
 * Courtesy: https://tutorial.eyehunts.com/js/locale-string-to-number-javascript-example-code/
 */
const convertNumber = (numStr: string, locale = "hu-HU") => {
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
const priceSelector = (currency: Currency) => {
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
      assertUnreachable(currency);
  }
  return `#main > div > div > table > tbody > tr > td:nth-child(${index})`;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Statement should be unreachable! Uncovered case ${value}`);
};
