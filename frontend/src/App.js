import React, { useState, useCallback } from "react";
import "./App.css";

const DEFAULT_ITEM = { description: "", quantity: "", unit: "Nos", rate: "", amount: "", gstRate: "auto" };

const UNIT_OPTIONS = ["Nos", "Mtr", "Kg", "Ltr", "Set", "Pair", "Box", "Sqft", "Sqmm"];
const GST_OPTIONS = [
  { value: "auto", label: "Auto (Solar=5%, Other=18%)" },
  { value: "5", label: "5%" },
  { value: "18", label: "18%" },
  { value: "0", label: "0% (Exempt)" },
];

export default function App() {
  const [form, setForm] = useState({
    quotationNo: "",
    quotationDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
    buyerOrderNo: "",
    orderDate: "Oral",
    termsOfDelivery: "100% Advance Payment",
    buyerName: "",
    buyerAddress: "",
    buyerContact: "",
    buyerContactNo: "",
    buyerGST: "",
    buyerPAN: "",
    validUntil: "",
  });

  const [items, setItems] = useState([{ ...DEFAULT_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleItemChange = useCallback((index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-calc amount
      if (field === "quantity" || field === "rate") {
        const qty = parseFloat(field === "quantity" ? value : updated[index].quantity) || 0;
        const rate = parseFloat(field === "rate" ? value : updated[index].rate) || 0;
        updated[index].amount = (qty * rate).toFixed(2);
      }
      return updated;
    });
  }, []);

  const addItem = () => setItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  // Totals
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const computeGST = (rate) =>
    items
      .filter((it) => {
        if (it.gstRate === "auto") {
          const isSolar =
            it.description.toLowerCase().includes("solar") ||
            it.description.toLowerCase().includes("inverter");
          return rate === "5" ? isSolar : !isSolar;
        }
        return it.gstRate === rate;
      })
      .reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  const gst5Base = computeGST("5");
  const gst18Base = computeGST("18");
  const gst5Amount = Math.round(gst5Base * 0.05);
  const gst18Amount = Math.round(gst18Base * 0.18);
  const grandTotal = subtotal + gst5Amount + gst18Amount;

  const formatINR = (n) =>
    Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleGenerate = async () => {
    if (!form.buyerName.trim()) { setError("Please enter customer name."); return; }
    if (items.some((it) => !it.description.trim())) { setError("All items need a description."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${form.quotationNo || "draft"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to generate PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <span className="logo-life">Mauli Solar</span><span className="logo-green"> Solutions</span>
        </div>
        <div>
          <h1>Invoice Generator</h1>
          <p>Mauli Solar Solutions</p>
        </div>
      </header>

      <main className="app-main">

        {/* ── SECTION: Invoice Meta ── */}
        <section className="card">
          <h2 className="section-title">📄 Invoice Details</h2>
          <div className="grid-2">
            <Field label="Quotation No." name="quotationNo" value={form.quotationNo} onChange={handleFormChange} placeholder="e.g. 805" />
            <Field label="Quotation Date" name="quotationDate" value={form.quotationDate} onChange={handleFormChange} placeholder="DD.MM.YYYY" />
            <Field label="Buyer's Order No." name="buyerOrderNo" value={form.buyerOrderNo} onChange={handleFormChange} placeholder="Optional" />
            <Field label="Order Date" name="orderDate" value={form.orderDate} onChange={handleFormChange} placeholder="e.g. Oral" />
            <Field label="Terms of Delivery" name="termsOfDelivery" value={form.termsOfDelivery} onChange={handleFormChange} className="col-span-2" />
            <Field label="Price Valid Until" name="validUntil" value={form.validUntil} onChange={handleFormChange} placeholder="e.g. Mar 25, 2026" className="col-span-2" />
          </div>
        </section>

        {/* ── SECTION: Buyer Details ── */}
        <section className="card">
          <h2 className="section-title">🏢 Customer Details</h2>
          <div className="grid-2">
            <Field label="Customer / Company Name *" name="buyerName" value={form.buyerName} onChange={handleFormChange} placeholder="M/s. Company Name" className="col-span-2" />
            <Field label="Address" name="buyerAddress" value={form.buyerAddress} onChange={handleFormChange} placeholder="City - Pincode" className="col-span-2" />
            <Field label="Contact Person" name="buyerContact" value={form.buyerContact} onChange={handleFormChange} placeholder="Mr. Name" />
            <Field label="Contact No." name="buyerContactNo" value={form.buyerContactNo} onChange={handleFormChange} placeholder="9XXXXXXXXX" />
            <Field label="Buyer GST No." name="buyerGST" value={form.buyerGST} onChange={handleFormChange} placeholder="Optional" />
            <Field label="Buyer PAN No." name="buyerPAN" value={form.buyerPAN} onChange={handleFormChange} placeholder="Optional" />
          </div>
        </section>

        {/* ── SECTION: Line Items ── */}
        <section className="card">
          <h2 className="section-title">📦 Line Items</h2>
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description of Goods *</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate (₹)</th>
                  <th>Amount (₹)</th>
                  <th>GST</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="sr">{i + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(i, "description", e.target.value)}
                        placeholder="Product / Service description"
                        className="input-full"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                        placeholder="0"
                        min="0"
                        className="input-num"
                      />
                    </td>
                    <td>
                      <select value={item.unit} onChange={(e) => handleItemChange(i, "unit", e.target.value)} className="input-select">
                        {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(i, "rate", e.target.value)}
                        placeholder="0.00"
                        min="0"
                        className="input-num"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleItemChange(i, "amount", e.target.value)}
                        placeholder="0.00"
                        className="input-num"
                      />
                    </td>
                    <td>
                      <select value={item.gstRate} onChange={(e) => handleItemChange(i, "gstRate", e.target.value)} className="input-select-sm">
                        {GST_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-remove"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                        title="Remove item"
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn-add-item" onClick={addItem}>+ Add Item</button>

          {/* Totals Summary */}
          <div className="totals-box">
            <div className="totals-row"><span>Subtotal</span><span>₹ {formatINR(subtotal)}</span></div>
            {gst5Amount > 0 && <div className="totals-row"><span>GST @ 5%</span><span>₹ {formatINR(gst5Amount)}</span></div>}
            {gst18Amount > 0 && <div className="totals-row"><span>GST @ 18%</span><span>₹ {formatINR(gst18Amount)}</span></div>}
            <div className="totals-row grand"><span>Grand Total</span><span>₹ {formatINR(grandTotal)}</span></div>
          </div>
        </section>

        {/* ── ERROR ── */}
        {error && <div className="error-box">{error}</div>}

        {/* ── GENERATE BUTTON ── */}
        <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
          {loading ? "⏳ Generating PDF..." : "📥 Generate Invoice PDF"}
        </button>
        

      </main>
  <footer style={{
  width: "100%",
  textAlign: "center",
  padding: "12px 0",
  backgroundColor: "#f5f5f5",
  color: "#555",
  fontSize: "14px",
  position: "fixed",
  bottom: "0",
  left: "0",
  borderTop: "1px solid #ddd"
}}>
  © 2026 Developed by Hitesh Sonare | 📞 9325874513
</footer>
      
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, className }) {
  return (
    <div className={`field ${className || ""}`}>
      <label>{label}</label>
      <input type="text" name={name} value={value} onChange={onChange} placeholder={placeholder || ""} />
    </div>
  );
}
