const BASE_LOCALE = "ko-KR";
const BASE_OPTIONS = {
  timeZone: "Asia/Seoul",
  hour12: false,
};

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildParts(date, options) {
  const formatter = new Intl.DateTimeFormat(BASE_LOCALE, {
    ...BASE_OPTIONS,
    ...options,
  });
  const entries = formatter
    .formatToParts(date)
    .filter((item) => item.type !== "literal");
  return entries.reduce((acc, item) => {
    acc[item.type] = item.value;
    return acc;
  }, {});
}

export function formatKST(value, options = {}) {
  const date = toDate(value);
  if (!date) return "-";
  const parts = buildParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatKSTDate(value, options = {}) {
  const date = toDate(value);
  if (!date) return "-";
  const parts = buildParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options,
  });
  return `${parts.year}.${parts.month}.${parts.day}`;
}

export function formatKSTTime(value, options = {}) {
  const date = toDate(value);
  if (!date) return "-";
  const parts = buildParts(date, {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
  return `${parts.hour}:${parts.minute}`;
}
