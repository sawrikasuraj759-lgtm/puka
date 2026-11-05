import sharp from 'sharp';

export interface MenuCardItem {
  name: string;
  desc: string;
  capsule: string;
}

export type MenuTheme = 'purple' | 'cyan' | 'gold' | 'red' | 'green' | 'pink' | 'blue';

export interface MenuCardOptions {
  title: string;
  subtitle?: string;
  cards: MenuCardItem[];
  footer?: string;
  theme?: MenuTheme;
  icon?: string;
}

const cardCache = new Map<string, Buffer>();

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

const THEME_PALETTES: Record<MenuTheme, {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  border: string;
  cardStart: string;
  cardEnd: string;
  cardBorder: string;
  cardInnerGlow: string;
  titleLight: string;
  titleDark: string;
  subtitle: string;
  descText: string;
  pillBorder: string;
  pillText: string;
  iconBg: string;
  iconStroke: string;
  footerText: string;
}> = {
  purple: {
    bgStart: '#110324',
    bgMid: '#1b0638',
    bgEnd: '#090114',
    border: '#7e22ce',
    cardStart: '#250b47',
    cardEnd: '#130426',
    cardBorder: '#9333ea',
    cardInnerGlow: '#c084fc',
    titleLight: '#f5f3ff',
    titleDark: '#c084fc',
    subtitle: '#d8b4fe',
    descText: '#c4b5fd',
    pillBorder: '#a855f7',
    pillText: '#f3e8ff',
    iconBg: '#581c87',
    iconStroke: '#c084fc',
    footerText: '#a78bfa',
  },
  blue: {
    bgStart: '#041129',
    bgMid: '#0a1d47',
    bgEnd: '#020917',
    border: '#2563eb',
    cardStart: '#0f2759',
    cardEnd: '#06132f',
    cardBorder: '#3b82f6',
    cardInnerGlow: '#60a5fa',
    titleLight: '#eff6ff',
    titleDark: '#60a5fa',
    subtitle: '#93c5fd',
    descText: '#bfdbfe',
    pillBorder: '#3b82f6',
    pillText: '#dbeafe',
    iconBg: '#1e40af',
    iconStroke: '#93c5fd',
    footerText: '#60a5fa',
  },
  cyan: {
    bgStart: '#03171e',
    bgMid: '#062833',
    bgEnd: '#020d11',
    border: '#0891b2',
    cardStart: '#0b3947',
    cardEnd: '#041b24',
    cardBorder: '#06b6d4',
    cardInnerGlow: '#22d3ee',
    titleLight: '#ecfeff',
    titleDark: '#22d3ee',
    subtitle: '#67e8f9',
    descText: '#a5f3fc',
    pillBorder: '#06b6d4',
    pillText: '#cffafe',
    iconBg: '#155e75',
    iconStroke: '#67e8f9',
    footerText: '#22d3ee',
  },
  gold: {
    bgStart: '#1c1303',
    bgMid: '#2e1f06',
    bgEnd: '#0f0a01',
    border: '#d97706',
    cardStart: '#422c07',
    cardEnd: '#211603',
    cardBorder: '#f59e0b',
    cardInnerGlow: '#fbbf24',
    titleLight: '#fffbeb',
    titleDark: '#fbbf24',
    subtitle: '#fde68a',
    descText: '#fde68a',
    pillBorder: '#f59e0b',
    pillText: '#fef3c7',
    iconBg: '#78350f',
    iconStroke: '#fde68a',
    footerText: '#fbbf24',
  },
  red: {
    bgStart: '#1f0407',
    bgMid: '#33080e',
    bgEnd: '#120104',
    border: '#dc2626',
    cardStart: '#4a0b14',
    cardEnd: '#240409',
    cardBorder: '#ef4444',
    cardInnerGlow: '#f87171',
    titleLight: '#fef2f2',
    titleDark: '#f87171',
    subtitle: '#fca5a5',
    descText: '#fecaca',
    pillBorder: '#ef4444',
    pillText: '#fee2e2',
    iconBg: '#7f1d1d',
    iconStroke: '#fca5a5',
    footerText: '#f87171',
  },
  green: {
    bgStart: '#041c10',
    bgMid: '#082e1b',
    bgEnd: '#020f08',
    border: '#059669',
    cardStart: '#0d4227',
    cardEnd: '#052314',
    cardBorder: '#10b981',
    cardInnerGlow: '#34d399',
    titleLight: '#ecfdf5',
    titleDark: '#34d399',
    subtitle: '#6ee7b7',
    descText: '#a7f3d0',
    pillBorder: '#10b981',
    pillText: '#d1fae5',
    iconBg: '#064e3b',
    iconStroke: '#6ee7b7',
    footerText: '#34d399',
  },
  pink: {
    bgStart: '#210419',
    bgMid: '#38072b',
    bgEnd: '#12020d',
    border: '#db2777',
    cardStart: '#4a0c39',
    cardEnd: '#26041c',
    cardBorder: '#ec4899',
    cardInnerGlow: '#f472b6',
    titleLight: '#fdf2f8',
    titleDark: '#f472b6',
    subtitle: '#f9a8d4',
    descText: '#fbcfe8',
    pillBorder: '#ec4899',
    pillText: '#fce7f3',
    iconBg: '#831843',
    iconStroke: '#f9a8d4',
    footerText: '#f472b6',
  },
};

