/**
 * ZQ Baileys Helper (Enhanced WhatsApp Interactive Buttons & Native Flow System)
 * Grounded on https://github.com/zqdevelopers/zq_baileys_helper.git
 * 
 * Provides:
 * 1. Automatic binary node injection (biz, interactive, native_flow, bot).
 * 2. Private 1-on-1 chat bot node support ({ tag: 'bot', attrs: { biz_bot: '1' } }).
 * 3. Group chat biz node support.
 * 4. Multi-device MD patch (documentWithCaptionMessage wrapper when needed).
 * 5. Direct relayMessage execution bypassing Baileys content validator.
 * 6. Quick Replies, CTA URLs, Single Select Lists, and Copy Codes.
 */

import fs from 'fs';
import {
  proto,
  generateWAMessageFromContent,
  isJidGroup,
  generateMessageIDV2,
  normalizeMessageContent,
} from '@kaels/casileys';

export interface ButtonItem {
  id?: string;
  text?: string;
  displayText?: string;
  buttonId?: string;
  buttonText?: { displayText: string };
  name?: string;
  buttonParamsJson?: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface SendButtonsData {
  title?: string;
  subtitle?: string;
  text: string;
  footer?: string;
  buttons?: ButtonItem[];
  urls?: Array<{ displayText: string; url: string }>;
  copyCodes?: Array<{ displayText?: string; copyCode: string }>;
  sections?: ListSection[];
  buttonText?: string;
  image?: Buffer | string | { url: string };
  headerType?: number;
}

/**
 * Normalizes button input shapes into the native_flow button structure
 */
export function buildInteractiveButtons(buttons: ButtonItem[] = []): any[] {
  return buttons.map((b, i) => {
    // 1. Already native_flow formatted
    if (b && b.name && b.buttonParamsJson) {
      return b;
    }

    // 2. Simple legacy: { id, text }
    if (b && (b.id || b.text)) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || b.displayText || `Action ${i + 1}`,
          id: b.id || `quick_${i + 1}`,
        }),
      };
    }

    // 3. Old Baileys: { buttonId, buttonText: { displayText } }
    if (b && b.buttonId && b.buttonText?.displayText) {
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.buttonText.displayText,
          id: b.buttonId,
        }),
      };
    }

    return b;
  });
}

export function unwrapMessage(msg: any): any {
  let m = msg;
  let depth = 0;
  while (
    depth < 5 &&
    m &&
    (m.viewOnceMessage?.message ||
     m.viewOnceMessageV2?.message ||
     m.viewOnceMessageV2Extension?.message ||
     m.ephemeralMessage?.message ||
     m.documentWithCaptionMessage?.message)
  ) {
    m = m.viewOnceMessage?.message ||
        m.viewOnceMessageV2?.message ||
        m.viewOnceMessageV2Extension?.message ||
        m.ephemeralMessage?.message ||
        m.documentWithCaptionMessage?.message;
    depth++;
  }
  return m;
}

/**
 * Detects button or list type in normalized message
 */
export function getButtonType(rawMessage: any): string | null {
  const message = unwrapMessage(rawMessage);
  if (!message || typeof message !== 'object') return null;
  if (message.listMessage) return 'list';
  if (message.buttonsMessage) return 'buttons';
  if (message.interactiveMessage?.nativeFlowMessage) return 'native_flow';
  if (message.interactiveMessage?.carouselMessage) return 'native_flow';
  return null;
}

/**
 * Creates the exact binary node structure that official WhatsApp multi-device client expects.
 * Grounded on zq_baileys_helper getButtonArgs.
 */
export function getButtonArgs(rawMessage: any): any {
  const message = unwrapMessage(rawMessage);
  const nativeFlow = message?.interactiveMessage?.nativeFlowMessage;
  const isCarousel = Boolean(message?.interactiveMessage?.carouselMessage);
  const firstButtonName = nativeFlow?.buttons?.[0]?.name;

  if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
    return {
      tag: 'biz',
      attrs: {
        native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName,
      },
    };
  }

  // Generic & mixed interactive buttons or carousel (native_flow with v: '9', name: 'mixed')
  if (nativeFlow || message?.buttonsMessage || isCarousel) {
    return {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'interactive',
          attrs: {
            type: 'native_flow',
            v: '1',
          },
          content: [
            {
              tag: 'native_flow',
              attrs: {
                v: '9',
                name: 'mixed',
              },
            },
          ],
        },
      ],
    };
  }

  if (message?.listMessage) {
    return {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'list',
          attrs: {
            v: '2',
            type: 'product_list',
          },
        },
      ],
    };
  }

  return {
    tag: 'biz',
    attrs: {},
  };
}

