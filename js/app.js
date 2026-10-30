let currentType = 'url';

function switchType(type) {
  currentType = type;
  document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  ['url','text','wifi','email','phone','sms','vcard'].forEach(t => {
    document.getElementById('form-' + t).style.display = t === type ? 'block' : 'none';
  });
  document.getElementById('qr-output').classList.remove('show');
}

function getData() {
  switch (currentType) {
    case 'url':
      return document.getElementById('url-input').value.trim();
    case 'text':
      return document.getElementById('text-input').value.trim();
    case 'wifi': {
      const ssid = document.getElementById('wifi-ssid').value.trim();
      const pass = document.getElementById('wifi-pass').value;
      const sec  = document.getElementById('wifi-sec').value;
      if (!ssid) return null;
      return `WIFI:T:${sec};S:${ssid};P:${pass};;`;
    }
    case 'email': {
      const to  = document.getElementById('email-to').value.trim();
      if (!to) return null;
      const sub = encodeURIComponent(document.getElementById('email-subject').value.trim());
      const bod = encodeURIComponent(document.getElementById('email-body').value.trim());
      return `mailto:${to}${sub ? '?subject=' + sub : ''}${bod ? (sub ? '&' : '?') + 'body=' + bod : ''}`;
    }
    case 'phone': {
      const p = document.getElementById('phone-input').value.trim();
      return p ? `tel:${p}` : null;
    }
    case 'sms': {
      const p = document.getElementById('sms-phone').value.trim();
      if (!p) return null;
      const m = encodeURIComponent(document.getElementById('sms-msg').value.trim());
      return `smsto:${p}${m ? ':' + m : ''}`;
    }
    case 'vcard': {
      const first = document.getElementById('vc-first').value.trim();
      const last  = document.getElementById('vc-last').value.trim();
      if (!first && !last) return null;
      const phone = document.getElementById('vc-phone').value.trim();
      const email = document.getElementById('vc-email').value.trim();
      const org   = document.getElementById('vc-org').value.trim();
      const url   = document.getElementById('vc-url').value.trim();
      let v = `BEGIN:VCARD\nVERSION:3.0\nFN:${first} ${last}\nN:${last};${first};;;`;
      if (phone) v += `\nTEL:${phone}`;
      if (email) v += `\nEMAIL:${email}`;
      if (org)   v += `\nORG:${org}`;
      if (url)   v += `\nURL:${url}`;
      v += '\nEND:VCARD';
      return v;
    }
  }
  return null;
}

function generate() {
  const data = getData();
  if (!data) { alert('Please fill in the required fields.'); return; }

  const fgColor = document.getElementById('qr-color').value;
  const bgColor = document.getElementById('bg-color').value;
  const size    = parseInt(document.getElementById('qr-size').value);

  const canvas = document.getElementById('qr-canvas');
  canvas.width  = size;
  canvas.height = size;

  // Clear previous
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // QRCode.js renders into a temp div then we grab its canvas
  const tmp = document.createElement('div');
  tmp.style.display = 'none';
  document.body.appendChild(tmp);

  new QRCode(tmp, {
    text: data,
    width: size,
    height: size,
    colorDark: fgColor,
    colorLight: bgColor,
    correctLevel: QRCode.CorrectLevel.M
  });

  // QRCode.js creates an img inside tmp; wait a tick then draw onto our canvas
  setTimeout(() => {
    const img = tmp.querySelector('img') || tmp.querySelector('canvas');
    if (img) {
      if (img.tagName === 'CANVAS') {
        ctx.drawImage(img, 0, 0, size, size);
      } else {
        const i = new Image();
        i.onload = () => ctx.drawImage(i, 0, 0, size, size);
        i.src = img.src;
      }
    }
    document.body.removeChild(tmp);
  }, 50);

  document.getElementById('qr-output').classList.add('show');
  document.getElementById('qr-output').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadPNG() {
  const canvas = document.getElementById('qr-canvas');
  const link = document.createElement('a');
  link.download = 'qrcraft-qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function copyImage() {
  try {
    const canvas = document.getElementById('qr-canvas');
    canvas.toBlob(async blob => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      const btn = event.target;
      btn.textContent = '✅ Copied!';
      setTimeout(() => btn.textContent = '📋 Copy Image', 2000);
    });
  } catch (e) {
    alert('Copy not supported in this browser. Please use Download instead.');
  }
}
