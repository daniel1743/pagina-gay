const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48.png' },
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' }
];

function drawIcon(canvas, size) {
  const ctx = canvas.getContext('2d');

  // Fondo degradado
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#E4007C');
  gradient.addColorStop(0.5, '#9D4EDD');
  gradient.addColorStop(1, '#3C096C');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Borde redondeado
  const cornerRadius = size * 0.15;
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(size - cornerRadius, 0);
  ctx.quadraticCurveTo(size, 0, size, cornerRadius);
  ctx.lineTo(size, size - cornerRadius);
  ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
  ctx.lineTo(cornerRadius, size);
  ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = gradient;
  ctx.fill();

  // Dibujar burbujas de chat
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

  // Burbuja grande (izquierda)
  const bubble1Size = size * 0.35;
  const bubble1X = size * 0.3;
  const bubble1Y = size * 0.4;
  drawChatBubble(ctx, bubble1X, bubble1Y, bubble1Size, 'left');

  // Burbuja pequeña (derecha)
  const bubble2Size = size * 0.28;
  const bubble2X = size * 0.65;
  const bubble2Y = size * 0.55;
  drawChatBubble(ctx, bubble2X, bubble2Y, bubble2Size, 'right');

  // Corazón pequeño
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const heartSize = size * 0.15;
  const heartX = size * 0.7;
  const heartY = size * 0.28;
  drawHeart(ctx, heartX, heartY, heartSize);
}

function drawChatBubble(ctx, x, y, size, direction) {
  ctx.beginPath();
  const radius = size / 2;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  if (direction === 'left') {
    ctx.moveTo(x - radius * 0.5, y + radius * 0.5);
    ctx.lineTo(x - radius * 0.9, y + radius * 1.2);
    ctx.lineTo(x - radius * 0.2, y + radius * 0.7);
  } else {
    ctx.moveTo(x + radius * 0.5, y + radius * 0.5);
    ctx.lineTo(x + radius * 0.9, y + radius * 1.2);
    ctx.lineTo(x + radius * 0.2, y + radius * 0.7);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);

  ctx.bezierCurveTo(
    x, y,
    x - size / 2, y,
    x - size / 2, y + topCurveHeight
  );

  ctx.bezierCurveTo(
    x - size / 2, y + (size + topCurveHeight) / 2,
    x, y + (size + topCurveHeight) / 1.2,
    x, y + size
  );

  ctx.bezierCurveTo(
    x, y + (size + topCurveHeight) / 1.2,
    x + size / 2, y + (size + topCurveHeight) / 2,
    x + size / 2, y + topCurveHeight
  );

  ctx.bezierCurveTo(
    x + size / 2, y,
    x, y,
    x, y + topCurveHeight
  );

  ctx.closePath();
  ctx.fill();
}

// Generar todos los iconos
const publicDir = path.join(__dirname, 'public');

sizes.forEach(iconConfig => {
  const canvas = createCanvas(iconConfig.size, iconConfig.size);
  drawIcon(canvas, iconConfig.size);

  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(publicDir, iconConfig.name);

  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Generado: ${iconConfig.name}`);
});

// Copiar icon-48.png como favicon.ico (simplificado)
const faviconSource = path.join(publicDir, 'icon-48.png');
const faviconDest = path.join(publicDir, 'favicon.ico');
fs.copyFileSync(faviconSource, faviconDest);
console.log('✅ Generado: favicon.ico');

console.log('\n🎉 ¡Todos los iconos han sido generados exitosamente!');