/**
 * Patches message for WhatsApp Multi-Device client rendering if needed
 */
export function patchMessageForMdIfRequired(message: any): any {
  if (!message || typeof message !== 'object') return message;
  if (message.viewOnceMessage || message.interactiveMessage) return message;
  if (message.documentWithCaptionMessage?.message) return message;

  const requiresPatch = Boolean(
    message.buttonsMessage || message.listMessage
  );

  if (requiresPatch) {
    return {
      documentWithCaptionMessage: {
        message: { ...message },
      },
    };
  }
  return message;
}

/**
 * Sends an interactive message with binary additionalNodes injected directly into relayMessage.
 * Grounded on zq_baileys_helper sendInteractiveMessage.
 */
export async function sendInteractiveMessage(
  sock: any,
  jid: string,
  content: any,
  options: any = {}
): Promise<any> {
  if (!sock) {
    throw new Error('ZQ Baileys Helper: Active socket instance is required');
  }

  const userJid = sock.authState?.creds?.me?.id || sock.user?.id;
  const messageId = (typeof generateMessageIDV2 === 'function' ? generateMessageIDV2(userJid) : undefined) || options.messageId;

  const baseOptions = {
    logger: sock.logger,
    userJid,
    messageId,
    timestamp: new Date(),
    ...options,
  };

  const fullMsg = generateWAMessageFromContent(jid, content, baseOptions);

  // Normalize message content to determine required binary nodes
  const normalizedContent = typeof normalizeMessageContent === 'function'
    ? normalizeMessageContent(fullMsg.message)
    : fullMsg.message;

  const buttonType = getButtonType(normalizedContent);
  const additionalNodes = [...(options.additionalNodes || [])];

  if (buttonType) {
    // 1. Inject biz native flow node
    const buttonsNode = getButtonArgs(normalizedContent);
    additionalNodes.push(buttonsNode);

    // 2. Private 1-on-1 chats require a bot node with biz_bot: '1'
    const isPrivate = !isJidGroup(jid);
    if (isPrivate) {
      additionalNodes.push({
        tag: 'bot',
        attrs: { biz_bot: '1' },
      });
    }
  }

  // Patch for Multi-Device if requested
  if (options.mdPatch !== false) {
    const patched = patchMessageForMdIfRequired(fullMsg.message);
    if (patched !== fullMsg.message) {
      fullMsg.message = patched;
    }
  }

  // Directly relay via Baileys socket with binary nodes attached
  await sock.relayMessage(jid, fullMsg.message, {
    messageId: fullMsg.key.id,
    useCachedGroupMetadata: options.useCachedGroupMetadata,
    additionalAttributes: options.additionalAttributes || {},
    statusJidList: options.statusJidList,
    additionalNodes,
    ...(options.ai ? { AI: true } : {}),
  });

  return fullMsg;
}

/**
 * Main public convenience method: sendButtons (matches zq_baileys_helper API)
 */
