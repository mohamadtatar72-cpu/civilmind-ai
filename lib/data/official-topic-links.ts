const officialTopicLinks: Record<number, string> = {
  1: "https://inbr.ir/wp-content/uploads/2016/08/mabhas-1.pdf",
  2: "https://inbr.ir/wp-content/uploads/2016/08/mabhas-2.pdf",
  3: "https://inbr.ir/?p=5814",
  4: "https://inbr.ir/upload/mabhas/mabhas4-96.pdf",
  5: "https://inbr.ir/?p=5653",
  6: "https://inbr.ir/?p=5665",
  7: "https://inbr.ir/upload/mabhas/mabhas-7-1401-05.pdf",
  8: "https://inbr.ir/upload/mabhas/mabhas8-981.pdf",
  9: "https://inbr.ir/?p=5789",
  10: "https://inbr.ir/?p=5793",
  11: "https://inbr.ir/upload/mabhas/mabhas11-1401-05.pdf",
  12: "https://inbr.ir/?p=6380",
  13: "https://inbr.ir/?p=5671",
  14: "https://inbr.ir/?p=5677",
  15: "https://inbr.ir/wp-content/uploads/2016/08/mabhas-15.pdf",
  16: "https://inbr.ir/?p=5817",
  17: "https://inbr.ir/?p=6070",
  18: "https://inbr.ir/?p=5756",
  19: "https://inbr.ir/?p=5798",
  20: "https://inbr.ir/?p=5760",
  21: "https://inbr.ir/?p=5820",
  22: "https://inbr.ir/wp-content/uploads/2016/08/mabhas-22.pdf",
  23: "https://inbr.ir/upload/mabhas/mabhas-23.pdf",
  24: "https://inbr.ir/wp-content/uploads/2026/05/mabhas24-3.pdf",
};

export function getOfficialTopicLink(
  code: number,
  configuredUrl?: string,
  fallbackUrl?: string,
) {
  return configuredUrl ?? officialTopicLinks[code] ?? fallbackUrl;
}
