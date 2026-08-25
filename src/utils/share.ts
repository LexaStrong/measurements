import { Record } from './db';

export type ReceiptRecipient = 'customer' | 'apprentice';

/**
 * Generates a premium-looking receipt/invoice image using HTML Canvas.
 * Returns a Blob that can be shared or downloaded.
 */
export const generateReceipt = async (
  record: Record,
  recipient: ReceiptRecipient = 'customer'
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const isCustomer = recipient === 'customer';

  // Dimensions: 800x1000 for customer invoice, 800x1200 for apprentice work order
  canvas.width = 800;
  canvas.height = isCustomer ? 980 : 1200;

  // Colors
  const colors = {
    bg: '#1E1A18',
    cardBg: 'rgba(255, 255, 255, 0.04)',
    gold: '#C9A96E',
    goldLight: '#E8D5B5',
    text: '#E8E2D9',
    muted: '#8A827B',
    border: '#3D3834',
    accent: '#C45C2A',
    success: '#4A7C59',
  };

  // Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient background decoration
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 600);
  gradient.addColorStop(0, 'rgba(201, 169, 110, 0.12)');
  gradient.addColorStop(1, 'rgba(30, 26, 24, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Gold Border
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Inner Accent Line
  ctx.strokeStyle = 'rgba(201, 169, 110, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // Header
  ctx.fillStyle = colors.gold;
  ctx.font = 'bold 44px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEMAIRE ATELIER', canvas.width / 2, 85);

  ctx.fillStyle = colors.muted;
  ctx.font = '600 13px Inter, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(
    isCustomer ? 'OFFICIAL CLIENT INVOICE & RECEIPT' : 'TECHNICAL WORK ORDER & MEASUREMENTS',
    canvas.width / 2,
    115
  );
  ctx.letterSpacing = '0px';

  // Client Info Box
  ctx.fillStyle = colors.cardBg;
  ctx.roundRect?.(40, 145, canvas.width - 80, 155, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 30px Inter, sans-serif';
  ctx.fillText(record.name, 70, 195);

  ctx.fillStyle = colors.muted;
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText(`Phone: ${record.phone || 'N/A'}`, 70, 228);
  ctx.fillText(`Date: ${record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}`, 70, 256);
  ctx.fillText(`Garment: ${record.garment || 'Bespoke Order'}`, 70, 284);

  const charged = parseFloat(record.charged) || 0;
  const paid = parseFloat(record.paid) || 0;
  const balance = charged - paid;

  if (isCustomer) {
    // ================= CUSTOMER RECEIPT =================
    // Order & Schedule Summary Box
    const orderBoxY = 320;
    ctx.fillStyle = colors.cardBg;
    ctx.roundRect?.(40, orderBoxY, canvas.width - 80, 190, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('ORDER SPECIFICATIONS', 70, orderBoxY + 40);

    ctx.fillStyle = colors.muted;
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Garment Type:', 70, orderBoxY + 78);
    ctx.fillText('Collection Due Date:', 70, orderBoxY + 114);
    ctx.fillText('Production Status:', 70, orderBoxY + 150);

    ctx.textAlign = 'right';
    ctx.fillStyle = colors.text;
    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillText(record.garment || 'Custom Garment', canvas.width - 70, orderBoxY + 78);
    ctx.fillText(
      record.collection ? new Date(record.collection).toLocaleDateString() : 'To Be Scheduled',
      canvas.width - 70,
      orderBoxY + 114
    );

    ctx.fillStyle = record.received ? colors.success : colors.gold;
    ctx.fillText(
      record.received ? '✓ Completed / Delivered' : '● In Production',
      canvas.width - 70,
      orderBoxY + 150
    );

    // Financial Summary Box
    const financialY = 530;
    ctx.fillStyle = colors.cardBg;
    ctx.roundRect?.(40, financialY, canvas.width - 80, 260, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('PAYMENT SUMMARY', 70, financialY + 45);

    ctx.fillStyle = colors.muted;
    ctx.font = '17px Inter, sans-serif';
    ctx.fillText('Total Charged Amount:', 70, financialY + 95);
    ctx.fillText('Total Amount Paid:', 70, financialY + 145);
    ctx.fillText('Remaining Balance Owed:', 70, financialY + 195);

    ctx.textAlign = 'right';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(`₵${charged.toFixed(2)}`, canvas.width - 70, financialY + 95);

    ctx.fillStyle = colors.success;
    ctx.fillText(`₵${paid.toFixed(2)}`, canvas.width - 70, financialY + 145);

    ctx.fillStyle = balance > 0 ? colors.accent : colors.success;
    ctx.fillText(
      balance > 0 ? `₵${balance.toFixed(2)}` : 'SETTLED (PAID IN FULL)',
      canvas.width - 70,
      financialY + 195
    );

    // Notes line if any
    if (record.notes) {
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.muted;
      ctx.font = 'italic 13px Inter, sans-serif';
      const truncatedNotes =
        record.notes.length > 70 ? record.notes.substring(0, 67) + '...' : record.notes;
      ctx.fillText(`Note: ${truncatedNotes}`, 70, financialY + 235);
    }
  } else {
    // ================= APPRENTICE / WORK ORDER =================
    // Measurements Title
    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('PRECISION MEASUREMENTS', 40, 345);

    ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
    ctx.beginPath();
    ctx.moveTo(40, 355);
    ctx.lineTo(canvas.width - 40, 355);
    ctx.stroke();

    // Measurements Table
    const drawList = (items: { label: string; value: string }[], startX: number, startY: number) => {
      let y = startY;
      items.forEach((item) => {
        if (item.value) {
          ctx.fillStyle = colors.muted;
          ctx.font = '16px Inter, sans-serif';
          ctx.fillText(item.label, startX, y);

          ctx.fillStyle = colors.text;
          ctx.font = 'bold 18px Inter, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${item.value}"`, startX + 320, y);
          ctx.textAlign = 'left';

          y += 34;
        }
      });
      return y;
    };

    const topMeasurements = [
      { label: 'Half Back', value: record.halfBack },
      { label: 'Full Back', value: record.fullBack },
      { label: 'Chest', value: record.chest },
      { label: 'Stomach', value: record.stomach },
      { label: 'Sleeves', value: record.sleeves },
      { label: 'Top Length', value: record.topLength },
      { label: 'Arm', value: record.arm },
      { label: 'Shoulder', value: record.shoulder },
      { label: 'Neck', value: record.neck },
      { label: 'Wrist', value: record.wrist },
      { label: 'Agbada', value: record.agbada },
      { label: 'Cap', value: record.cap },
    ];

    const downMeasurements = [
      { label: 'Waist', value: record.waist },
      { label: 'Down Length', value: record.downLength },
      { label: 'Hip', value: record.hip },
      { label: 'Bass', value: record.bass },
      { label: 'Thigh', value: record.thigh },
      { label: 'Knee', value: record.knee },
      { label: 'Inseam', value: record.inseam },
      { label: 'Outseam', value: record.outseam },
    ];

    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('TOP GARMENT', 40, 388);
    drawList(topMeasurements, 40, 420);

    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('BOTTOM GARMENT', 440, 388);
    drawList(downMeasurements, 440, 420);

    // Financial Summary Box
    const financialY = 880;
    ctx.fillStyle = colors.cardBg;
    ctx.roundRect?.(40, financialY, canvas.width - 80, 180, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = colors.gold;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText('FINANCIAL SUMMARY', 70, financialY + 40);

    ctx.fillStyle = colors.muted;
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Total Charged:', 70, financialY + 78);
    ctx.fillText('Amount Paid:', 70, financialY + 114);
    ctx.fillText('Balance Owed:', 70, financialY + 150);

    ctx.textAlign = 'right';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`₵${charged.toFixed(2)}`, canvas.width - 70, financialY + 78);

    ctx.fillStyle = colors.success;
    ctx.fillText(`₵${paid.toFixed(2)}`, canvas.width - 70, financialY + 114);

    ctx.fillStyle = balance > 0 ? colors.accent : colors.success;
    ctx.fillText(balance > 0 ? `₵${balance.toFixed(2)}` : 'SETTLED', canvas.width - 70, financialY + 150);
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.muted;
  ctx.font = 'italic 15px Inter, sans-serif';
  ctx.fillText('Thank you for choosing Lemaire Atelier.', canvas.width / 2, canvas.height - 65);
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText('Precision tailoring · Timeless luxury', canvas.width / 2, canvas.height - 42);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate image blob'));
    }, 'image/png');
  });
};

/**
 * Handles sharing the record as an image or downloading it based on recipient type.
 */
export const shareRecord = async (
  record: Record,
  recipient: ReceiptRecipient = 'customer'
) => {
  try {
    const isCustomer = recipient === 'customer';
    const blob = await generateReceipt(record, recipient);
    const suffix = isCustomer ? 'Customer_Receipt' : 'Work_Order';
    const filename = `${record.name.replace(/\s+/g, '_')}_${suffix}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    const shareTitle = isCustomer
      ? `${record.name} - Official Invoice & Receipt`
      : `${record.name} - Technical Work Order`;

    const shareText = isCustomer
      ? `Invoice and receipt details for ${record.name} from Lemaire Atelier.`
      : `Tailoring measurements and work order specifications for ${record.name}.`;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: shareTitle,
        text: shareText,
      });
    } else {
      // Fallback: Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Failed to share:', error);
      alert('Failed to generate shareable image.');
    }
  }
};