export async function generateMenuCardImage(options: MenuCardOptions): Promise<Buffer> {
  const themeKey = options.theme || 'purple';
  const cacheKey = `${options.title}_${themeKey}_${options.cards.length}_${options.cards.map(c => c.name).join(',')}`;
  if (cardCache.has(cacheKey)) {
    return cardCache.get(cacheKey)!;
  }

  const p = THEME_PALETTES[themeKey] || THEME_PALETTES.purple;
  const { title, subtitle = 'Tap to copy!', cards, footer = '⚡ YASHI HALLS MINI • WA ASSISTANT ⚡', icon = '✦' } = options;
  const width = 1080;
  const headerHeight = 200;
  const cardRowHeight = 150;
  const rowCount = Math.ceil(cards.length / 2);
  const footerHeight = 90;
  const height = headerHeight + (rowCount * cardRowHeight) + footerHeight;

  const cardWidth = 485;
  const cardHeight = 130;
  const leftColX = 40;
  const rightColX = 555;
  const cardStartY = 175;

  let cardsSvg = '';

  cards.forEach((card, index) => {
    const isRightCol = index % 2 === 1;
    const rowIndex = Math.floor(index / 2);
    const x = isRightCol ? rightColX : leftColX;
    const y = cardStartY + (rowIndex * cardRowHeight);

    const safeName = escapeXml(card.name.toUpperCase());
    const safeDesc = escapeXml(card.desc.toUpperCase());
    const safeCapsule = escapeXml(card.capsule.split(' ')[0]);

    // Compute capsule width based on text length
    const capsuleWidth = Math.min(cardWidth - 60, Math.max(140, safeCapsule.length * 15 + 36));
    const capsuleX = x + (cardWidth - capsuleWidth) / 2;

    cardsSvg += `
    <!-- Card ${index + 1}: ${safeName} -->
    <g>
      <!-- Card background -->
      <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="22" ry="22" fill="url(#cardGrad)" stroke="${p.cardBorder}" stroke-width="2.5" />
      
      <!-- Subtle top inner glow line -->
      <path d="M ${x + 20} ${y + 2} L ${x + cardWidth - 20} ${y + 2}" stroke="${p.cardInnerGlow}" stroke-width="1.8" stroke-opacity="0.35" stroke-linecap="round" />

      <!-- Title text -->
      <text x="${x + cardWidth / 2}" y="${y + 36}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" fill="${p.titleLight}" letter-spacing="1.2">${safeName}</text>
      
      <!-- Subtitle description -->
      <text x="${x + cardWidth / 2}" y="${y + 63}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="600" font-size="13" fill="${p.descText}" letter-spacing="0.5" fill-opacity="0.88">${safeDesc}</text>
      
      <!-- Capsule Pill -->
      <rect x="${capsuleX}" y="${y + 76}" width="${capsuleWidth}" height="${38}" rx="15" ry="15" fill="#070110" stroke="${p.pillBorder}" stroke-width="2" />
      
      <!-- Capsule Text -->
      <text x="${x + cardWidth / 2}" y="${y + 102}" text-anchor="middle" font-family="'Courier New', Courier, monospace, sans-serif" font-weight="800" font-size="19" fill="${p.pillText}" letter-spacing="0.6">${safeCapsule}</text>
    </g>
    `;
  });

  const renderMenuSvg = (phase: number) => {
    const orbR = phase === 1 ? 24 : phase === 2 ? 21 : 18;
    const orbOpacity = phase === 1 ? 0.85 : phase === 2 ? 0.65 : 0.45;
    const borderOpacity = phase === 1 ? 0.85 : phase === 2 ? 0.65 : 0.45;
    const borderWidth = phase === 1 ? 3.5 : 2.5;
    const leftSparkle = phase === 1 ? '✧' : phase === 2 ? '✨' : '✦';
    const rightSparkle = phase === 1 ? '✦' : phase === 2 ? '⚡' : '✧';
    const centerSparkle = phase === 1 ? '✨' : '';

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background gradient -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${p.bgStart}" />
          <stop offset="35%" stop-color="${p.bgMid}" />
          <stop offset="70%" stop-color="${p.bgStart}" />
          <stop offset="100%" stop-color="${p.bgEnd}" />
        </linearGradient>

        <!-- Card gradient -->
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${p.cardStart}" />
          <stop offset="100%" stop-color="${p.cardEnd}" />
        </linearGradient>

        <!-- Header text gradient -->
        <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${p.titleLight}" />
          <stop offset="50%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="${p.titleDark}" />
        </linearGradient>

        <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="${phase === 1 ? 6 : 4}" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Canvas Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Outer Frame Border with Pulsing Glow -->
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="34" ry="34" fill="none" stroke="${p.border}" stroke-width="${borderWidth}" stroke-opacity="${borderOpacity}" />

      <!-- Corner Animated Sparkles -->
      <text x="80" y="80" font-size="24" fill="${p.cardInnerGlow}" text-anchor="middle">${leftSparkle}</text>
      <text x="${width - 80}" y="80" font-size="24" fill="${p.cardInnerGlow}" text-anchor="middle">${rightSparkle}</text>
      ${centerSparkle ? `<text x="${width / 2 + 130}" y="52" font-size="20" fill="#facc15" text-anchor="middle">${centerSparkle}</text>` : ''}

      <!-- Top Glow Orb Icon -->
      <circle cx="${width / 2}" cy="54" r="${orbR}" fill="${p.iconBg}" fill-opacity="${orbOpacity}" stroke="${p.iconStroke}" stroke-width="2.5" />
      <text x="${width / 2}" y="60" text-anchor="middle" font-size="20" fill="${p.titleLight}">${escapeXml(icon)}</text>

      <!-- Header Title -->
      <text x="${width / 2}" y="108" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="38" fill="url(#titleGrad)" letter-spacing="2.5">${escapeXml(title)}</text>

      <!-- Subtitle: Tap to copy! -->
      <text x="${width / 2}" y="142" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="22" fill="${p.subtitle}" letter-spacing="1.2">${escapeXml(subtitle)}</text>

      <!-- Cards Grid -->
      ${cardsSvg}

      <!-- Bottom Footer -->
      <text x="${width / 2}" y="${height - 34}" text-anchor="middle" font-family="'Courier New', Courier, monospace, sans-serif" font-weight="800" font-size="16" fill="${p.footerText}" fill-opacity="0.85" letter-spacing="2.2">${escapeXml(footer)}</text>
    </svg>
    `;
  };

  try {
    const rawFrames: Buffer[] = [];
    for (let phase = 0; phase < 3; phase++) {
      const frameBuffer = await sharp(Buffer.from(renderMenuSvg(phase)))
        .raw()
        .toBuffer({ resolveWithObject: true });
      rawFrames.push(frameBuffer.data);
    }

    const joined = Buffer.concat(rawFrames);
    const animatedGif = await sharp(joined, {
      raw: { width, height, channels: 4, pages: 3 }
    })
      .gif({ delay: 360, loop: 0 })
      .toBuffer();

    cardCache.set(cacheKey, animatedGif);
    return animatedGif;
  } catch (animErr) {
    // Fallback to high quality static PNG if animated GIF pipeline has any transient notice
    const pngBuffer = await sharp(Buffer.from(renderMenuSvg(0)))
      .png({ quality: 95, compressionLevel: 8 })
      .toBuffer();

    cardCache.set(cacheKey, pngBuffer);
    return pngBuffer;
  }
}

export async function generateWelcomeCardImage(options: {
  botName: string;
  userName?: string;
  phoneNumber?: string;
  logoBuffer?: Buffer | null;
  channelUrl?: string;
}): Promise<Buffer> {
  const width = 1000;
  const height = 560;
  const botName = options.botName || "YASHI HALLS MINI";
  const userName = options.userName || "Valued User";
  const phoneNumber = options.phoneNumber ? `+${options.phoneNumber.replace(/\D/g, '')}` : "+94 74 071 2934";
  const channelUrl = options.channelUrl || "https://whatsapp.com/channel/0029Vb927N4GJP8MS1yurM2Z";

  const safeBotName = escapeXml(botName.toUpperCase());
  const safeUserName = escapeXml(userName);
  const safePhone = escapeXml(phoneNumber);

  // Prepare rounded logo if provided
  let preparedLogo: Buffer | null = null;
  if (options.logoBuffer && options.logoBuffer.length > 0) {
    try {
      const circleMask = Buffer.from(
        `<svg width="130" height="130"><circle cx="65" cy="65" r="65" fill="#fff"/></svg>`
      );
      preparedLogo = await sharp(options.logoBuffer)
        .resize(130, 130, { fit: 'cover' })
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toBuffer();
    } catch {}
  }

  const renderWelcomeSvg = (phase: number) => {
    const ringR = phase === 1 ? 79 : phase === 2 ? 76 : 73;
    const ringOpacity = phase === 1 ? 0.95 : phase === 2 ? 0.85 : 0.75;
    const glowRadius = phase === 1 ? 165 : phase === 2 ? 145 : 130;
    const dotR = phase === 1 ? 7 : phase === 2 ? 6 : 5;
    const leftSparkle = phase === 1 ? '✧' : phase === 2 ? '✨' : '✦';
    const rightSparkle = phase === 1 ? '✦' : phase === 2 ? '⚡' : '✧';
    const crownSparkle = phase === 1 ? '✨' : '';

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090514" />
          <stop offset="35%" stop-color="#160829" />
          <stop offset="70%" stop-color="#0a1226" />
          <stop offset="100%" stop-color="#040914" />
        </linearGradient>

        <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="30%" stop-color="#c084fc" />
          <stop offset="70%" stop-color="#f472b6" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>

        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e1038" />
          <stop offset="100%" stop-color="#0d1424" />
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="${phase === 1 ? 10 : 8}" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Canvas Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Ambient Glow Orbs -->
      <circle cx="200" cy="120" r="${glowRadius}" fill="#a855f7" fill-opacity="0.14" filter="url(#glow)" />
      <circle cx="800" cy="140" r="${glowRadius + 20}" fill="#06b6d4" fill-opacity="0.14" filter="url(#glow)" />

      <!-- Outer Decorative Border -->
      <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="32" ry="32" fill="none" stroke="#7e22ce" stroke-width="${phase === 1 ? 3.5 : 2.5}" stroke-opacity="${phase === 1 ? 0.75 : 0.5}" />
      <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="28" ry="28" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.35" />

      <!-- Top Crown & Sparkles -->
      <text x="260" y="58" font-size="22" fill="#c084fc" text-anchor="middle">${leftSparkle}</text>
      <text x="500" y="58" text-anchor="middle" font-size="28">👑</text>
      <text x="740" y="58" font-size="22" fill="#38bdf8" text-anchor="middle">${rightSparkle}</text>
      ${crownSparkle ? `<text x="545" y="44" font-size="16" fill="#facc15" text-anchor="middle">${crownSparkle}</text>` : ''}

      <!-- Logo Outer Glowing Rings -->
      <circle cx="500" cy="145" r="${ringR}" fill="#130624" stroke="#a855f7" stroke-width="4" stroke-opacity="${ringOpacity}" filter="url(#glow)" />
      <circle cx="500" cy="145" r="70" fill="#080c16" stroke="#38bdf8" stroke-width="2" />

      <!-- Main Title -->
      <text x="500" y="258" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="url(#titleGrad)" letter-spacing="2">👑 ${safeBotName} 👑</text>

      <!-- Subtitle -->
      <text x="500" y="288" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="16" fill="#cbd5e1" letter-spacing="1">WHATSAPP AUTOMATION ASSISTANT • 24/7 ONLINE</text>

      <!-- Status Pill with Pulsing Live Dot -->
      <g transform="translate(370, 304)">
        <rect x="0" y="0" width="260" height="34" rx="17" ry="17" fill="#064e3b" stroke="#10b981" stroke-width="2" />
        <circle cx="22" cy="17" r="${dotR}" fill="#34d399" />
        <text x="135" y="22" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="13" fill="#6ee7b7" letter-spacing="1.2">● BOT CONNECTED (ONLINE)</text>
      </g>

      <!-- 3 Info Stat Cards Grid -->
      <!-- Card 1: User -->
      <g transform="translate(60, 356)">
        <rect width="260" height="96" rx="20" fill="url(#cardGrad)" stroke="#7e22ce" stroke-width="1.8" />
        <text x="130" y="34" text-anchor="middle" font-size="20">👤</text>
        <text x="130" y="56" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#a78bfa" letter-spacing="1">CONNECTED USER</text>
        <text x="130" y="78" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="14" fill="#ffffff">${safeUserName}</text>
      </g>

      <!-- Card 2: Phone -->
      <g transform="translate(370, 356)">
        <rect width="260" height="96" rx="20" fill="url(#cardGrad)" stroke="#06b6d4" stroke-width="1.8" />
        <text x="130" y="34" text-anchor="middle" font-size="20">📱</text>
        <text x="130" y="56" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#38bdf8" letter-spacing="1">LINKED PHONE</text>
        <text x="130" y="78" text-anchor="middle" font-family="'Courier New', Courier, monospace, sans-serif" font-weight="800" font-size="14" fill="#67e8f9">${safePhone}</text>
      </g>

      <!-- Card 3: Status -->
      <g transform="translate(680, 356)">
        <rect width="260" height="96" rx="20" fill="url(#cardGrad)" stroke="#10b981" stroke-width="1.8" />
        <text x="130" y="34" text-anchor="middle" font-size="20">⚡</text>
        <text x="130" y="56" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11" fill="#6ee7b7" letter-spacing="1">ENGINE STATUS</text>
        <text x="130" y="78" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="14" fill="#34d399">ACTIVE 24/7 (0ms)</text>
      </g>

      <!-- Bottom Channel Notice Bar -->
      <g transform="translate(60, 468)">
        <rect width="880" height="46" rx="14" fill="#0e1726" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 4" />
        <text x="440" y="20" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="12" fill="#93c5fd" letter-spacing="0.8">📢 OFFICIAL WHATSAPP CHANNEL:</text>
        <text x="440" y="36" text-anchor="middle" font-family="'Courier New', Courier, monospace, sans-serif" font-weight="800" font-size="11" fill="#38bdf8">${escapeXml(channelUrl)}</text>
      </g>

      <!-- Bottom Footer -->
      <text x="500" y="538" text-anchor="middle" font-family="'Courier New', Courier, monospace, sans-serif" font-weight="700" font-size="11" fill="#94a3b8" letter-spacing="2">⚡ POWERED BY YASHI HALLS MULTI-DEVICE 24/7 CLOUD ENGINE ⚡</text>
    </svg>
    `;
  };

  try {
    const rawFrames: Buffer[] = [];
    for (let phase = 0; phase < 3; phase++) {
      let frameSharp = sharp(Buffer.from(renderWelcomeSvg(phase)));
      if (preparedLogo) {
        frameSharp = frameSharp.composite([{
          input: preparedLogo,
          top: 80,
          left: 435,
        }]);
      }
      const rawObj = await frameSharp.raw().toBuffer({ resolveWithObject: true });
      rawFrames.push(rawObj.data);
    }

    const joined = Buffer.concat(rawFrames);
    const animatedGif = await sharp(joined, {
      raw: { width, height, channels: 4, pages: 3 }
    })
      .gif({ delay: 360, loop: 0 })
      .toBuffer();

    return animatedGif;
  } catch (err) {
    // Fallback to static PNG with logo
    let baseImage = await sharp(Buffer.from(renderWelcomeSvg(0))).png().toBuffer();
    if (preparedLogo) {
      baseImage = await sharp(baseImage)
        .composite([{ input: preparedLogo, top: 80, left: 435 }])
        .png({ quality: 95 })
        .toBuffer();
    }
    return baseImage;
  }
}
