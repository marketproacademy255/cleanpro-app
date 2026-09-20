import { formatUZS } from './pricing'
import type { Booking } from './types'

export function generatePdfInvoice(booking: Booking) {
  const invoiceId = `PS-${booking.id.slice(0, 8).toUpperCase()}`
  const dateStr = new Date(booking.created_at || Date.now()).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isPaid = booking.payments?.some((p) => p.status === 'paid')
  const statusText = isPaid ? "TO'LANGAN (PAID)" : "TO'LOV KUTILMOQDA (PENDING)"
  const statusBg = isPaid ? '#d1fae5' : '#fef3c7'
  const statusColor = isPaid ? '#065f46' : '#92400e'

  const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>Kvitansiya #${invoiceId} - Prime Standard & Co</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background: #f8fafc; margin: 0; padding: 40px 20px; color: #1e293b; }
    .invoice-card { max-w: 780px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #047857; padding-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; color: #047857; letter-spacing: -0.5px; }
    .brand-tag { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .inv-num { font-size: 20px; font-weight: 700; color: #0f172a; }
    .inv-date { font-size: 13px; color: #64748b; margin-top: 4px; }
    
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${statusBg}; color: ${statusColor}; margin-top: 16px; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 32px 0; font-size: 14px; }
    .box { background: #f8fafc; padding: 16px 20px; border-radius: 12px; border: 1px solid #f1f5f9; }
    .box-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
    .box-text { font-weight: 600; color: #0f172a; line-height: 1.5; }

    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
    th { text-align: left; padding: 12px 16px; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 12px; text-transform: uppercase; border-radius: 6px; }
    td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .amount-col { text-align: right; font-weight: 600; }

    .total-section { margin-top: 24px; display: flex; justify-content: flex-end; }
    .total-table { width: 300px; }
    .total-table td { padding: 8px 16px; border: none; }
    .grand-total { font-size: 18px; font-weight: 800; color: #047857; border-top: 2px solid #047857 !important; }

    .footer-stamp { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; }
    .stamp-box { border: 2px dashed #047857; border-radius: 50%; width: 80px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #047857; font-weight: 700; font-size: 10px; transform: rotate(-12deg); }

    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div className="no-print" style="text-align: center; margin-bottom: 20px;">
    <button onclick="window.print()" style="background: #047857; color: white; border: none; padding: 12px 24px; font-weight: 700; border-radius: 8px; cursor: pointer; font-size: 14px;">
      🖨️ Kvitansiyani Chop Etish / PDF Saqlash
    </button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">PRIME STANDARD & CO</div>
        <div class="brand-tag">Professional Cleaning Services · Tashkent & Samarkand</div>
      </div>
      <div class="invoice-title">
        <div class="inv-num">HISOB-FAKTURA #${invoiceId}</div>
        <div class="inv-date">Sana: ${dateStr}</div>
        <div class="status-badge">${statusText}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Mijoz Ma'lumotlari</div>
        <div class="box-text">${booking.contact_name || 'Mijoz'}</div>
        <div class="box-text" style="font-weight: 400; font-size: 13px; color: #475569;">Tel: ${booking.contact_phone}</div>
        <div class="box-text" style="font-weight: 400; font-size: 13px; color: #475569;">Manzil: ${booking.address}, ${booking.city}</div>
      </div>

      <div class="box">
        <div class="box-title">Ijrochi Kompaniya</div>
        <div class="box-text">"PRIME STANDARD CLEANING" MCHJ</div>
        <div class="box-text" style="font-weight: 400; font-size: 13px; color: #475569;">STIR / INN: 309 812 441</div>
        <div class="box-text" style="font-weight: 400; font-size: 13px; color: #475569;">Reja vaqti: ${booking.scheduled_date} ${booking.scheduled_time}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Xizmat Tavsifi</th>
          <th>Tarif / Rejim</th>
          <th class="amount-col">Summa</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${booking.service_types?.name_uz || 'Tozalash xizmati'}</strong><br>
            <span style="font-size: 12px; color: #64748b;">${booking.rooms} xona · ${booking.property_type === 'home' ? 'Xonadon' : 'Ofis'}</span>
          </td>
          <td>${booking.tier.toUpperCase()} ${booking.frequency !== 'once' ? `(${booking.frequency})` : ''}</td>
          <td class="amount-col">${formatUZS(booking.base_amount || booking.total_amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <table class="total-table">
        ${
          booking.discount_amount > 0
            ? `<tr><td>Chegirma:</td><td class="amount-col" style="color: #dc2626;">-${formatUZS(booking.discount_amount)}</td></tr>`
            : ''
        }
        <tr class="grand-total">
          <td>Jami Summa:</td>
          <td class="amount-col">${formatUZS(booking.total_amount)}</td>
        </tr>
      </table>
    </div>

    <div class="footer-stamp">
      <div>
        <p style="margin: 0; font-weight: 600;">Prime Standard & Co. Rasmiy Elektron Kvitansiyasi</p>
        <p style="margin: 4px 0 0 0;">Qo'llab-quvvatlash markazi: +998 90 123 45 67 · info@prime-standard.uz</p>
      </div>
      <div class="stamp-box">
        <span>PRIME</span>
        <span style="font-size: 8px;">VERIFIED</span>
        <span>CLEAN</span>
      </div>
    </div>
  </div>

  <script>
    // Auto-trigger print modal if opened in tab
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 600);
    }
  </script>
</body>
</html>
  `

  const printWin = window.open('', '_blank')
  if (printWin) {
    printWin.document.write(html)
    printWin.document.close()
  }
}