export async function sendButtons(
  sock: any,
  jid: string,
  data: SendButtonsData,
  options: any = {}
): Promise<any> {
  const { title, subtitle, text = '', footer = '', buttons = [], urls = [], copyCodes = [], sections = [], buttonText } = data;

  const nativeButtons: any[] = [];

  // 1. Single select list dropdown - place FIRST so it renders as the primary touchable drawer
  if (sections && sections.length > 0) {
    nativeButtons.push({
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: buttonText || '📂 TOUCH TO OPEN MENU',
        sections: sections.map((s) => ({
          title: s.title,
          rows: s.rows.map((r) => ({
            id: r.id || (r as any).rowId,
            title: r.title,
            description: r.description || '',
          })),
        })),
      }),
    });
  }

  // 2. Quick reply buttons (up to 10 for interactive native flow)
  const quickReplies = buildInteractiveButtons(buttons);
  if (quickReplies && quickReplies.length > 0) {
    nativeButtons.push(...quickReplies.slice(0, 10));
  }

  // 3. CTA URL buttons
  if (urls && urls.length > 0) {
    for (const u of urls.slice(0, 2)) {
      nativeButtons.push({
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: u.displayText,
          url: u.url,
        }),
      });
    }
  }

  // 4. CTA Copy Code buttons
  if (copyCodes && copyCodes.length > 0) {
    for (const cc of copyCodes) {
      nativeButtons.push({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: cc.displayText || `📋 Copy: ${cc.copyCode}`,
          copy_code: cc.copyCode,
        }),
      });
    }
  }

  const interactiveMessage: any = {
    nativeFlowMessage: {
      buttons: nativeButtons,
    },
  };

  if (data.image && typeof sock.waUploadToServer === 'function') {
    try {
      const { prepareWAMessageMedia } = await import('@kaels/casileys');
      let mediaInput: any = null;
      if (Buffer.isBuffer(data.image)) {
        mediaInput = { image: data.image };
      } else if (typeof data.image === 'string') {
        if (data.image.startsWith('http://') || data.image.startsWith('https://')) {
          mediaInput = { image: { url: data.image } };
        } else if (fs.existsSync(data.image)) {
          mediaInput = { image: fs.readFileSync(data.image) };
        }
      } else if (typeof data.image === 'object' && (data.image as any).url) {
        mediaInput = { image: { url: (data.image as any).url } };
      }

      if (mediaInput) {
        const media = await prepareWAMessageMedia(mediaInput, { upload: sock.waUploadToServer });
        if (media?.imageMessage) {
          interactiveMessage.header = {
            title: title || subtitle || '',
            hasMediaAttachment: true,
            imageMessage: media.imageMessage,
          };
        }
      }
    } catch (mediaErr) {
      console.warn('[zq_baileys_helper] Notice while attaching image to header:', mediaErr);
    }
  }

  if (!interactiveMessage.header && (title || subtitle)) {
    interactiveMessage.header = {
      title: title || subtitle,
      hasMediaAttachment: false,
    };
  }

  if (text) {
    interactiveMessage.body = { text };
  }

  if (footer) {
    interactiveMessage.footer = { text: footer };
  }

  const payload = {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage,
      },
    },
  };

  return sendInteractiveMessage(sock, jid, payload, options);
}

/**
 * Public convenience method: sendListMessage (matches zq_baileys_helper API)
 */
export async function sendListMessage(
  sock: any,
  jid: string,
  data: {
    title?: string;
    text: string;
    buttonText: string;
    sections: ListSection[];
    footer?: string;
  },
  options: any = {}
): Promise<any> {
  const content = {
    listMessage: {
      title: data.title,
      description: data.text,
      buttonText: data.buttonText,
      listType: 1,
      sections: data.sections,
      footerText: data.footer,
    },
  };

  return sendInteractiveMessage(sock, jid, content, options);
}

export interface CardItem {
  id?: string;
  title?: string;
  body?: string;
  buttons?: ButtonItem[];
}

export interface SendCardsData {
  text?: string;
  footer?: string;
  cards: CardItem[];
  headerImage?: Buffer | string;
  headerImageUrl?: string;
  headerVideo?: Buffer | string;
  headerVideoUrl?: string;
  mediaCaption?: string;
}

/**
 * Public convenience method: sendCards (matches zq_baileys_helper API)
 * Supports multi-card carousel with optional header media and interactive buttons.
 */
