// Builds order PDFs in the browser for the admin dashboard: one order per
// page (an invoice-style summary), preceded by an overview table when several
// orders are downloaded together. jsPDF is loaded only when a download starts.
//
// The built-in PDF fonts have no ₹ glyph, so amounts are written as "Rs.".

const BRAND = "SAHUMäRIO®";
const MARGIN = 48;

function money(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function dateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function shortId(id) {
  return String(id || "").replace(/^order_/, "");
}

function orderTotal(order) {
  return Number(order.total ?? order.subtotal ?? 0);
}

// Keeps text the built-in fonts can draw (Latin-1): common typographic
// characters are swapped for plain ones, anything else becomes "?".
function pdfText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u20B9\s?/g, "Rs. ")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF\n]/g, "?");
}

function header(doc, title) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFont("times", "normal");
  doc.setFontSize(20);
  doc.text(pdfText(BRAND), MARGIN, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text("EAU DE PARFUM · RAJKOT, GUJARAT, INDIA", MARGIN, 78);
  doc.setTextColor(20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(pdfText(title), width - MARGIN, 64, { align: "right" });
  doc.setDrawColor(200);
  doc.line(MARGIN, 92, width - MARGIN, 92);
  return 118;
}

function footer(doc) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text("sahumario.com", MARGIN, height - 30);
    doc.text(`Page ${page} of ${pages}`, width - MARGIN, height - 30, { align: "right" });
  }
  doc.setTextColor(20);
}

function label(doc, text, x, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  doc.text(text.toUpperCase(), x, y);
  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
}

function orderPage(doc, order) {
  const width = doc.internal.pageSize.getWidth();
  const right = width - MARGIN;
  const address = order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];
  let y = header(doc, `Order #${shortId(order.id)}`);

  // Customer (left) and order details (right).
  label(doc, "Ship to", MARGIN, y);
  label(doc, "Order", width / 2 + 10, y);
  y += 16;
  const shipLines = [
    address.name,
    address.address,
    [address.city, address.state, address.pin].filter(Boolean).join(", "),
    address.phone && `Phone: ${address.phone}`,
    address.email && `Email: ${address.email}`,
  ].filter(Boolean).map(pdfText);
  const wrappedShip = shipLines.flatMap((line) => doc.splitTextToSize(line, width / 2 - MARGIN - 10));
  doc.text(wrappedShip, MARGIN, y, { lineHeightFactor: 1.45 });

  const details = [
    ["Placed", dateTime(order.created_at)],
    ["Status", order.status || "Pending"],
    ["Payment ID", order.razorpay_payment_id || order.payment_id || "—"],
    order.courier && ["Courier", order.courier],
    order.tracking_number && ["Tracking", order.tracking_number],
    order.deleted_at && ["In trash since", dateTime(order.deleted_at)],
  ].filter(Boolean);
  details.forEach(([key, value], index) => {
    const lineY = y + index * 14.5;
    doc.setTextColor(110);
    doc.text(key, width / 2 + 10, lineY);
    doc.setTextColor(20);
    doc.text(doc.splitTextToSize(pdfText(value), right - (width / 2 + 100))[0], width / 2 + 100, lineY);
  });
  y += Math.max(wrappedShip.length * 14.5, details.length * 14.5) + 26;

  // Items table.
  const cols = { item: MARGIN, qty: right - 190, price: right - 110, amount: right };
  doc.setDrawColor(200);
  doc.line(MARGIN, y - 12, right, y - 12);
  label(doc, "Item", cols.item, y);
  label(doc, "Qty", cols.qty, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  doc.text("PRICE", cols.price, y, { align: "right" });
  doc.text("AMOUNT", cols.amount, y, { align: "right" });
  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 8;
  doc.line(MARGIN, y, right, y);
  y += 18;

  items.forEach((item) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const name = doc.splitTextToSize(pdfText(item.name || "Item"), cols.qty - MARGIN - 16);
    doc.text(name, cols.item, y, { lineHeightFactor: 1.4 });
    doc.text(String(qty), cols.qty, y);
    doc.text(money(price), cols.price, y, { align: "right" });
    doc.text(money(qty * price), cols.amount, y, { align: "right" });
    y += Math.max(1, name.length) * 14 + 8;
  });

  doc.line(MARGIN, y - 4, right, y - 4);
  if (Number(order.discount_amount) > 0) {
    y += 12;
    doc.text(pdfText(`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`), cols.price, y, { align: "right" });
    doc.text(`- ${money(order.discount_amount)}`, cols.amount, y, { align: "right" });
    y += 6;
  }
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", cols.price, y, { align: "right" });
  doc.text(money(orderTotal(order)), cols.amount, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Complimentary delivery across India.", MARGIN, y);
  doc.setTextColor(20);
}

function overviewPage(doc, orders) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const right = width - MARGIN;
  const cols = [
    { key: "id", x: MARGIN, label: "Order" },
    { key: "date", x: MARGIN + 104, label: "Placed" },
    { key: "customer", x: MARGIN + 188, label: "Customer" },
    { key: "city", x: right - 220, label: "City" },
    { key: "status", x: right - 145, label: "Status" },
  ];
  let y = header(doc, `${orders.length} orders`);

  const drawHead = () => {
    cols.forEach((col) => label(doc, col.label, col.x, y));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text("TOTAL", right, y, { align: "right" });
    doc.setTextColor(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 8;
    doc.setDrawColor(200);
    doc.line(MARGIN, y, right, y);
    y += 16;
  };
  drawHead();

  orders.forEach((order) => {
    if (y > height - 80) {
      doc.addPage();
      y = header(doc, `${orders.length} orders (cont.)`);
      drawHead();
    }
    const address = order.address || {};
    const row = {
      id: `#${shortId(order.id)}`.slice(0, 16),
      date: order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—",
      customer: address.name || "—",
      city: address.city || "—",
      status: order.status || "Pending",
    };
    cols.forEach((col, index) => {
      const next = cols[index + 1]?.x ?? right - 70;
      doc.text(doc.splitTextToSize(pdfText(row[col.key]), next - col.x - 8)[0] || "", col.x, y);
    });
    doc.text(money(orderTotal(order)), right, y, { align: "right" });
    y += 18;
  });

  doc.line(MARGIN, y - 6, right, y - 6);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Total", right - 90, y, { align: "right" });
  doc.text(money(orders.reduce((sum, order) => sum + orderTotal(order), 0)), right, y, { align: "right" });
}

/** Downloads a PDF of `orders`: one order per page, plus an overview when there are several. */
export async function downloadOrdersPdf(orders, fileName) {
  if (!orders.length) return;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  if (orders.length > 1) overviewPage(doc, orders);
  orders.forEach((order, index) => {
    if (orders.length > 1 || index > 0) doc.addPage();
    orderPage(doc, order);
  });
  footer(doc);
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(fileName || (orders.length === 1 ? `order-${shortId(orders[0].id)}.pdf` : `sahumario-orders-${stamp}.pdf`));
}
