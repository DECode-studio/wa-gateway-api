const idrMoney = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  maximumFractionDigits: 0,
});

const decMoney = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 0,
});

const idrMoneyCompact = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 2,
});

const millionNominal = 1_000_000;
const billionNominal = 1_000_000_000;

export const moneyFormatter = (amount: number): string => {
  return `IDR ${idrMoney.format(amount)}`;
};

export const moneyFormatterCompact = (amount: number): string => {
  if (amount > billionNominal) {
    return `IDR ${idrMoney.format(amount / billionNominal)} B`;
  } else if (amount > millionNominal) {
    return `IDR ${idrMoney.format(amount / millionNominal)} M`;
  } else {
    return `IDR ${idrMoney.format(amount)}`;
  }
};

export const moneyFormatterIntl = (amount: number): string => {
  return idrMoneyCompact.format(amount);
};

export const customMoneyFormatter = (
  amount: number,
  currency: string = ''
) => {
  return `${Number(amount.toFixed(5)).toLocaleString("en-US")} ${currency}`
}