export async function sendCards(
  sock: any,
  jid: string,
  data: SendCardsData,
  options: any = {}
): Promise<any> {
  if (!sock) {
    throw new Error('ZQ Baileys Helper: Active socket instance is required for sendCards');
  }

  const {
    text = '',
    footer = '',
    cards = [],
    headerImageUrl,
    headerVideoUrl,
    headerImage,
    headerVideo,
    mediaCaption,
  } = data;

  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('ZQ Baileys Helper: cards must be a non-empty array');
  }

  // 1. Send optional header media if provided
  try {
    const caption = mediaCaption != null ? mediaCaption : text || '';
    if (sock.sendMessage && (headerImageUrl || headerImage)) {
      const imgPayload = headerImage
        ? (Buffer.isBuffer(headerImage) ? headerImage : fs.existsSync(headerImage) ? fs.readFileSync(headerImage) : { url: headerImage })
        : { url: headerImageUrl };
      await sock.sendMessage(jid, { image: imgPayload, caption }, options);
    } else if (sock.sendMessage && (headerVideoUrl || headerVideo)) {
      const vidPayload = headerVideo
        ? (Buffer.isBuffer(headerVideo) ? headerVideo : fs.existsSync(headerVideo) ? fs.readFileSync(headerVideo) : { url: headerVideo })
        : { url: headerVideoUrl };
      await sock.sendMessage(jid, { video: vidPayload, caption }, options);
    }
  } catch (mediaErr: any) {
    console.warn('[zq_baileys_helper] sendCards header media notice:', mediaErr?.message || mediaErr);
  }

  // 2. Build button representations for the cards
  const buttons: ButtonItem[] = cards.map((c, i) => ({
    id: c.id || `card_${i + 1}`,
    displayText: c.title || c.body || `Card ${i + 1}`,
  }));

  const nativeButtons = buildInteractiveButtons(buttons);
  const contentText = (headerImageUrl || headerImage || headerVideoUrl || headerVideo) && mediaCaption != null ? '' : text;

  // Use nativeFlowMessage for multi-device support
  const interactiveMessage: any = {
    body: { text: contentText || 'Select an option:' },
    footer: footer ? { text: footer } : undefined,
    nativeFlowMessage: {
      buttons: nativeButtons,
    },
  };

  const payload = {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage,
      },
    },
  };

  return sendInteractiveMessage(sock, jid, payload, options);
}

export interface CarouselCard {
  title?: string;
  body: string;
  footer?: string;
  image?: Buffer | string | { url: string };
  buttons?: ButtonItem[];
  urls?: Array<{ displayText: string; url: string }>;
  copyCodes?: Array<{ displayText?: string; copyCode: string }>;
}

export interface SendCarouselData {
  text?: string;
  footer?: string;
  cards: CarouselCard[];
}

/**
 * Public convenience method: sendCarousel (WhatsApp Native Horizontal Swipeable Carousel)
 * Provides horizontally scrollable cards with separate photos, captions, and interactive buttons.
 */
