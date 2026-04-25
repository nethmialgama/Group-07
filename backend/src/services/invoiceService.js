// backend/src/services/invoiceService.js
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const HOTEL_LOGO_PATH = path.resolve(
  __dirname,
  "../../../public/images/logo.png",
);

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function drawRule(doc, x, y, width) {
  doc
    .save()
    .moveTo(x, y)
    .lineTo(x + width, y)
    .strokeColor("#d9e0ea")
    .lineWidth(1)
    .stroke()
    .restore();
}

function drawInfoCard(doc, { x, y, width, title, lines }) {
  const bodyWidth = width - 22;
  let currentY = y + 36;

  doc.save();
  doc.roundedRect(x, y, width, 40, 8).fill("#1a3c5e");
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, x + 12, y + 14, { width: bodyWidth });

  doc.roundedRect(x, y + 30, width, 88, 8).fillAndStroke("#f7f9fc", "#e1e8f2");

  doc.fillColor("#1f2937").font("Times-Roman").fontSize(11);
  lines.forEach((line) => {
    const text = line || "-";
    const blockHeight = doc.heightOfString(text, { width: bodyWidth });
    doc.text(text, x + 12, currentY, { width: bodyWidth });
    currentY += blockHeight + 6;
  });
  doc.restore();

  return Math.max(y + 118, currentY + 8);
}

function drawTableRow(
  doc,
  { x, y, width, label, value, fill, labelColor, valueColor, bold },
) {
  const rowHeight = 30;
  const labelWidth = width * 0.68;
  const valueWidth = width * 0.32;

  doc.save();
  doc
    .rect(x, y, width, rowHeight)
    .fill(fill)
    .strokeColor("#e2e8f0")
    .lineWidth(0.5)
    .stroke();
  doc
    .font(bold ? "Helvetica-Bold" : "Times-Roman")
    .fontSize(11)
    .fillColor(labelColor)
    .text(label, x + 10, y + 10, { width: labelWidth - 16 });
  doc
    .font(bold ? "Helvetica-Bold" : "Times-Roman")
    .fontSize(11)
    .fillColor(valueColor)
    .text(value, x + labelWidth, y + 10, {
      width: valueWidth - 10,
      align: "right",
    });
  doc.restore();

  return y + rowHeight;
}

