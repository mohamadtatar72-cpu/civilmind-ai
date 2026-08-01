// @ts-check

/**
 * Manually verified transcription from the official INBR Civil execution exam
 * booklet 215A, Khordad 1404. The question is on PDF page 2 and its official
 * answer key is on PDF page 13.
 */
export const VERIFIED_KHORDAD_1404_QUESTION = Object.freeze({
  archiveKey: "inbr-khordad-1404",
  bookletTitle: "دفترچه سؤال و کلید رسمی عمران (اجرا)",
  sourceUrl:
    "https://inbr.ir/wp-content/uploads/2025/07/عمران-اجرا-خرداد-1404-3.pdf",
  officialAnswerSourceUrl:
    "https://inbr.ir/wp-content/uploads/2025/07/عمران-اجرا-خرداد-1404-3.pdf#page=13",
  questionNumber: 1,
  discipline: "عمران",
  qualification: "اجرا",
  topicCode: 19,
  topicTitle: "مبحث ۱۹ - صرفه‌جویی در مصرف انرژی",
  sourcePage: 2,
  sourceEdition: "خرداد ۱۴۰۴ · دفترچه ۲۱۵A",
  stem: "درخصوص سایبان پنجره‌ها برای یک ساختمان واقع در خرمشهر، کدام گزینه صحیح نیست؟",
  options: Object.freeze([
    "برای پنجره‌های در جهت جنوب، استفاده از هر دو سایبان افقی و عمودی الزامی است.",
    "برای پنجره‌های در جهت شرق، باید از سایبان عمودی با زاویه ۳۷ درجه استفاده شود.",
    "برای پنجره‌های در جهت شمال، سایبان عمودی فقط در سمت غرب پنجره قرار گیرد.",
    "برای پنجره‌های در جهت غرب، باید از سایبان عمودی متحرک مقابل تمام پنجره استفاده شود.",
  ]),
  officialCorrectIndex: 1,
  analysisStatus: "reviewed",
});

/**
 * @param {{
 *   stem?: string;
 *   options?: readonly string[];
 *   officialCorrectIndex?: number;
 *   analysisStatus?: "pending" | "reviewed";
 * }} record
 */
export function isVerifiedOfficialQuestionReady(record) {
  const correctIndex = record.officialCorrectIndex;
  return Boolean(
    record.analysisStatus === "reviewed" &&
      record.stem?.trim() &&
      record.options &&
      record.options.length >= 2 &&
      record.options.every((option) => option.trim().length > 0) &&
      Number.isInteger(correctIndex) &&
      correctIndex !== undefined &&
      correctIndex >= 0 &&
      correctIndex < record.options.length,
  );
}
