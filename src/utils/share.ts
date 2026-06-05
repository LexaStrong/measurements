import { Record } from './db';

/**
 * Generates a premium-looking receipt/invoice image using HTML Canvas.
 * Returns a Blob that can be shared or downloaded.
 */
export const generateReceipt = async (record: Record): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Dimensions for a mobile-friendly receipt (e.g., 800x1200)
  canvas.width = 800;
  canvas.height = 1200;

  // Colors
  const colors = {
    bg: '#1E1A18',
    gold: '#C9A96E',
    text: '#E8E2D9',
    muted: '#6B6560',
    border: '#3D3834',
    accent: '#C45C2A',
    success: '#4A7C59',
  };

  // Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient background decoration
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 600);
  gradient.addColorStop(0, 'rgba(201, 169, 110, 0.1)');
  gradient.addColorStop(1, 'rgba(30, 26, 24, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Borders
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Header
  ctx.fillStyle = colors.gold;
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEMAIRE ATELIER', canvas.width / 2, 100);

  ctx.fillStyle = colors.muted;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('OFFICIAL MEASUREMENT RECEIPT', canvas.width / 2, 130);

  // Client Info Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.roundRect?.(40, 160, canvas.width - 80, 160, 20);
  ctx.fill();
  
  ctx.textAlign = 'left';
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText(record.name, 70, 215);

  ctx.fillStyle = colors.muted;
  ctx.font = '18px Inter, sans-serif';
  ctx.fillText(`Phone: ${record.phone}`, 70, 245);
  ctx.fillText(`Date: ${new Date(record.date).toLocaleDateString()}`, 70, 275);
  ctx.fillText(`Garment: ${record.garment || 'Not specified'}`, 70, 305);

  // Measurements Title
  ctx.fillStyle = colors.gold;
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText('MEASUREMENTS', 40, 380);
  
  ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
  ctx.beginPath();
  ctx.moveTo(40, 390);
  ctx.lineTo(canvas.width - 40, 390);
  ctx.stroke();

  // Draw Measurements Table
  const drawList = (items: { label: string; value: string }[], startX: number, startY: number) => {
    let y = startY;
    items.forEach(item => {
      if (item.value) {
        ctx.fillStyle = colors.muted;
        ctx.font = '18px Inter, sans-serif';
        ctx.fillText(item.label, startX, y);
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${item.value}"`, startX + 320, y);
        ctx.textAlign = 'left';
        
        y += 40;
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
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText('TOP', 40, 430);
  drawList(topMeasurements, 40, 470);

  ctx.fillStyle = colors.gold;
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText('BOTTOM', 440, 430);
  drawList(downMeasurements, 440, 470);

  // Financial Summary Box
  const financialY = 850;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.roundRect?.(40, financialY, canvas.width - 80, 200, 20);
  ctx.fill();

  ctx.fillStyle = colors.gold;
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText('FINANCIAL SUMMARY', 70, financialY + 50);

  const charged = parseFloat(record.charged) || 0;
  const paid = parseFloat(record.paid) || 0;
  const balance = charged - paid;

  ctx.fillStyle = colors.muted;
  ctx.font = '18px Inter, sans-serif';
  ctx.fillText('Total Charged:', 70, financialY + 90);
  ctx.fillText('Amount Paid:', 70, financialY + 130);
  ctx.fillText('Balance Owed:', 70, financialY + 170);

  ctx.textAlign = 'right';
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText(`₵${charged.toFixed(2)}`, canvas.width - 70, financialY + 90);
  
  ctx.fillStyle = colors.success;
  ctx.fillText(`₵${paid.toFixed(2)}`, canvas.width - 70, financialY + 130);
  
  ctx.fillStyle = balance > 0 ? colors.accent : colors.success;
  ctx.fillText(balance > 0 ? `₵${balance.toFixed(2)}` : 'SETTLED', canvas.width - 70, financialY + 170);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.muted;
  ctx.font = 'italic 16px Inter, sans-serif';
  ctx.fillText('Thank you for choosing Lemaire Atelier.', canvas.width / 2, canvas.height - 100);
  ctx.fillText('Precision tailoring, timeless style.', canvas.width / 2, canvas.height - 75);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate image blob'));
    }, 'image/png');
  });
};

/**
 * Handles sharing the record as an image or downloading it.
 */
export const shareRecord = async (record: Record) => {
  try {
    const blob = await generateReceipt(record);
    const file = new File([blob], `${record.name.replace(/\s+/g, '_')}_Measurement.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${record.name} Measurements`,
        text: `Measurement details for ${record.name} from Lemaire Atelier.`
      });
    } else {
      // Fallback: Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.name.replace(/\s+/g, '_')}_Measurement.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to share:', error);
    alert('Failed to generate shareable image.');
  }
};