// ─── Build PDF buffer ─────────────────────────────────────────────────────────
function buildInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4", bufferPages: true });
    const chunks = [];
    const M = 48;
    const W = doc.page.width - M * 2;

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header panel
    doc.rect(0, 0, doc.page.width, 124).fill("#1a3c5e");

    if (fs.existsSync(HOTEL_LOGO_PATH)) {
      doc.image(HOTEL_LOGO_PATH, M, 26, { fit: [72, 72], align: "left" });
    }

    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(25)
      .text("Smart Hotel", M + 86, 34)
      .font("Times-Roman")
      .fontSize(10)
      .text("123 Hotel Road, Colombo, Sri Lanka", M + 86, 64)
      .text("smarthotel@gmail.com | +94 112 345 678", M + 86, 78)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("INVOICE", M, 44, { width: W, align: "right" })
      .font("Times-Roman")
      .fontSize(10)
      .text(`#${invoice.paymentId}`, M, 68, { width: W, align: "right" });

    let y = 144;

    // Meta strip
    doc.roundedRect(M, y, W, 56, 8).fillAndStroke("#eef3f9", "#d9e3ef");
    doc
      .fillColor("#5b6b7f")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("DATE ISSUED", M + 14, y + 11)
      .text("STATUS", M + W / 2 - 38, y + 11)
      .text("AMOUNT PAID", M + W - 180, y + 11, { width: 166, align: "right" });
    doc
      .fillColor("#111827")
      .font("Times-Roman")
      .fontSize(12)
      .text(formatDate(new Date()), M + 14, y + 26)
      .text("PAID", M + W / 2 - 38, y + 26)
      .font("Helvetica-Bold")
      .text(formatMoney(invoice.paidAmount), M + W - 180, y + 26, {
        width: 166,
        align: "right",
      });

    y += 74;

    // Two info cards
    const colGap = 14;
    const colWidth = (W - colGap) / 2;
    const paymentMethod = invoice.cardBrand
      ? `${invoice.cardBrand} ending ${invoice.cardLast4 || ""}`
      : "Card";

    const billingLines = [
      invoice.billing?.fullName || "-",
      invoice.billing?.email || "-",
      invoice.billing?.phone,
      invoice.billing?.address,
    ].filter((value, index) => {
      const text = String(value || "").trim();
      if (!text || text === "-") return false;
      // Hide placeholder contact values that are not useful on invoices.
      if (index === 2 && (text === "0000000000" || text === "N/A")) {
        return false;
      }
      return true;
    });

    const leftBottom = drawInfoCard(doc, {
      x: M,
      y,
      width: colWidth,
      title: "Billed To",
      lines: billingLines,
    });

    const rightBottom = drawInfoCard(doc, {
      x: M + colWidth + colGap,
      y,
      width: colWidth,
      title: "Booking Details",
      lines: [
        `Room: ${invoice.title || "-"}`,
        `Check-in: ${formatDate(invoice.checkIn)}`,
        `Check-out: ${formatDate(invoice.checkOut)}`,
        invoice.guests ? `Guests: ${invoice.guests}` : null,
        `Payment: ${paymentMethod}`,
      ].filter(Boolean),
    });

    y = Math.max(leftBottom, rightBottom) + 14;
    drawRule(doc, M, y, W);
    y += 14;

    // Charges table
    doc
      .fillColor("#1a3c5e")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Payment Breakdown", M, y);
    y += 18;

    y = drawTableRow(doc, {
      x: M,
      y,
      width: W,
      label: "Description",
      value: "Amount",
      fill: "#1a3c5e",
      labelColor: "#ffffff",
      valueColor: "#ffffff",
      bold: true,
    });

    y = drawTableRow(doc, {
      x: M,
      y,
      width: W,
      label: `${invoice.title || "Hotel Room"} (${formatDate(invoice.checkIn)} to ${formatDate(invoice.checkOut)})`,
      value: formatMoney(invoice.paidAmount),
      fill: "#f7f9fc",
      labelColor: "#111827",
      valueColor: "#111827",
      bold: false,
    });

    if (Number(invoice.remaining) > 0) {
      y = drawTableRow(doc, {
        x: M,
        y,
        width: W,
        label: "Remaining balance (payable at hotel)",
        value: formatMoney(invoice.remaining),
        fill: "#fffaf0",
        labelColor: "#b45309",
        valueColor: "#b45309",
        bold: false,
      });
    }

    y = drawTableRow(doc, {
      x: M,
      y,
      width: W,
      label: "Amount paid today",
      value: formatMoney(invoice.paidAmount),
      fill: "#1a3c5e",
      labelColor: "#ffffff",
      valueColor: "#ffffff",
      bold: true,
    });

    y += 24;
    drawRule(doc, M, y, W);
    y += 16;

    doc
      .fillColor("#4b5563")
      .font("Times-Roman")
      .fontSize(10)
      .text(
        "Thank you for choosing Smart Hotel. We look forward to welcoming you.",
        M,
        y,
        { width: W, align: "center" },
      )
      .moveDown(0.4)
      .text("For enquiries: smarthotel@gmail.com | +94 112 345 678", {
        width: W,
        align: "center",
      });

    doc.end();
  });
}