export async function sendCarousel(
  sock: any,
  jid: string,
  data: SendCarouselData,
  options: any = {}
): Promise<any> {
  if (!sock) {
    throw new Error('ZQ Baileys Helper: Active socket instance is required for sendCarousel');
  }

  const { text = '', footer = '', cards = [] } = data;
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('ZQ Baileys Helper: sendCarousel requires a non-empty array of cards');
  }

  let prepareWAMessageMedia: any = null;
  try {
    const baileys = await import('@kaels/casileys');
    prepareWAMessageMedia = baileys.prepareWAMessageMedia;
  } catch {
    // fallback if import fails
  }

  // Load default lightweight thumbnail buffer so card image upload never hangs
  let defaultThumbBuf: Buffer | null = null;
  const thumbPath = path.resolve(process.cwd(), 'data', 'bot_card_thumb.jpg');
  if (fs.existsSync(thumbPath)) {
    try { defaultThumbBuf = fs.readFileSync(thumbPath); } catch {}
  }
  if (!defaultThumbBuf) {
    const optPath = path.resolve(process.cwd(), 'data', 'bot_logo_opt.jpg');
    if (fs.existsSync(optPath)) {
      try { defaultThumbBuf = fs.readFileSync(optPath); } catch {}
    }
  }

  const cardMessages: any[] = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const cardButtons: any[] = [];

    // 1. Quick replies
    if (c.buttons && c.buttons.length > 0) {
      cardButtons.push(...buildInteractiveButtons(c.buttons));
    }

    // 2. CTA URLs
    if (c.urls && c.urls.length > 0) {
      for (const u of c.urls) {
        cardButtons.push({
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: u.displayText,
            url: u.url,
            merchant_url: u.url,
            webview_interaction: false,
          }),
        });
      }
    }

    // 3. CTA Copy Codes
    if (c.copyCodes && c.copyCodes.length > 0) {
      for (const cc of c.copyCodes) {
        cardButtons.push({
          name: 'cta_copy',
          buttonParamsJson: JSON.stringify({
            display_text: cc.displayText || `📋 ${cc.copyCode}`,
            copy_code: cc.copyCode,
          }),
        });
      }
    }

    // Ensure at least 1 button per card
    if (cardButtons.length === 0) {
      cardButtons.push({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: `Select #${i + 1}`,
          id: `card_select_${i + 1}`,
        }),
      });
    }

    // Process image header: WhatsApp Carousel strictly requires header.hasMediaAttachment: true
    let header: any = undefined;
    if (prepareWAMessageMedia && typeof sock.waUploadToServer === 'function') {
      try {
        let mediaInput: any = null;
        if (Buffer.isBuffer(c.image)) {
          mediaInput = { image: c.image };
        } else if (typeof c.image === 'string') {
          if (c.image.startsWith('http://') || c.image.startsWith('https://')) {
            // Quick check if string URL or local file
            if (fs.existsSync(c.image)) {
              mediaInput = { image: fs.readFileSync(c.image) };
            } else {
              mediaInput = { image: { url: c.image } };
            }
          } else if (fs.existsSync(c.image)) {
            mediaInput = { image: fs.readFileSync(c.image) };
          }
        } else if (typeof c.image === 'object' && (c.image as any).url) {
          mediaInput = { image: { url: (c.image as any).url } };
        }

        if (!mediaInput && defaultThumbBuf) {
          mediaInput = { image: defaultThumbBuf };
        }

        if (mediaInput) {
          const media = await prepareWAMessageMedia(mediaInput, { upload: sock.waUploadToServer }).catch(() => null);
          if (media?.imageMessage) {
            header = {
              title: c.title || '',
              subtitle: c.subtitle || '',
              hasMediaAttachment: true,
              imageMessage: media.imageMessage,
            };
          }
        }
      } catch (err) {
        console.warn(`[zq_baileys_helper] sendCarousel notice uploading card #${i + 1} image:`, err);
      }
    }

    // Secondary fallback to guarantee hasMediaAttachment: true
    if (!header && defaultThumbBuf && prepareWAMessageMedia && typeof sock.waUploadToServer === 'function') {
      try {
        const media = await prepareWAMessageMedia({ image: defaultThumbBuf }, { upload: sock.waUploadToServer }).catch(() => null);
        if (media?.imageMessage) {
          header = {
            title: c.title || '',
            subtitle: c.subtitle || '',
            hasMediaAttachment: true,
            imageMessage: media.imageMessage,
          };
        }
      } catch {}
    }

    if (!header) {
      header = {
        title: c.title || '',
        hasMediaAttachment: false,
      };
    }

    cardMessages.push({
      header,
      body: { text: c.body || ' ' },
      footer: c.footer ? { text: c.footer } : undefined,
      nativeFlowMessage: {
        buttons: cardButtons,
        messageParamsJson: '{}',
      },
    });
  }

  // Direct top-level interactiveMessage (NOT wrapped in viewOnceMessage)
  const payload = {
    interactiveMessage: {
      header: {
        hasMediaAttachment: false,
      },
      body: text ? { text } : undefined,
      footer: footer ? { text: footer } : undefined,
      carouselMessage: {
        cards: cardMessages,
        messageVersion: 1,
      },
    },
  };

  return sendInteractiveMessage(sock, jid, payload, options);
}

/**
 * Public convenience method: sendTemplateButtons
 */
export async function sendTemplateButtons(
  sock: any,
  jid: string,
  data: { text: string; footer?: string; buttons: ButtonItem[] },
  options: any = {}
): Promise<any> {
  return sendButtons(
    sock,
    jid,
    {
      text: data.text,
      footer: data.footer,
      buttons: data.buttons,
    },
    options
  );
}

/* =========================================================================
 * 1. VOID BAILEYS ENGINE EXTENSIONS (darksasa1-eng/void-baileys)
 * ========================================================================= */

/**
 * Sends a native WhatsApp interactive Poll widget (Void Baileys style)
 */
