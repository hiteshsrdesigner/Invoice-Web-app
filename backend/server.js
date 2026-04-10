const path = require("path");
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { generateInvoiceHTML } = require("./invoiceTemplate");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-pdf", async (req, res) => {
  try {
    const invoiceData = req.body;
    const html = generateInvoiceHTML(invoiceData);

   const browser = await puppeteer.launch({
  executablePath: "/opt/render/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoiceData.quotationNo || "001"}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF", detail: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Invoice server running on http://localhost:${PORT}`));

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});