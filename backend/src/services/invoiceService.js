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

// ─── Helper: draw a horizontal rule ──────────────────────────────────────────
function drawLine(doc, margin) {
  doc
    .moveTo(margin, doc.y)
    .lineTo(doc.page.width - margin, doc.y)
    .strokeColor("#dde4ed")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.6);
}

// ─── Helper: draw a filled rectangle row ─────────────────────────────────────
function filledRow(doc, y, color, height, margin) {
  doc.rect(margin, y, doc.page.width - margin * 2, height).fill(color);
}

// ─── Build PDF buffer ─────────────────────────────────────────────────────────
function buildInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const chunks = [];
    const M = 50; // left/right margin
    const W = doc.page.width - M * 2; // usable width

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── 1. Header banner ──────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill("#1a3c5e");

    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(26)
      .text("Smart Hotel", M, 18, { continued: false });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text("123 Hotel Road, Colombo, Sri Lanka", M, 50)
      .text("smarthotel@gmail.com  ·  +94 112 345 678", M, 64);

    // "INVOICE" label on the right side of the banner
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("white")
      .text("INVOICE", M, 30, { width: W, align: "right" });

    // Move cursor below the banner
    doc.y = 110;
    doc.fillColor("#333");

    // ── 2. Invoice meta row ───────────────────────────────────────────────────
    const metaY = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888")
      .text("INVOICE NUMBER", M, metaY)
      .text("DATE ISSUED", M + 160, metaY)
      .text("STATUS", M + 320, metaY);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#222")
      .text(`#${invoice.paymentId}`, M, metaY + 14)
      .text(
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        M + 160,
        metaY + 14,
      )
      .text("✓ PAID", M + 320, metaY + 14);

    doc.y = metaY + 38;
    drawLine(doc, M);

    // ── 3. Billed To / Booking Details ───────────────────────────────────────
    const colY = doc.y;
    const col2 = M + W / 2 + 10;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#888")
      .text("BILLED TO", M, colY)
      .text("BOOKING DETAILS", col2, colY);

    // Left column lines
    const leftLines = [
      invoice.billing.fullName || "-",
      invoice.billing.email || "-",
      invoice.billing.phone || "-",
      invoice.billing.address || "-",
    ];

    // Right column lines
    const cardInfo = invoice.cardBrand
      ? `${invoice.cardBrand}  ····${invoice.cardLast4}`
      : "Card";
    const rightLines = [
      `Room:       ${invoice.title || "-"}`,
      `Check-in:   ${invoice.checkIn || "-"}`,
      `Check-out:  ${invoice.checkOut || "-"}`,
      invoice.guests ? `Guests:     ${invoice.guests}` : null,
      `Payment:    ${cardInfo}`,
    ].filter(Boolean);

    const lineH = 16;
    const startY = colY + 16;

    doc.font("Helvetica").fontSize(11).fillColor("#333");
    leftLines.forEach((line, i) => {
      doc.text(line, M, startY + i * lineH, {
        width: W / 2 - 10,
        lineBreak: false,
      });
    });
    rightLines.forEach((line, i) => {
      doc.text(line, col2, startY + i * lineH, {
        width: W / 2 - 10,
        lineBreak: false,
      });
    });

    // Move cursor past whichever column is taller
    const tallest = Math.max(leftLines.length, rightLines.length);
    doc.y = startY + tallest * lineH + 16;

    drawLine(doc, M);

    // ── 4. Line items table ───────────────────────────────────────────────────
    const tableTop = doc.y;
    const col2X = M + W * 0.72;
    const rowHeight = 26;

    // Table header
    filledRow(doc, tableTop, "#1a3c5e", rowHeight, M);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("white")
      .text("Description", M + 8, tableTop + 8, {
        width: W * 0.68,
        lineBreak: false,
      })
      .text("Amount (LKR)", col2X, tableTop + 8, {
        width: W * 0.28,
        align: "right",
        lineBreak: false,
      });

    // Row 1 — paid amount
    const row1Y = tableTop + rowHeight;
    filledRow(doc, row1Y, "#f5f8fc", rowHeight, M);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333")
      .text(
        `${invoice.title || "Hotel Room"}  —  ${invoice.checkIn} to ${invoice.checkOut}`,
        M + 8,
        row1Y + 8,
        { width: W * 0.68, lineBreak: false },
      )
      .text(
        `LKR ${Number(invoice.paidAmount).toLocaleString()}`,
        col2X,
        row1Y + 8,
        { width: W * 0.28, align: "right", lineBreak: false },
      );

    let nextRowY = row1Y + rowHeight;

    // Row 2 — remaining balance (only if > 0)
    if (Number(invoice.remaining) > 0) {
      filledRow(doc, nextRowY, "#ffffff", rowHeight, M);
      // Draw a border for empty row
      doc
        .rect(M, nextRowY, W, rowHeight)
        .strokeColor("#e8eef4")
        .lineWidth(0.5)
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#e07b00")
        .text("Remaining balance (payable at hotel)", M + 8, nextRowY + 8, {
          width: W * 0.68,
          lineBreak: false,
        })
        .text(
          `LKR ${Number(invoice.remaining).toLocaleString()}`,
          col2X,
          nextRowY + 8,
          { width: W * 0.28, align: "right", lineBreak: false },
        );
      nextRowY += rowHeight;
    }

    // Total row
    filledRow(doc, nextRowY, "#1a3c5e", rowHeight + 4, M);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("white")
      .text("AMOUNT PAID TODAY", M + 8, nextRowY + 9, {
        width: W * 0.68,
        lineBreak: false,
      })
      .text(
        `LKR ${Number(invoice.paidAmount).toLocaleString()}`,
        col2X,
        nextRowY + 9,
        { width: W * 0.28, align: "right", lineBreak: false },
      );

    doc.y = nextRowY + rowHeight + 4 + 24;

    drawLine(doc, M);

    // ── 5. Footer ─────────────────────────────────────────────────────────────
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#888")
      .text(
        "Thank you for choosing Smart Hotel. We look forward to welcoming you!",
        M,
        doc.y,
        { width: W, align: "center" },
      );
    doc.moveDown(0.4);
    doc.text(
      "For enquiries: smarthotel@gmail.com  ·  +94 112 345 678",
      M,
      doc.y,
      { width: W, align: "center" },
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
