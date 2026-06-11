// server/utils/generatePDF.js

const generatePDF = async ({ html } = {}) => {
  // Placeholder utility: integrate pdf-lib/puppeteer later.
  return Buffer.from(html || "", "utf-8");
};

module.exports = generatePDF;