// ─── Send invoice email ───────────────────────────────────────────────────────
async function sendInvoiceEmail(invoice) {
  const pdfBuffer = await buildInvoicePDF(invoice);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:#1a3c5e;padding:28px 32px;">
        <h1 style="color:white;margin:0;font-size:24px;">Smart Hotel</h1>
        <p style="color:#a8c4d9;margin:4px 0 0;">Booking Confirmation &amp; Invoice</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="font-size:16px;color:#222;">Dear <strong>${invoice.billing.fullName || "Guest"}</strong>,</p>
        <p style="color:#444;line-height:1.6;">
          Thank you for your booking! Your payment has been received and your room is confirmed.
          Please find your invoice attached to this email.
        </p>

        <div style="background:#f5f8fc;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="margin:0 0 16px;color:#1a3c5e;font-size:15px;">Booking Summary</h3>
          <table style="width:100%;font-size:14px;color:#444;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;width:140px;">Invoice #</td>     <td><strong>${invoice.paymentId}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#888;">Room</td>          <td>${invoice.title || "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Check-in</td>      <td>${invoice.checkIn || "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Check-out</td>     <td>${invoice.checkOut || "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Amount Paid</td>
                <td><strong style="color:#1a3c5e;font-size:16px;">LKR ${Number(invoice.paidAmount).toLocaleString()}</strong></td></tr>
            ${
              Number(invoice.remaining) > 0
                ? `<tr><td style="padding:6px 0;color:#888;">Remaining</td>
                     <td style="color:#e07b00;">LKR ${Number(invoice.remaining).toLocaleString()} (payable at hotel)</td></tr>`
                : ""
            }
          </table>
        </div>

        <p style="color:#444;line-height:1.6;">
          Your PDF invoice is attached to this email for your records.
        </p>
        <p style="color:#444;line-height:1.6;">
          We look forward to welcoming you. If you have any questions please call us at
          <strong>+94 112 345 678</strong>.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="color:#aaa;font-size:12px;margin:0;">
          Smart Hotel · 123 Hotel Road, Colombo, Sri Lanka
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Smart Hotel" <${process.env.EMAIL_USER}>`,
    to: invoice.billing.email,
    subject: `Booking Confirmed — Invoice #${invoice.paymentId} | Smart Hotel`,
    html,
    attachments: [
      {
        filename: `SmartHotel-Invoice-${invoice.paymentId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

// ─── Send refund processed email ──────────────────────────────────────────────
async function sendRefundEmail(refund) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:#1a3c5e;padding:28px 32px;">
        <h1 style="color:white;margin:0;font-size:24px;">Smart Hotel</h1>
        <p style="color:#a8c4d9;margin:4px 0 0;">Refund Confirmation</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="font-size:16px;color:#222;">Dear <strong>${refund.guestName}</strong>,</p>
        <p style="color:#444;line-height:1.6;">
          We have processed your refund for your cancelled booking.
          The refund amount has been sent to your original payment method.
        </p>

        <div style="background:#e8f8ef;border:1px solid #82d4a0;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="margin:0 0 16px;color:#1a7a3c;font-size:15px;">✓ Refund Processed</h3>
          <table style="width:100%;font-size:14px;color:#444;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;width:160px;">Reservation #</td>
                <td><strong>${refund.reservationId}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#888;">Room</td>
                <td>${refund.roomType}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Check-in</td>
                <td>${refund.checkIn}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Check-out</td>
                <td>${refund.checkOut}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Amount Paid</td>
                <td>LKR ${Number(refund.paidAmount).toLocaleString()}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Refund Rate</td>
                <td>${Math.round(Number(refund.refundRate) * 100)}%</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Refund Amount</td>
                <td><strong style="color:#1a7a3c;font-size:18px;">LKR ${Number(refund.refundAmount).toLocaleString()}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#888;">Processed On</td>
                <td>${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</td></tr>
          </table>
        </div>

        <p style="color:#444;line-height:1.6;">
          Please allow <strong>3–5 business days</strong> for the refund to appear
          in your account depending on your bank.
        </p>
        <p style="color:#444;line-height:1.6;">
          If you have any questions please contact us at
          <strong>smarthotel@gmail.com</strong> or call <strong>+94 112 345 678</strong>.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
        <p style="color:#aaa;font-size:12px;margin:0;">
          Smart Hotel · 123 Hotel Road, Colombo, Sri Lanka
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Smart Hotel" <${process.env.EMAIL_USER}>`,
    to: refund.guestEmail,
    subject: `Your Refund of LKR ${Number(refund.refundAmount).toLocaleString()} Has Been Processed — Smart Hotel`,
    html,
  });
}

module.exports = { buildInvoicePDF, sendInvoiceEmail, sendRefundEmail };
