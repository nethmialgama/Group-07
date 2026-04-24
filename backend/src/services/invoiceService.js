// backend/src/services/invoiceService.js
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

// ─── Build PDF buffer ─────────────────────────────────────────────────────────
function buildInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595; // A4 width in points

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 80).fill("#1a3c5e");
    doc
      .fillColor("white")
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("Smart Hotel", 50, 22);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("123 Hotel Road, Colombo, Sri Lanka", 50, 52)
      .text("smarthotel@gmail.com  ·  +94 112 345 678", 50, 65);

    // ── INVOICE label (top right) ─────────────────────────────────────────────
    doc
      .fillColor("white")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE", W - 150, 28, { width: 100, align: "right" });

    doc.fillColor("#333");

    // ── Invoice meta ──────────────────────────────────────────────────────────
    doc.moveDown(4);
    const metaY = 110;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#555")
      .text("Invoice Number", 50, metaY)
      .text("Date Issued", 200, metaY)
      .text("Status", 350, metaY);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#222")
      .text(`#${invoice.paymentId}`, 50, metaY + 16)
      .text(
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        200,
        metaY + 16,
      )
      .text("PAID ✓", 350, metaY + 16);

    // ── Divider ───────────────────────────────────────────────────────────────
    doc
      .moveTo(50, metaY + 40)
      .lineTo(W - 50, metaY + 40)
      .strokeColor("#ddd")
      .lineWidth(1)
      .stroke();

    // ── Billed To / Booking Details ───────────────────────────────────────────
    const colY = metaY + 55;
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#888")
      .text("BILLED TO", 50, colY)
      .text("BOOKING DETAILS", 300, colY);

    doc.fontSize(11).font("Helvetica").fillColor("#222");
    let leftY = colY + 16;
    doc.text(invoice.billing.fullName || "-", 50, leftY);
    leftY += 16;
    doc.text(invoice.billing.email || "-", 50, leftY);
    leftY += 16;
    doc.text(invoice.billing.phone || "-", 50, leftY);
    leftY += 16;
    doc.text(invoice.billing.address || "-", 50, leftY);

    let rightY = colY + 16;
    doc.text(`Room: ${invoice.title || "-"}`, 300, rightY);
    rightY += 16;
    doc.text(`Check-in:  ${invoice.checkIn || "-"}`, 300, rightY);
    rightY += 16;
    doc.text(`Check-out: ${invoice.checkOut || "-"}`, 300, rightY);
    rightY += 16;
    if (invoice.guests) {
      doc.text(`Guests: ${invoice.guests}`, 300, rightY);
      rightY += 16;
    }
    const cardInfo = invoice.cardBrand
      ? `${invoice.cardBrand} ····${invoice.cardLast4}`
      : "Card";
    doc.text(`Payment: ${cardInfo}`, 300, rightY);

    // ── Line items table ──────────────────────────────────────────────────────
    const tableY = Math.max(leftY, rightY) + 36;

    // Table header
    doc.rect(50, tableY, W - 100, 24).fill("#1a3c5e");
    doc
      .fillColor("white")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Description", 58, tableY + 7)
      .text("Amount (LKR)", W - 160, tableY + 7, {
        width: 110,
        align: "right",
      });

    // Row 1
    const row1Y = tableY + 28;
    doc.rect(50, row1Y, W - 100, 22).fill("#f5f8fc");
    doc
      .fillColor("#222")
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${invoice.title || "Hotel Room"} — ${invoice.checkIn} to ${invoice.checkOut}`,
        58,
        row1Y + 6,
      )
      .text(Number(invoice.paidAmount).toLocaleString(), W - 160, row1Y + 6, {
        width: 110,
        align: "right",
      });

    // Row 2 — remaining (if any)
    let totalY = row1Y + 22;
    if (invoice.remaining > 0) {
      doc.rect(50, totalY, W - 100, 22).fill("#fff");
      doc
        .fillColor("#888")
        .fontSize(10)
        .font("Helvetica")
        .text("Remaining balance (payable at hotel)", 58, totalY + 6)
        .text(Number(invoice.remaining).toLocaleString(), W - 160, totalY + 6, {
          width: 110,
          align: "right",
        });
      totalY += 22;
    }

    // Total row
    doc.rect(50, totalY, W - 100, 28).fill("#1a3c5e");
    doc
      .fillColor("white")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("AMOUNT PAID TODAY", 58, totalY + 8)
      .text(
        `LKR ${Number(invoice.paidAmount).toLocaleString()}`,
        W - 160,
        totalY + 8,
        { width: 110, align: "right" },
      );

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = totalY + 60;
    doc
      .moveTo(50, footerY)
      .lineTo(W - 50, footerY)
      .strokeColor("#ddd")
      .lineWidth(1)
      .stroke();

    doc
      .fillColor("#888")
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Thank you for choosing Smart Hotel. We look forward to welcoming you!",
        50,
        footerY + 12,
        { align: "center", width: W - 100 },
      )
      .text(
        "For inquiries: smarthotel@gmail.com  ·  +94 112 345 678",
        50,
        footerY + 26,
        { align: "center", width: W - 100 },
      );

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
            <tr><td style="padding:4px 0;color:#888;">Invoice #</td>     <td><strong>${invoice.paymentId}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#888;">Room</td>          <td>${invoice.title || "-"}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Check-in</td>      <td>${invoice.checkIn || "-"}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Check-out</td>     <td>${invoice.checkOut || "-"}</td></tr>
            <tr><td style="padding:4px 0;color:#888;">Amount Paid</td>   <td><strong style="color:#1a3c5e;">LKR ${Number(invoice.paidAmount).toLocaleString()}</strong></td></tr>
            ${invoice.remaining > 0 ? `<tr><td style="padding:4px 0;color:#888;">Remaining</td><td style="color:#e07b00;">LKR ${Number(invoice.remaining).toLocaleString()} (payable at hotel)</td></tr>` : ""}
          </table>
        </div>

        <p style="color:#444;line-height:1.6;">
          Your PDF invoice is attached. You can also download it anytime from your dashboard.
        </p>
        <p style="color:#444;line-height:1.6;">
          We look forward to welcoming you. If you have any questions, reply to this email or call us at
          <strong>+94 112 345 678</strong>.
        </p>
        <p style="color:#888;font-size:13px;margin-top:32px;">
          Smart Hotel · 123 Hotel Road, Colombo, Sri Lanka
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Smart Hotel" <${process.env.EMAIL_USER}>`,
    to: invoice.billing.email,
    subject: `Your Smart Hotel Booking Confirmation — Invoice #${invoice.paymentId}`,
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

module.exports = { buildInvoicePDF, sendInvoiceEmail };