export async function sendPoll(
  sock: any,
  jid: string,
  name: string,
  values: string[],
  selectableCount = 1,
  options: any = {}
): Promise<any> {
  if (!sock) throw new Error("Socket is required for sendPoll");
  if (!Array.isArray(values) || values.length < 2) {
    throw new Error("Poll must contain at least 2 options");
  }

  const cleanValues = values.slice(0, 12).map((v) => String(v).trim());
  return sock.sendMessage(
    jid,
    {
      poll: {
        name,
        values: cleanValues,
        selectableCount: Math.min(selectableCount, cleanValues.length),
      },
    },
    options
  );
}

/**
 * Sends a native WhatsApp Quiz widget with a single correct answer (Void Baileys style)
 */
export async function sendQuiz(
  sock: any,
  jid: string,
  question: string,
  optionsList: string[],
  correctIndex = 0,
  options: any = {}
): Promise<any> {
  if (!sock) throw new Error("Socket is required for sendQuiz");
  const cleanOptions = optionsList.slice(0, 10).map((v) => String(v).trim());
  const safeIdx = Math.max(0, Math.min(correctIndex, cleanOptions.length - 1));

  return sock.sendMessage(
    jid,
    {
      poll: {
        name: `🧠 [QUIZ] ${question}`,
        values: cleanOptions,
        selectableCount: 1,
        toAnnouncementGroup: false,
      },
    },
    options
  );
}

/**
 * Sends multiple media items formatted as a multi-media Album (Void Baileys style)
 */
export async function sendAlbum(
  sock: any,
  jid: string,
  images: Array<{ url?: string; buffer?: Buffer; caption?: string }>,
  mainCaption = "",
  options: any = {}
): Promise<any> {
  if (!sock) throw new Error("Socket is required for sendAlbum");
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("Images array cannot be empty");
  }

  const results: any[] = [];
  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const imgPayload = item.buffer
      ? item.buffer
      : item.url
      ? { url: item.url }
      : null;
    if (!imgPayload) continue;

    const caption = i === 0 ? mainCaption : item.caption || "";
    try {
      const res = await sock.sendMessage(
        jid,
        { image: imgPayload, caption },
        i === 0 ? options : {}
      );
      results.push(res);
      // Small 300ms delay to keep media album grouping intact in WhatsApp
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      console.warn(`[void-baileys album] failed image #${i + 1}:`, err);
    }
  }
  return results;
}

/**
 * Sends a syntax-highlighted code block (Void Baileys style)
 */
export async function sendCodeBlock(
  sock: any,
  jid: string,
  code: string,
  language = "typescript",
  options: any = {}
): Promise<any> {
  if (!sock) throw new Error("Socket is required for sendCodeBlock");
  const formatted = `\`\`\`${language}\n${code.trim()}\n\`\`\``;
  return sock.sendMessage(jid, { text: formatted }, options);
}

/**
 * Sends a clean monospace ASCII formatted table (Void Baileys style)
 */
export async function sendTable(
  sock: any,
  jid: string,
  headers: string[],
  rows: string[][],
  title = "DATA TABLE",
  options: any = {}
): Promise<any> {
  if (!sock) throw new Error("Socket is required for sendTable");

  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce(
      (max, row) => Math.max(max, (row[i] || "").length),
      0
    );
    return Math.max(h.length, maxRow);
  });

  const pad = (str: string, len: number) =>
    str + " ".repeat(Math.max(0, len - str.length));

  const border =
    "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const headerLine =
    "| " + headers.map((h, i) => pad(h, colWidths[i])).join(" | ") + " |";
  const rowLines = rows.map(
    (row) =>
      "| " +
      headers
        .map((_, i) => pad(row[i] || "", colWidths[i]))
        .join(" | ") +
      " |"
  );

  const tableStr = [border, headerLine, border, ...rowLines, border].join(
    "\n"
  );
  const text = `📊 *${title}*\n\`\`\`\n${tableStr}\n\`\`\``;

  return sock.sendMessage(jid, { text }, options);
}

/**
 * Interactive Tic-Tac-Toe Game Engine (Void Baileys game suite)
 */
export interface TicTacToeState {
  board: string[]; // 9 cells: '1'-'9' or 'X' or 'O'
  turn: 'X' | 'O';
  playerX: string;
  playerO: string; // 'BOT' or user JID
  isFinished: boolean;
  winner: string | null;
}

export class TicTacToeEngine {
  private games = new Map<string, TicTacToeState>();

