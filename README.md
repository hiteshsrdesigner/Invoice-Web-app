# Green Life Invoice Generator

A full-stack billing system that generates pixel-perfect PDFs matching the Green Life Solutions Proforma Invoice template.

---

## 📁 Folder Structure

```
invoice-app/
├── package.json              ← root scripts (run both services)
├── vercel.json               ← Vercel deployment config
├── README.md
│
├── backend/
│   ├── package.json
│   ├── server.js             ← Express API server
│   └── invoiceTemplate.js    ← HTML template for PDF generation
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js            ← Main React form component
        └── App.css           ← All styles
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+ installed
- npm 8+

### Step 1 — Install all dependencies
```bash
cd invoice-app
npm run install:all
```

### Step 2 — Start both servers
```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:3001`
- **Frontend** on `http://localhost:3000`

Open `http://localhost:3000` in your browser.

### Step 3 — Generate an invoice
1. Fill in customer details
2. Add line items (quantity × rate = auto-calculated amount)
3. Select GST rate per item (or use Auto-detect)
4. Click **Generate Invoice PDF**
5. PDF downloads automatically

---

## 📦 API Reference

### POST `/generate-pdf`

**Request Body (JSON):**
```json
{
  "quotationNo": "805",
  "quotationDate": "24.03.2026",
  "buyerOrderNo": "",
  "orderDate": "Oral",
  "termsOfDelivery": "100% Advance Payment",
  "buyerName": "MAULI SUSTAINABLE SOLAR SOLUTIONS",
  "buyerAddress": "Warud - 444906",
  "buyerContact": "Mr. Narendra Sonare",
  "buyerContactNo": "96896 98325",
  "buyerGST": "",
  "buyerPAN": "",
  "validUntil": "Mar 25, 2026",
  "items": [
    {
      "description": "Solar Panel 620 Wp Topcon NDCR (Make: Adani)",
      "quantity": "2",
      "unit": "Nos",
      "rate": "9920",
      "amount": "19840.00",
      "gstRate": "5"
    }
  ]
}
```

**Response:** `application/pdf` binary stream

---

## 🌐 Deploy to Render (Recommended for Puppeteer)

Vercel's serverless environment does not support Puppeteer well. Use **Render** instead:

### Backend on Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Select your repo → set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Environment: **Node**

### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Select your repo → set **Root Directory** to `frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` = your Render backend URL (e.g. `https://your-app.onrender.com`)
4. Update `frontend/src/App.js` fetch URL:
   ```js
   const res = await fetch(`${process.env.REACT_APP_API_URL}/generate-pdf`, { ... });
   ```

---

## 🔧 GST Logic

| Item Type | GST Rate |
|-----------|----------|
| Solar Panels, Inverters (Auto) | 5% |
| All other items (Auto) | 18% |
| Manual override | Per-item selection |

---

## 📄 PDF Template Details

The generated PDF exactly replicates the Green Life Solutions Proforma Invoice:
- Outer border table layout
- Company header with logo
- Buyer details + quotation meta
- Items table with Sr. No., Description, Qty, Unit, Rate, Amount
- Automatic GST breakdown (5% and 18% rows)
- Grand Total with ₹ symbol
- Amount in words (Indian number system)
- Supplier GST No. / PAN No. row
- Terms & Conditions section
- Bank payment details
- Customer signature + Authorised Signatory footer

---

## 📝 Notes

- Puppeteer downloads Chromium on first `npm install` (~170MB)
- PDF generation takes ~2–3 seconds per invoice
- All amounts use Indian number formatting (lakhs/crores)
