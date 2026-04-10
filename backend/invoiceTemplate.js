function numberToWords(amount) {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertHundreds(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertHundreds(n % 100) : "");
  }

  if (amount === 0) return "Zero Only";
  const intPart = Math.floor(amount);
  let result = "";
  if (intPart >= 100000) {
    result += convertHundreds(Math.floor(intPart / 100000)) + " Lakh ";
    result += intPart % 100000 > 0 ? convertHundreds(Math.floor((intPart % 100000) / 1000)) + " Thousand " : "";
  } else if (intPart >= 1000) {
    result += convertHundreds(Math.floor(intPart / 1000)) + " Thousand ";
  }
  result += convertHundreds(intPart % 1000);
  return result.trim() + " Only";
}

function generateInvoiceHTML(data) {
  const {
    quotationNo = "",
    quotationDate = "",
    buyerOrderNo = "",
    orderDate = "Oral",
    termsOfDelivery = "100% Advance Payment",
    buyerName = "",
    buyerAddress = "",
    buyerContact = "",
    buyerContactNo = "",
    buyerGST = "",
    buyerPAN = "",
    validUntil = "",
    items = [],
    gst5Items = [],
    gst18Items = [],
  } = data;

  // Calculate totals
  let subtotal = 0;
  items.forEach((item) => {
    subtotal += parseFloat(item.amount) || 0;
  });

  // Determine which items attract 5% vs 18% GST
  let gst5Base = 0;
  let gst18Base = 0;
  items.forEach((item) => {
    if (item.gstRate === "5") gst5Base += parseFloat(item.amount) || 0;
    else if (item.gstRate === "18") gst18Base += parseFloat(item.amount) || 0;
    else {
      // default: solar panels/inverters = 5%, rest = 18%
      if (
        item.description.toLowerCase().includes("solar") ||
        item.description.toLowerCase().includes("inverter")
      ) {
        gst5Base += parseFloat(item.amount) || 0;
      } else {
        gst18Base += parseFloat(item.amount) || 0;
      }
    }
  });

  const gst5Amount = Math.round(gst5Base * 0.05);
  const gst18Amount = Math.round(gst18Base * 0.18);
  const grandTotal = subtotal + gst5Amount + gst18Amount;

  const amountInWords = numberToWords(grandTotal);

  const itemRows = items
    .map(
      (item, i) => `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="center">${escapeHtml(String(item.quantity))}</td>
        <td class="center">${escapeHtml(item.unit || "Nos")}</td>
        <td class="right">${formatNum(item.rate)}</td>
        <td class="right">${formatNum(item.amount)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Proforma Invoice</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
    background: #fff;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 6mm 8mm;
    background: #fff;
  }

  /* ── OUTER BORDER ── */
  .invoice-wrapper {
    border: 1.5px solid #000;
    width: 100%;
  }

  /* ── TITLE ROW ── */
  .title-row {
    text-align: center;
    border-bottom: 1.5px solid #000;
    padding: 6px 0 5px;
  }
  .title-row h1 {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 1px;
  }

  /* ── HEADER: supplier left / logo right ── */
  .header-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    border-bottom: 1.5px solid #000;
  }
  .supplier-info {
    padding: 6px 8px;
    border-right: 1.5px solid #000;
  }
  .supplier-info .company-name {
    font-size: 13px;
    font-weight: bold;
  }
  .supplier-info p { line-height: 1.55; }
  .logo-cell {
    padding: 6px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 170px;
  }
  .logo-tagline { font-size: 8px; color: #555; margin-bottom: 2px; }
  .logo-brand {
    font-size: 26px;
    font-weight: 900;
    color: #3a7d2c;
    letter-spacing: -1px;
    line-height: 1;
  }
  .logo-brand span { color: #000; }
  .logo-sub { font-size: 8px; color: #555; margin-top: 2px; }

  /* ── META ROW: quotation no / buyer / dates ── */
  .meta-outer {
    border-bottom: 1.5px solid #000;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .meta-left {
    border-right: 1.5px solid #000;
  }
  .meta-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    border-bottom: 1px solid #000;
    min-height: 20px;
  }
  .meta-row:last-child { border-bottom: none; }
  .meta-label {
    font-weight: bold;
    padding: 3px 6px;
    border-right: 1px solid #000;
    background: #fff;
  }
  .meta-value { padding: 3px 6px; }
  .buyer-block { padding: 5px 8px; }
  .buyer-block .to-label { font-weight: bold; margin-bottom: 2px; }
  .buyer-block .buyer-name { font-weight: bold; font-size: 12px; }

  /* ── ITEMS TABLE ── */
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 1.5px solid #000;
  }
  table.items-table th {
    background: #fff;
    border: 1px solid #000;
    padding: 4px 5px;
    font-weight: bold;
    text-align: center;
    font-size: 11px;
  }
  table.items-table td {
    border: 1px solid #000;
    padding: 3px 5px;
    font-size: 11px;
    vertical-align: middle;
  }
  table.items-table .center { text-align: center; }
  table.items-table .right { text-align: right; }

  /* col widths */
  .col-srno  { width: 36px; }
  .col-desc  { width: auto; }
  .col-qty   { width: 60px; }
  .col-unit  { width: 46px; }
  .col-rate  { width: 80px; }
  .col-amt   { width: 90px; }

  /* totals rows */
  .totals-row td { border: 1px solid #000; padding: 3px 5px; }
  .totals-label { font-weight: bold; text-align: right; padding-right: 8px !important; }
  .totals-value { text-align: right; }

  /* ── AMOUNT IN WORDS ROW ── */
  .words-row {
    border-bottom: 1.5px solid #000;
    padding: 4px 6px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px;
  }
  .words-row .label { font-weight: bold; white-space: nowrap; }

  /* ── GST / PAN ROW ── */
  .gst-pan-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1.5px solid #000;
  }
  .gst-pan-cell {
    padding: 3px 6px;
    font-size: 10.5px;
  }
  .gst-pan-cell:first-child { border-right: 1.5px solid #000; }
  .gst-pan-cell strong { margin-right: 4px; }

  /* ── TERMS RO── */
  .terms-outer {
    border-bottom: 1.5px solid #000;
  }
  .terms-header-row {
    display: grid;
    grid-template-columns: 90px 1fr;
    border-bottom: 1px solid #000;
  }
  .terms-header-label {
    font-weight: bold;
    border-right: 1px solid #000;
    padding: 3px 6px;
    font-size: 10px;
    display: flex;
    align-items: center;
  }
  .terms-header-value {
    padding: 3px 6px;
    font-weight: bold;
    font-size: 10px;
  }
  .terms-list {
    padding: 3px 6px 4px;
    font-size: 9.5px;
    line-height: 1.6;
  }
  .terms-list p::before { content: "* "; }

  /* ── BANK ROW ── */
  .bank-row {
    border-bottom: 1.5px solid #000;
    padding: 3px 6px;
    font-size: 10px;
    font-weight: bold;
  }

  /* ── FOOTER / SIGNATURE ROW ── */
  .footer-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 60px;
  }
  .footer-left {
    border-right: 1.5px solid #000;
    padding: 4px 6px;
    font-weight: bold;
    font-size: 10.5px;
  }
  .footer-right {
    padding: 4px 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    font-size: 10.5px;
  }
  .footer-right .company-name-footer { font-weight: bold; }
  .footer-right .auth-sig { font-weight: bold; margin-top: 4px; }
</style>
</head>
<body>
<div class="page">
<div class="invoice-wrapper">

  <!-- TITLE -->
  <div class="title-row"><h1 style="font-size:28px; font-weight:bold; text-align:center; margin:5px 0;">
  Proforma Invoice
</h1>
</div>

  <!-- HEADER -->
  <div class="header-grid">
    <div class="supplier-info">
      <p class="company-name">Mauli Solar Solutions</p>
      <p>Jayshri Nagar, Court Road, Warud</p>
      <p>Ta. Warud Dist. Amravati</p>
      <p>Amravati - 444906, Maharashtra.</p>
      <p>E- Mail : narendrasonare5@gmail.com</p>
      <p>Phone No : 9689698325</p>
    </div>
   <div class="logo-cell"> 
<img 
  src="https://mauli-solar-solutions-invoice-web-app.onrender.com/Logo/MAULI.png"
  style="width:120px; display:block; margin:auto;" 
/>
</div>
  </div>

  <!-- QUOTATION / BUYER META -->
  <div class="meta-outer">
    <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #000;">
      <!-- LEFT: To / Buyer -->
      <div class="buyer-block" style="border-right:1.5px solid #000;">
        <p class="to-label">To,</p>
        <p class="buyer-name">M/s. ${escapeHtml(buyerName)}</p>
        <p>${escapeHtml(buyerAddress)}</p>
        ${buyerContact ? `<p>Contact Person : ${escapeHtml(buyerContact)}</p>` : ""}
        ${buyerContactNo ? `<p>Contact No.: ${escapeHtml(buyerContactNo)}</p>` : ""}
      </div>
      <!-- RIGHT: Quotation details -->
      <div>
        <div class="meta-row">
          <div class="meta-label">Quotation No.:</div>
          <div class="meta-value">${escapeHtml(quotationNo)}</div>
        </div>
        <div class="meta-row" style="border-bottom:1px solid #000;">
          <div class="meta-label">Quotation Date:</div>
          <div class="meta-value">${escapeHtml(quotationDate)}</div>
        </div>
        <div class="meta-row">
          <div class="meta-label">Buyer's Order No.:</div>
          <div class="meta-value">${escapeHtml(buyerOrderNo)}</div>
        </div>
        <div class="meta-row">
          <div class="meta-label">Order Date :</div>
          <div class="meta-value">${escapeHtml(orderDate)}</div>
        </div>
        <div class="meta-row" style="border-bottom:none;">
          <div class="meta-label">Terms of Delivery :</div>
          <div class="meta-value">${escapeHtml(termsOfDelivery)}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="col-srno">Sr. No.</th>
        <th class="col-desc">Description of Goods</th>
        <th class="col-qty">Quantity</th>
        <th class="col-unit">Unit</th>
        <th class="col-rate">Rate</th>
        <th class="col-amt">Amount (Rs.)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <!-- TOTALS -->
    <tfoot>
      <tr class="totals-row">
        <td colspan="5" class="totals-label">Total</td>
        <td class="totals-value">${formatNum(subtotal)}</td>
      </tr>
      ${
        gst5Amount > 0
          ? `<tr class="totals-row">
        <td colspan="5" class="totals-label">GST (5%)</td>
        <td class="totals-value">${formatNum(gst5Amount)}</td>
      </tr>`
          : ""
      }
      ${
        gst18Amount > 0
          ? `<tr class="totals-row">
        <td colspan="5" class="totals-label">GST (18%)</td>
        <td class="totals-value">${formatNum(gst18Amount)}</td>
      </tr>`
          : ""
      }
      <tr class="totals-row">
        <td colspan="5" class="totals-label" style="font-weight:bold;">Grand Total</td>
        <td class="totals-value" style="font-weight:bold;">&#8377; ${formatNum(grandTotal)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- AMOUNT IN WORDS -->
  <div class="words-row">
    <span class="label">Amount in words :</span>
    <span>${amountInWords}</span>
  </div>

  <!-- GST / PAN -->
  <div class="gst-pan-row">
    <div class="gst-pan-cell">
      <strong>Supplier GST No. :</strong> 27IEKPS4554H1ZU
      &nbsp;&nbsp;&nbsp;
      <strong>Buyer GST No. :</strong> ${escapeHtml(buyerGST)}
    </div>
    <div class="gst-pan-cell">
      <strong>Supplier PAN No. :</strong> IEKPS4554H
      &nbsp;&nbsp;&nbsp;
      <strong>Buyer PAN No. :</strong> ${escapeHtml(buyerPAN)}
    </div>
  </div>

  <!-- TERMS & CONDITIONS -->
  <div class="terms-outer">
    <div class="terms-header-row">
      <div class="terms-header-label">TERMS &amp;<br/>CONDITIONS</div>
      <div class="terms-header-value">
        ${validUntil ? `Please note that the quoted price is valid until ${escapeHtml(validUntil)}` : ""}
      </div>
    </div>
    <div class="terms-list">
      <p>Our responsibility ceases immediately the good leave our premises and no claim of shortage,breakage etc will be accepted.</p>
      <p>GST: Extra as applicable as per current government rule.</p>
      <p>Transportation Charges: Extra at actual</p>
      <p>Goods once sold will not be taken back.</p>
      <p>Interest at 24% will be charged on bill if not paid within due date</p>
      <p>Any complaint about the bill should be received within 8 days from the Date of bill.</p>
      <p>No warranty on physically demaged, burnt material or repairs goods.</p>
      <p>Material received for repairing will take minimum 15 - 20 days.</p>
      <p>All payments shall be made by name of M/s Mauli Solar Solution Payable at Warud.</p>
    </div>
  </div>

  <!-- BANK DETAILS -->
  <div class="bank-row">
    Bank Dtails : Central Bank of India, Warud &nbsp; A/c No. 5763829262, &nbsp; IFS Code : CBIN0282271
  </div>

  <!-- FOOTER -->
  <div class="footer-row">
    <div class="footer-left">Customer's Seal and Signature</div>
    <div class="footer-right">
      <span class="company-name-footer">Mauli Solar Solution</span>
      <span class="auth-sig">Authorised Signatory</span>
    </div>
  </div>

</div><!-- end invoice-wrapper -->
</div><!-- end page -->
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNum(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

module.exports = { generateInvoiceHTML };