  start(jid: string, playerX: string, playerO = "BOT"): TicTacToeState {
    const game: TicTacToeState = {
      board: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      turn: "X",
      playerX,
      playerO,
      isFinished: false,
      winner: null,
    };
    this.games.set(jid, game);
    return game;
  }

  get(jid: string): TicTacToeState | undefined {
    return this.games.get(jid);
  }

  end(jid: string) {
    this.games.delete(jid);
  }

  renderBoard(board: string[]): string {
    const b = board.map((c) => (c === "X" ? "❌" : c === "O" ? "⭕" : `[${c}]`));
    return `
 ─── ᴛɪᴄ-ᴛᴀᴄ-ᴛᴏᴇ ───
  ${b[0]} │ ${b[1]} │ ${b[2]}
 ─────┼─────┼─────
  ${b[3]} │ ${b[4]} │ ${b[5]}
 ─────┼─────┼─────
  ${b[6]} │ ${b[7]} │ ${b[8]}
 ───────────────────`.trim();
  }

  makeMove(
    jid: string,
    playerJid: string,
    position: number
  ): { success: boolean; message: string; game: TicTacToeState } {
    const game = this.games.get(jid);
    if (!game) {
      return { success: false, message: "No active game in this chat.", game: null as any };
    }
    if (game.isFinished) {
      return { success: false, message: "Game already finished! Start with .ttt", game };
    }

    const expectedPlayer = game.turn === "X" ? game.playerX : game.playerO;
    if (game.playerO !== "BOT" && playerJid !== expectedPlayer) {
      return {
        success: false,
        message: `It is @${expectedPlayer.split("@")[0]}'s turn (${game.turn})!`,
        game,
      };
    }

    const idx = position - 1;
    if (idx < 0 || idx > 8 || game.board[idx] === "X" || game.board[idx] === "O") {
      return {
        success: false,
        message: "Invalid or already occupied cell! Pick 1-9.",
        game,
      };
    }

    game.board[idx] = game.turn;

    // Check winner
    const win = this.checkWinner(game.board);
    if (win) {
      game.isFinished = true;
      game.winner = win === "X" ? game.playerX : game.playerO;
      return { success: true, message: `🎉 Player ${game.turn} WINS!`, game };
    }

    // Check draw
    if (game.board.every((c) => c === "X" || c === "O")) {
      game.isFinished = true;
      game.winner = "DRAW";
      return { success: true, message: "🤝 It's a DRAW!", game };
    }

    // Switch turn
    game.turn = game.turn === "X" ? "O" : "X";

    // If vs BOT and it is BOT turn
    if (!game.isFinished && game.playerO === "BOT" && game.turn === "O") {
      const botIdx = this.bestBotMove(game.board);
      if (botIdx !== -1) {
        game.board[botIdx] = "O";
        const botWin = this.checkWinner(game.board);
        if (botWin) {
          game.isFinished = true;
          game.winner = "BOT";
        } else if (game.board.every((c) => c === "X" || c === "O")) {
          game.isFinished = true;
          game.winner = "DRAW";
        } else {
          game.turn = "X";
        }
      }
    }

    return { success: true, message: "Move registered!", game };
  }

  private checkWinner(b: string[]): 'X' | 'O' | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6],           // diags
    ];
    for (const [x, y, z] of lines) {
      if (b[x] && b[x] === b[y] && b[y] === b[z]) {
        return b[x] as 'X' | 'O';
      }
    }
    return null;
  }

  private bestBotMove(b: string[]): number {
    // 1. Can bot win?
    for (let i = 0; i < 9; i++) {
      if (b[i] !== "X" && b[i] !== "O") {
        const copy = [...b];
        copy[i] = "O";
        if (this.checkWinner(copy) === "O") return i;
      }
    }
    // 2. Can player win? Block!
    for (let i = 0; i < 9; i++) {
      if (b[i] !== "X" && b[i] !== "O") {
        const copy = [...b];
        copy[i] = "X";
        if (this.checkWinner(copy) === "X") return i;
      }
    }
    // 3. Center
    if (b[4] !== "X" && b[4] !== "O") return 4;
    // 4. Corners
    const corners = [0, 2, 6, 8].filter((i) => b[i] !== "X" && b[i] !== "O");
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    // 5. Any open
    const open = b
      .map((c, i) => (c !== "X" && c !== "O" ? i : -1))
      .filter((i) => i !== -1);
    return open[0] ?? -1;
  }
}

/**
 * Message Scheduler (Void Baileys scheduleMessage)
 */
export interface ScheduledJob {
  id: string;
  jid: string;
  messageText: string;
  scheduledAt: number;
  timer: NodeJS.Timeout;
}

export class ScheduledMessageManager {
  private jobs = new Map<string, ScheduledJob>();

  schedule(
    sock: any,
    jid: string,
    messageText: string,
    delayMinutes: number
  ): { id: string; scheduledAt: number } {
    const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const scheduledAt = Date.now() + delayMinutes * 60 * 1000;

    const timer = setTimeout(async () => {
      try {
        await sock.sendMessage(jid, {
          text: `⏰ *[SCHEDULED MESSAGE DISPATCHED]*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 *Message:* ${messageText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n_Delivered automatically via YASHI HALLS Scheduler Engine_`,
        });
      } catch (err) {
        console.warn("[scheduleMessage] Delivery failed:", err);
      } finally {
        this.jobs.delete(id);
      }
    }, delayMinutes * 60 * 1000);

    this.jobs.set(id, { id, jid, messageText, scheduledAt, timer });
    return { id, scheduledAt };
  }

  cancel(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    clearTimeout(job.timer);
    this.jobs.delete(id);
    return true;
  }

  list(jid?: string): Array<{ id: string; text: string; inMinutes: number }> {
    const now = Date.now();
    const result: Array<{ id: string; text: string; inMinutes: number }> = [];
    for (const job of this.jobs.values()) {
      if (!jid || job.jid === jid) {
        const inMinutes = Math.max(0, Math.round((job.scheduledAt - now) / 60000));
        result.push({ id: job.id, text: job.messageText, inMinutes });
      }
    }
    return result;
  }
}

/* =========================================================================
 * 2. INNOVATORS SOFT BAILEYS EXTENSIONS (innovatorssoft/Baileys)
 * ========================================================================= */

/**
 * Bidirectional LID (Linked ID) and Phone Number (PN) resolver.
 * Handles WhatsApp's new LID format seamlessly across all bot operations.
 */
export class LidMappingManager {
  private pnToLid = new Map<string, string>();
  private lidToPn = new Map<string, string>();

  register(pn: string, lid: string) {
    if (!pn || !lid) return;
    const cleanPn = pn.split("@")[0].split(":")[0].replace(/\D/g, "");
    const cleanLid = lid.split("@")[0].split(":")[0];
    if (cleanPn) this.pnToLid.set(cleanPn, cleanLid);
    if (cleanLid) this.lidToPn.set(cleanLid, cleanPn);
  }

  resolveToPhone(jidOrLid: string): string {
    if (!jidOrLid) return "";
    const clean = jidOrLid.split("@")[0].split(":")[0];
    if (this.lidToPn.has(clean)) {
      return this.lidToPn.get(clean)!;
    }
    return clean.replace(/\D/g, "");
  }

  resolveToLid(phone: string): string | undefined {
    const clean = phone.replace(/\D/g, "");
    return this.pnToLid.get(clean);
  }
}

/**
 * Sends a Group Status announcement with optional media (Innovators Soft Baileys style)
 */
export async function sendGroupStatus(
  sock: any,
  groupJid: string,
  content: { text: string; image?: Buffer | string }
): Promise<any> {
  if (!sock) throw new Error("Socket is required for sendGroupStatus");

  const statusText = `📢 *[GROUP STATUS UPDATE]*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${content.text}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n> ⚡ *ＰＯＷＥＲＥＤ  ＢＹ   ＹＡＳＨＩ   ＨＡＬＬＳ*`;

  if (content.image) {
    const imgPayload = Buffer.isBuffer(content.image)
      ? content.image
      : { url: content.image };
    return sock.sendMessage(groupJid, {
      image: imgPayload,
      caption: statusText,
    });
  }

  return sock.sendMessage(groupJid, { text: statusText });
}

/* Singletons */
export const globalTicTacToe = new TicTacToeEngine();
export const globalScheduler = new ScheduledMessageManager();
export const globalLidMapper = new LidMappingManager();
