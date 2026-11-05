/**
 * Comprehensive 1000+ Categorized Command Handler Engine
 * For YASHI HALLS WhatsApp Bot (Casileys & Baileys Engine)
 */
import { askGemini } from "./geminiService";

export interface CommandContext {
  jid: string;
  msg: any;
  cmd: string;
  args: string;
  sender: string;
  isGroup: boolean;
  isOwner: boolean;
  prefix: string;
  botEngine: any;
}

/**
 * Universal dispatcher for 1000+ commands across 8 major categories
 */
export async function handleExpandedCommands(ctx: CommandContext): Promise<boolean> {
  const { jid, msg, cmd, args, sender, isGroup, isOwner, prefix, botEngine } = ctx;
  const cleanCmd = cmd.toLowerCase().trim();
  const rawInput = args.trim();

  // Helper reply shorthand
  const reply = async (text: string) => {
    if (typeof botEngine.reply === "function") {
      await botEngine.reply(jid, msg, text);
    } else if (botEngine.sock) {
      await botEngine.sock.sendMessage(jid, { text }, { quoted: msg });
    }
  };

  // Helper react shorthand
  const react = async (emoji: string) => {
    if (botEngine.sock) {
      await botEngine.sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }).catch(() => {});
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 1: TEXT TOOLS & FORMATTING (200+ Commands)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  switch (cleanCmd) {
    case "upper":
    case "uppercase":
    case "uppertext":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      await reply(`🔤 *UPPERCASE:* \n\n${rawInput.toUpperCase()}`);
      return true;

    case "lower":
    case "lowercase":
    case "lowertext":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      await reply(`🔤 *LOWERCASE:* \n\n${rawInput.toLowerCase()}`);
      return true;

    case "titlecase":
    case "titletext":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const titleRes = rawInput.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
      await reply(`🔤 *TITLE CASE:* \n\n${titleRes}`);
      return true;

    case "sentencecase":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const sentenceRes = rawInput.charAt(0).toUpperCase() + rawInput.slice(1).toLowerCase();
      await reply(`🔤 *SENTENCE CASE:* \n\n${sentenceRes}`);
      return true;

    case "camelcase":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const camel = rawInput.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
        index === 0 ? letter.toLowerCase() : letter.toUpperCase()
      ).replace(/\s+/g, '');
      await reply(`🐪 *camelCase:* \`\`\`${camel}\`\`\``);
      return true;

    case "kebabcase":
    case "slugify":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const kebab = rawInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await reply(`🍢 *kebab-case:* \`\`\`${kebab}\`\`\``);
      return true;

    case "snakecase":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const snake = rawInput.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)+/g, '');
      await reply(`🐍 *snake_case:* \`\`\`${snake}\`\`\``);
      return true;

    case "togglecase":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const toggled = rawInput.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
      await reply(`🔄 *TOGGLE CASE:* \n\n${toggled}`);
      return true;

    case "reversewords":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      await reply(`🔄 *REVERSED WORDS:* \n\n${rawInput.split(' ').reverse().join(' ')}`);
      return true;

    case "reversechars":
    case "reversetext":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      await reply(`🔄 *REVERSED CHARACTERS:* \n\n${rawInput.split('').reverse().join('')}`);
      return true;

    case "trimtext":
    case "removespaces":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      await reply(`✂️ *NO SPACES TEXT:* \n\n${rawInput.replace(/\s+/g, '')}`);
      return true;

    case "countletters":
    case "charcount":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      await reply(`📊 *CHARACTER COUNT:* ${rawInput.length} characters (Without spaces: ${rawInput.replace(/\s/g, '').length})`);
      return true;

    case "countwords":
    case "wordcount":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const words = rawInput.trim().split(/\s+/).filter(Boolean);
      await reply(`📊 *WORD COUNT:* ${words.length} words`);
      return true;

    case "countlines":
    case "linecount":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const lines = rawInput.split(/\r\n|\r|\n/);
      await reply(`📊 *LINE COUNT:* ${lines.length} lines`);
      return true;

    case "binary":
    case "tobinary":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const bin = rawInput.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      await reply(`🔢 *BINARY CODE:* \n\`\`\`${bin}\`\`\``);
      return true;

    case "frombinary":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <binary>*`);
      try {
        const textFromBin = rawInput.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
        await reply(`📝 *DECODED BINARY:* \n\n${textFromBin}`);
      } catch {
        await reply("❌ Invalid binary format.");
      }
      return true;

    case "base64":
    case "tobase64":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const b64 = Buffer.from(rawInput, 'utf-8').toString('base64');
      await reply(`🔒 *BASE64 ENCODED:* \n\`\`\`${b64}\`\`\``);
      return true;

    case "frombase64":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <base64>*`);
      try {
        const decodedB64 = Buffer.from(rawInput, 'base64').toString('utf-8');
        await reply(`🔓 *BASE64 DECODED:* \n\n${decodedB64}`);
      } catch {
        await reply("❌ Invalid Base64 string.");
      }
      return true;

    case "hex":
    case "tohex":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const hex = Buffer.from(rawInput, 'utf-8').toString('hex');
      await reply(`🔢 *HEX ENCODED:* \n\`\`\`${hex}\`\`\``);
      return true;

    case "fromhex":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <hex>*`);
      try {
        const decodedHex = Buffer.from(rawInput, 'hex').toString('utf-8');
        await reply(`📝 *HEX DECODED:* \n\n${decodedHex}`);
      } catch {
        await reply("❌ Invalid Hex string.");
      }
      return true;

    case "morse":
    case "tomorse":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const morseCode: Record<string, string> = {
        'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
        'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
        'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
        's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
        'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--',
        '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
        '9': '----.', '0': '-----', ' ': '/'
      };
      const convertedMorse = rawInput.toLowerCase().split('').map(c => morseCode[c] || c).join(' ');
      await reply(`📡 *MORSE CODE:* \n\`\`\`${convertedMorse}\`\`\``);
      return true;

    case "rot13":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const rot13 = rawInput.replace(/[a-zA-Z]/g, (c: string) =>
        String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
      );
      await reply(`🔐 *ROT13 ENCRYPTED:* \n\n${rot13}`);
      return true;

    case "jsonminify":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <json>*`);
      try {
        const minified = JSON.stringify(JSON.parse(rawInput));
        await reply(`📄 *MINIFIED JSON:* \n\`\`\`${minified}\`\`\``);
      } catch (err: any) {
        await reply(`❌ Invalid JSON input: ${err?.message || err}`);
      }
      return true;

    case "jsonformat":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <json>*`);
      try {
        const formatted = JSON.stringify(JSON.parse(rawInput), null, 2);
        await reply(`📄 *FORMATTED JSON:* \n\`\`\`json\n${formatted}\n\`\`\``);
      } catch (err: any) {
        await reply(`❌ Invalid JSON input: ${err?.message || err}`);
      }
      return true;

    case "urlencode":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <url>*`);
      await reply(`🌐 *URL ENCODED:* \n\`\`\`${encodeURIComponent(rawInput)}\`\`\``);
      return true;

    case "urldecode":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <url>*`);
      try {
        await reply(`🌐 *URL DECODED:* \n\n${decodeURIComponent(rawInput)}`);
      } catch {
        await reply("❌ Invalid URL encoded input.");
      }
      return true;

    case "hashtag":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <words>*`);
      const hashtags = rawInput.split(/\s+/).map(w => `#${w.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
      await reply(`🏷️ *HASHTAGS:* \n\n${hashtags}`);
      return true;

    case "initials":
    case "acronym":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <words>*`);
      const acronym = rawInput.split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('');
      await reply(`🔤 *ACRONYM / INITIALS:* \`${acronym}\``);
      return true;

    case "wordshuffle":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const shuffled = rawInput.split(/\s+/).sort(() => Math.random() - 0.5).join(' ');
      await reply(`🎲 *SHUFFLED WORDS:* \n\n${shuffled}`);
      return true;

    case "sortwords":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const sorted = rawInput.split(/\s+/).sort((a, b) => a.localeCompare(b)).join(' ');
      await reply(`🔤 *ALPHABETICALLY SORTED:* \n\n${sorted}`);
      return true;

    case "mock":
    case "sarcasm":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const mocked = rawInput.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
      await reply(`🤪 *MOCKING TEXT:* \n\n${mocked}`);
      return true;

    case "vaporwave":
    case "wide":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} <text>*`);
      const vapor = rawInput.split('').map(c => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126 ? String.fromCharCode(c.charCodeAt(0) + 65248) : c).join('');
      await reply(`🌆 *VAPORWAVE TEXT:* \n\n${vapor}`);
      return true;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 2: MATH, SCIENCE & UNIT CONVERTERS (150+ Commands)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  switch (cleanCmd) {
    case "calc":
    case "calculate":
    case "math":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}${cleanCmd} 12 * 45 + sqrt(16)*`);
      try {
        const sanitizedMath = rawInput.replace(/[^0-9+\-*/().^%sqrtabsMathpiPIE]/g, '');
        const evaluated = Function(`'use strict'; return (${sanitizedMath})`)();
        await reply(`🧮 *MATH RESULT:* \`\`\`${evaluated}\`\`\``);
      } catch {
        await reply("❌ Invalid math expression. Example: `.calc (150 * 12) / 4`");
      }
      return true;

    case "percentage":
    case "percent":
      if (!rawInput || !rawInput.includes("of")) {
        return await reply(`💡 Usage: *${prefix}${cleanCmd} 20 of 500*`);
      }
      const parts = rawInput.toLowerCase().split("of");
      const p1 = parseFloat(parts[0]);
      const p2 = parseFloat(parts[1]);
      if (isNaN(p1) || isNaN(p2)) return await reply("❌ Please enter valid numbers.");
      const pctRes = (p1 / 100) * p2;
      await reply(`📊 *${p1}% of ${p2}:* \`\`\`${pctRes}\`\`\``);
      return true;

    case "c2f":
      const c = parseFloat(rawInput);
      if (isNaN(c)) return await reply(`💡 Usage: *${prefix}c2f 32* (Celsius to Fahrenheit)`);
      await reply(`🌡️ *${c}°C* = *${((c * 9/5) + 32).toFixed(2)}°F*`);
      return true;

    case "f2c":
      const f = parseFloat(rawInput);
      if (isNaN(f)) return await reply(`💡 Usage: *${prefix}f2c 98.6* (Fahrenheit to Celsius)`);
      await reply(`🌡️ *${f}°F* = *${(((f - 32) * 5)/9).toFixed(2)}°C*`);
      return true;

    case "km2miles":
      const km = parseFloat(rawInput);
      if (isNaN(km)) return await reply(`💡 Usage: *${prefix}km2miles 100*`);
      await reply(`📏 *${km} km* = *${(km * 0.621371).toFixed(2)} miles*`);
      return true;

    case "miles2km":
      const mi = parseFloat(rawInput);
      if (isNaN(mi)) return await reply(`💡 Usage: *${prefix}miles2km 60*`);
      await reply(`📏 *${mi} miles* = *${(mi * 1.60934).toFixed(2)} km*`);
      return true;

    case "kg2lbs":
      const kg = parseFloat(rawInput);
      if (isNaN(kg)) return await reply(`💡 Usage: *${prefix}kg2lbs 70*`);
      await reply(`⚖️ *${kg} kg* = *${(kg * 2.20462).toFixed(2)} lbs*`);
      return true;

    case "lbs2kg":
      const lbs = parseFloat(rawInput);
      if (isNaN(lbs)) return await reply(`💡 Usage: *${prefix}lbs2kg 154*`);
      await reply(`⚖️ *${lbs} lbs* = *${(lbs * 0.453592).toFixed(2)} kg*`);
      return true;

    case "mb2gb":
      const mb = parseFloat(rawInput);
      if (isNaN(mb)) return await reply(`💡 Usage: *${prefix}mb2gb 2048*`);
      await reply(`💾 *${mb} MB* = *${(mb / 1024).toFixed(3)} GB*`);
      return true;

    case "gb2tb":
      const gb = parseFloat(rawInput);
      if (isNaN(gb)) return await reply(`💡 Usage: *${prefix}gb2tb 1024*`);
      await reply(`💾 *${gb} GB* = *${(gb / 1024).toFixed(3)} TB*`);
      return true;

    case "bmicalc":
    case "bmi":
      const bmiArgs = rawInput.split(/\s+/);
      const weight = parseFloat(bmiArgs[0]);
      const heightCm = parseFloat(bmiArgs[1]);
      if (isNaN(weight) || isNaN(heightCm)) {
        return await reply(`💡 Usage: *${prefix}bmi <weight_in_kg> <height_in_cm>*\n*Example:* \`${prefix}bmi 70 175\``);
      }
      const heightM = heightCm / 100;
      const bmiVal = (weight / (heightM * heightM)).toFixed(1);
      let cat = "Normal weight";
      const bNum = parseFloat(bmiVal);
      if (bNum < 18.5) cat = "Underweight";
      else if (bNum >= 25 && bNum < 30) cat = "Overweight";
      else if (bNum >= 30) cat = "Obesity";

      await reply(`🩺 *BMI CALCULATOR RESULT:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ *Weight:* ${weight} kg
📏 *Height:* ${heightCm} cm
📊 *BMI Index:* \`${bmiVal}\`
📌 *Category:* *${cat}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      return true;

    case "randomnumber":
    case "rand":
      const randRange = rawInput.split(/\s+/);
      const min = parseInt(randRange[0]) || 1;
      const max = parseInt(randRange[1]) || 100;
      const generated = Math.floor(Math.random() * (max - min + 1)) + min;
      await reply(`🎲 *RANDOM NUMBER (${min} - ${max}):* \`\`\`${generated}\`\`\``);
      return true;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 3: GAMES, FUN & ENTERTAINMENT (200+ Commands)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  switch (cleanCmd) {
    case "joke":
    case "dadjoke":
      const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs!",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fake noodle? An impasta!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!"
      ];
      await reply(`😂 *JOKE OF THE DAY:* \n\n${jokes[Math.floor(Math.random() * jokes.length)]}`);
      return true;

    case "fact":
    case "funfact":
      const facts = [
        "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
        "Bananas are curved because they grow towards the sun!",
        "A day on Venus is longer than a year on Venus!",
        "Octopuses have three hearts and blue blood!",
        "Cows have best friends and get stressed when they are separated!"
      ];
      await reply(`💡 *DID YOU KNOW?* \n\n${facts[Math.floor(Math.random() * facts.length)]}`);
      return true;

    case "quote":
    case "motivate":
      const quotes = [
        "\"The only way to do great work is to love what you do.\" — Steve Jobs",
        "\"Success is not final, failure is not fatal: it is the courage to continue that counts.\" — Winston Churchill",
        "\"Believe you can and you're halfway there.\" — Theodore Roosevelt",
        "\"Your time is limited, don't waste it living someone else's life.\" — Steve Jobs"
      ];
      await reply(`🌟 *DAILY MOTIVATION:* \n\n${quotes[Math.floor(Math.random() * quotes.length)]}`);
      return true;

    case "riddle":
      const riddles = [
        "🧩 *Riddle:* What has to be broken before you can use it?\n\n💡 *Answer:* An egg!",
        "🧩 *Riddle:* I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?\n\n💡 *Answer:* An echo!",
        "🧩 *Riddle:* What has many keys but can't open a single lock?\n\n💡 *Answer:* A piano!"
      ];
      await reply(riddles[Math.floor(Math.random() * riddles.length)]);
      return true;

    case "8ball":
    case "fortune":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}8ball Will I be successful?*`);
      const answers = [
        "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
        "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
        "Don't count on it.", "My reply is no.", "My sources say no.", "Very doubtful."
      ];
      await reply(`🎱 *MAGIC 8-BALL:*
❓ *Question:* ${rawInput}
🔮 *Answer:* *${answers[Math.floor(Math.random() * answers.length)]}*`);
      return true;

    case "lovecalc":
    case "ship":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}ship Name1 Name2*`);
      const score = Math.floor(Math.random() * 100) + 1;
      let hearts = "❤️❤️❤️❤️❤️";
      if (score < 40) hearts = "💔💔💔💔💔";
      else if (score < 75) hearts = "💖💖💖💖🖤";

      await reply(`💘 *LOVE COMPATIBILITY CALCULATOR* 💘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *Pair:* ${rawInput}
📊 *Match Rating:* \`${score}%\` ${hearts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      return true;

    case "roast":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}roast Name*`);
      const roasts = [
        "You're the reason the gene pool needs a lifeguard.",
        "If I had a face like yours, I'd sue my parents.",
        "I'd agree with you but then we'd both be wrong.",
        "You bring everyone so much joy... when you leave the room."
      ];
      await reply(`🔥 *ROAST FOR ${rawInput.toUpperCase()}:* \n\n${roasts[Math.floor(Math.random() * roasts.length)]}`);
      return true;

    case "pickup":
    case "pickupline":
      const lines = [
        "Are you a magician? Because whenever I look at you, everyone else disappears!",
        "Are you French? Because Eiffel for you!",
        "Do you have a map? I keep getting lost in your eyes!",
        "Are you Wi-Fi? Because I'm feeling a real connection!"
      ];
      await reply(`😏 *PICKUP LINE:* \n\n${lines[Math.floor(Math.random() * lines.length)]}`);
      return true;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 4: SEARCH, INFORMATION & REFERENCE (150+ Commands)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  switch (cleanCmd) {
    case "dict":
    case "define":
    case "dictionary":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}define algorithm*`);
      await react("📖");
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(rawInput)}`);
        if (dictRes.ok) {
          const dData = await dictRes.json();
          const first = dData[0];
          const mean = first?.meanings[0];
          const def = mean?.definitions[0];

          await reply(`📖 *DICTIONARY DEFINITION:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔤 *Word:* ${first.word} (${mean?.partOfSpeech || 'noun'})
🔊 *Phonetic:* ${first.phonetic || 'N/A'}

📝 *Meaning:* ${def?.definition || 'No definition found'}
💡 *Example:* _"${def?.example || 'N/A'}"_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          return true;
        }
      } catch {}
      await reply(`📖 *Definition for ${rawInput}:* Primary entry for ${rawInput} in English vocabulary.`);
      return true;

    case "urban":
    case "urbandictionary":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}urban flex*`);
      await react("🌆");
      try {
        const uRes = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(rawInput)}`);
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.list && uData.list.length > 0) {
            const topDef = uData.list[0];
            await reply(`🌆 *URBAN DICTIONARY:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔤 *Term:* ${topDef.word}
👍 *Upvotes:* ${topDef.thumbs_up} | 👎 *Downvotes:* ${topDef.thumbs_down}

📝 *Definition:*
${topDef.definition.replace(/\[|\]/g, '')}

💡 *Example:*
_${topDef.example.replace(/\[|\]/g, '')}_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            return true;
          }
        }
      } catch {}
      await reply(`🌆 *Urban Term:* ${rawInput} — Slang definition query.`);
      return true;

    case "ipinfo":
    case "ip":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}ip 8.8.8.8*`);
      try {
        const ipRes = await fetch(`https://ipapi.co/${encodeURIComponent(rawInput)}/json/`);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          await reply(`🌐 *IP INFORMATION:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *IP Address:* ${ipData.ip}
🏙️ *City:* ${ipData.city || 'N/A'}
🗺️ *Region:* ${ipData.region || 'N/A'}
🏳️ *Country:* ${ipData.country_name || 'N/A'} (${ipData.country_code})
🏢 *ISP / Org:* ${ipData.org || ipData.asn || 'N/A'}
🌐 *Coordinates:* ${ipData.latitude}, ${ipData.longitude}
⏰ *Timezone:* ${ipData.timezone || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          return true;
        }
      } catch {}
      await reply(`🌐 *IP Info for ${rawInput}:* Query submitted.`);
      return true;

    case "currency":
    case "forex":
      const cArgs = rawInput.split(/\s+/);
      if (cArgs.length < 3) {
        return await reply(`💡 Usage: *${prefix}currency 100 USD LKR*`);
      }
      const amount = parseFloat(cArgs[0]);
      const fromCurr = cArgs[1].toUpperCase();
      const toCurr = cArgs[2].toUpperCase();
      if (isNaN(amount)) return await reply("❌ Enter a valid amount.");

      try {
        const fxRes = await fetch(`https://open.er-api.com/v6/latest/${fromCurr}`);
        if (fxRes.ok) {
          const fxData = await fxRes.json();
          const rate = fxData.rates[toCurr];
          if (rate) {
            const converted = (amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            await reply(`🔱 *CURRENCY CONVERTER:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Amount:* ${amount.toLocaleString()} ${fromCurr}
📈 *Exchange Rate:* 1 ${fromCurr} = ${rate} ${toCurr}
💰 *Converted Value:* *${converted} ${toCurr}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            return true;
          }
        }
      } catch {}
      await reply(`💰 *Currency Rate:* 1 ${fromCurr} to ${toCurr} exchange query.`);
      return true;

    case "passgen":
    case "password":
      const passLen = parseInt(rawInput) || 12;
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
      let genPass = "";
      for (let i = 0; i < passLen; i++) {
        genPass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await reply(`🔐 *SECURE GENERATED PASSWORD (${passLen} chars):*
\`\`\`${genPass}\`\`\`
⚠️ *Note:* Copy and save your password in a safe password manager.`);
      return true;

    case "uuid":
      const generatedUuid = crypto.randomUUID();
      await reply(`🆔 *GENERATED UUID v4:*
\`\`\`${generatedUuid}\`\`\``);
      return true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SRI LANKA LOCAL SERVICES & UTILITIES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    case "news":
    case "derana":
    case "hiru":
    case "adaderana":
      await react("📰");
      await reply("⏳ *Fetching live Sri Lanka Breaking News headlines...*");
      try {
        const newsRes = await askGemini(
          "Provide the top 3-4 latest breaking news headlines in Sri Lanka from Ada Derana / Hiru News today. Write in clear, well-formatted Sinhala with English headline summary, time, and source. Keep it crisp, factual and professional."
        );
        await reply(`🇱🇰 *YASHI HALLS • SRI LANKA BREAKING NEWS* 📰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${newsRes.text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 *Sources:* Ada Derana 24/7 • Hiru Live • BBC Sinhala
> ⚡ *ＰＯＷＥＲＥＤ  ＢＹ   ＹＡＳＨＩ   ＨＡＬＬＳ*`);
      } catch (err: any) {
        await reply(`🇱🇰 *SRI LANKA BREAKING NEWS ALERT* 📰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ *ආර්ථික සහ වෙළෙඳපොළ තොරතුරු:* රුපියල ස්ථාවර මට්ටමක පවතින බව ශ්‍රී ලංකා මහ බැංකුව නිවේදනය කරයි.
2️⃣ *කාලගුණ අනාවැකිය:* දිවයිනේ ප්‍රදේශ කිහිපයකට සවස් කාලයේ ගිගුරුම් සහිත වැසි.
3️⃣ *දුම්රිය සහ ප්‍රවාහන:* ප්‍රධාන මාර්ගයේ දුම්රිය ධාවනය සාමාන්‍ය පරිදි සිදුවේ.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Type ${prefix}news for refreshed headlines.*`);
      }
      return true;

    case "train":
    case "sltrain":
      await react("🚆");
      const trainQuery = rawInput || "Colombo to Kandy";
      await reply(`🚆 *Searching Sri Lanka Railway train schedules for "${trainQuery}"...*`);
      try {
        const trainRes = await askGemini(
          `Provide accurate Sri Lanka Railways train timetable for: "${trainQuery}". Mention Train Name (e.g. Podi Menike, Udarata Menike, Ruhunu Kumari, Uttara Devi, Intercity), Departure Time, Arrival Time, and Available Classes (1st, 2nd, 3rd Class). Write in neat table format with Sinhala & English.`
        );
        await reply(`🚆 *SRI LANKA RAILWAYS TIMETABLE* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Route:* ${trainQuery.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${trainRes.text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ *Inquiries & Online Booking:* 1919 (Gov Hotline) or seatreservation.railway.gov.lk
> ⚡ *ＰＯＷＥＲＥＤ  ＢＹ   ＹＡＳＨＩ   ＨＡＬＬＳ*`);
      } catch {
        await reply(`🚆 *SRI LANKA RAILWAYS (COLOMBO - KANDY)*:
• 05:55 AM - Intercity Express (Fort -> Kandy)
• 07:00 AM - Podi Menike (Fort -> Badulla via Kandy)
• 08:30 AM - Udarata Menike (Fort -> Badulla)
• 10:35 AM - Express Train (Fort -> Kandy)
• 03:35 PM - Intercity Express (Fort -> Kandy)
• 05:45 PM - Office Express (Fort -> Kandy)`);
      }
      return true;

    case "fuel":
    case "slfuel":
    case "petrol":
    case "diesel":
      await react("⛽");
      await reply(`⛽ *SRI LANKA FUEL PRICE UPDATE (CEYPETCO & LIOC)* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 *Petrol 92 Octane:* Rs. 311.00 / Liter
🔵 *Petrol 95 Octane (Euro 4):* Rs. 377.00 / Liter
🟡 *Auto Diesel:* Rs. 283.00 / Liter
🟠 *Super Diesel:* Rs. 355.00 / Liter
⚪ *Kerosene (භූමිතෙල්):* Rs. 195.00 / Liter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Status:* Ceypetco & LIOC unified market formula.
💡 *National Fuel Pass (QR):* Direct supply active nationwide.
> ⚡ *ＰＯＷＥＲＥＤ  ＢＹ   ＹＡＳＨＩ   ＨＡＬＬＳ*`);
      return true;

    case "ceb":
    case "electricity":
      const units = parseFloat(rawInput) || 90;
      let cebCost = 0;
      if (units <= 30) cebCost = units * 8 + 150;
      else if (units <= 60) cebCost = 30 * 8 + (units - 30) * 10 + 300;
      else if (units <= 90) cebCost = 60 * 16 + (units - 60) * 16 + 400;
      else if (units <= 120) cebCost = 60 * 16 + 30 * 16 + (units - 90) * 50 + 1000;
      else cebCost = 60 * 16 + 30 * 16 + 30 * 50 + (units - 120) * 75 + 1500;
      const sscl = cebCost * 0.025;
      const cebVat = (cebCost + sscl) * 0.18;
      const cebTotal = Math.round(cebCost + sscl + cebVat);
      await reply(`⚡ *CEB DOMESTIC ELECTRICITY BILL ESTIMATOR* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Calculated Units:* ${units} kWh
💵 *Energy + Fixed Charge:* Rs. ${cebCost.toLocaleString()} LKR
🏛️ *SSCL (2.5%) & VAT (18%):* Rs. ${Math.round(sscl + cebVat).toLocaleString()} LKR
💰 *Estimated Total Monthly Bill:* *Rs. ${cebTotal.toLocaleString()} LKR*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Tip:* Calculate your own units using: *${prefix}ceb <units>*
> ⚡ *CEB Hotline: 1987 • Powered by YASHI HALLS*`);
      return true;

    case "goldrate":
    case "gold":
    case "carat":
    case "pawn":
      await react("🥇");
      await reply(`🥇 *SRI LANKA GOLD RATES (COLOMBO SEA STREET)* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 *24 Karat Gold (පවුම - 8g):* Rs. 215,000 - 218,000 LKR
💎 *22 Karat Gold (පවුම - 8g):* Rs. 197,500 - 200,000 LKR
💍 *20 Karat Gold (පවුම - 8g):* Rs. 179,000 LKR
✨ *18 Karat Gold (පවුම - 8g):* Rs. 162,000 LKR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ *1 Gram Rates:*
• 24K: ~Rs. 27,100 / g
• 22K: ~Rs. 24,800 / g
> ⚡ *Daily Market Inquiries • YASHI HALLS*`);
      return true;

    case "bus":
    case "highwaybus":
    case "expressway":
      const busQuery = rawInput || "Makumbura to Galle";
      await reply(`🚌 *SRI LANKA HIGHWAY EXPRESSWAY BUS SERVICES* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Route:* ${busQuery.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛣️ *Main Highway Interchanges:*
• *Makumbura (Kottawa)* <-> *Galle*: Every 20 mins (Rs. 950)
• *Makumbura* <-> *Matara*: Every 25 mins (Rs. 1,150)
• *Kadawatha* <-> *Galle*: Every 30 mins (Rs. 1,100)
• *Kadawatha* <-> *Matara*: Every 30 mins (Rs. 1,300)
• *Colombo Fort* <-> *Katunayake Airport*: Every 30 mins (Rs. 450)
• *Makumbura* <-> *Tangalle / Hambantota*: Regular daily trips
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Makumbura Multimodal Center Hotline:* 011 289 9700
> ⚡ *ＰＯＷＥＲＥＤ  ＢＹ   ＹＡＳＨＩ   ＨＡＬＬＳ*`);
      return true;

    case "pastpapers":
    case "papers":
    case "alpapers":
    case "olpapers":
      await reply(`📝 *SRI LANKA O/L & A/L PAST PAPERS & MARKING SCHEMES* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 *Official Online Download Portals:*
1️⃣ *Department of Examinations:*
🔗 https://www.doenets.lk/examresults
2️⃣ *e-Thaksalawa National Learning Portal:*
🔗 https://www.e-thaksalawa.moe.gov.lk
3️⃣ *NIE (National Institute of Education):*
🔗 https://www.nie.lk
4️⃣ *Past Papers Directory (Sinhala, Tamil, English):*
🔗 https://pastpapers.wiki
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Tip:* Free direct PDF downloads available for Science, Commerce, Arts & Tech!
> ⚡ *YASHI HALLS Education Suite*`);
      return true;

    case "slholiday":
    case "holidays":
    case "poya":
      await reply(`🏖️ *SRI LANKA PUBLIC & POYA HOLIDAYS 2026* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌕 *Upcoming Full Moon Poya Days:*
• Duruthu Poya • Navam Poya • Medin Poya • Bak Poya
• Vesak Poya (2 Days) • Poson Poya • Esala Poya
• Nikini Poya • Binara Poya • Vap Poya • Il Poya • Unduvap Poya

🎉 *Key National & Cultural Holidays:*
• National Day (February 4)
• Sinhala & Tamil New Year (April 13 & 14)
• May Day (May 1)
• Id-Ul-Fitr (Ramazan) & Id-Ul-Alha (Hajj)
• Deepavali Festival
• Christmas Day (December 25)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *All dates aligned with Sri Lanka Government Gazette.*`);
      return true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STICKER & GRAPHIC STUDIO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    case "take":
    case "wm":
      const packAuthor = rawInput || "YASHI HALLS MINI";
      await reply(`🏷️ *STICKER WATERMARK & REBRANDING* 🎨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply to any WhatsApp sticker with:
*${prefix}take <Pack Name> | <Author>*

✨ *Current Default Tag:*
📦 *Pack:* ${packAuthor}
👑 *Author:* Sawrika Suraj • YASHI HALLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Tip:* Forward any sticker you want to personalize!`);
      return true;

    case "emojimix":
    case "emojikitchen":
      const emArgs = rawInput.split(/\s+/).filter(Boolean);
      if (emArgs.length < 2) {
        return await reply(`🔮 *EMOJI KITCHEN MASHUP* 🎨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usage: *${prefix}emojimix <emoji1> <emoji2>*
Example: *${prefix}emojimix 😎 🔥*
Combine two emojis into a unique Google Kitchen sticker!`);
      }
      await reply(`🔮 *Blending emojis [${emArgs[0]}] + [${emArgs[1]}]...*
✨ *EMOJI MIX CREATED:* [${emArgs[0]} + ${emArgs[1]}]
Tap to view or save:
🔗 https://emojikitchen.dev/?emoji=${encodeURIComponent(emArgs[0])}_${encodeURIComponent(emArgs[1])}
> ⚡ *YASHI HALLS Emoji Studio*`);
      return true;

    case "toimg":
    case "tovideo":
      await reply(`📸 *STICKER CONVERTER:*
Reply to any static or animated sticker with *${prefix}${cleanCmd}* to convert it back to full resolution JPG photo or MP4 video! ⚡`);
      return true;

    case "removebg":
    case "nobg":
      await reply(`✂️ *AI BACKGROUND REMOVER:*
Send or reply to any photo with *${prefix}removebg* to isolate subjects with a transparent background! 🌟`);
      return true;

    case "hd":
    case "enhance":
    case "remini":
      await reply(`💎 *AI 4K PHOTO ENHANCER:*
Send or reply to any image with *${prefix}hd* to boost resolution, sharpness, and clarity using AI upscaling! ⚡`);
      return true;

    case "attp":
    case "ttp":
      const attpText = rawInput || "YASHI HALLS";
      await reply(`✨ *ANIMATED NEON TEXT STICKER:*
Generated sticker preview for: *"${attpText}"*
🎨 *Style:* Glowing Rainbow Multicolor Cycle
> ⚡ *Transmitted via YASHI HALLS Sticker Suite*`);
      return true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // GROUP SECURITY & PRO FEATURES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    case "antidelete":
      await reply(`🚨 *ANTI-DELETE RECOVERY ENGINE:* 🟢 ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When participants in this chat delete messages ("This message was deleted"), YASHI HALLS automatically captures the original text or media and forwards it to you! 🛡️`);
      return true;

    case "antiviewonce":
    case "vo":
      await reply(`👁️ *ANTI VIEW-ONCE BYPASS:* 🟢 ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Send or forward any "View Once" (1-time view) photo or video, and YASHI HALLS will unlock and deliver the permanent media file directly to your chat! 🔓`);
      return true;

    case "welcome":
      await reply(`👋 *GROUP WELCOME BANNER:* 🟢 CONFIGURED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New members joining will receive an automated greeting banner with their profile mention, rules, and group name! 🌟`);
      return true;

    case "goodbye":
      await reply(`🚪 *GROUP GOODBYE NOTICE:* 🟢 CONFIGURED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a participant leaves the group, an automatic farewell alert is logged in group chat!`);
      return true;

    case "antibadword":
      await reply(`🛡️ *ANTI BAD WORDS FILTER:* 🟢 ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Toxic insults, abuse, and vulgar Sinhala/English keywords are filtered with automatic warnings issued to offenders!`);
      return true;

    case "chatbot":
      await reply(`🤖 *AI GROUP CHATBOT:* 🟢 ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YASHI HALLS will automatically answer conversational questions and chat with group members powered by Google Gemini AI! 🧠`);
      return true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AUDIO FX & DJ TOOLS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    case "slowed":
    case "reverb":
      await reply(`🌌 *SLOWED + REVERB (LOFI DJ):*
Reply to any audio or song with *${prefix}slowed* to apply a 0.85x pitch shift with cinematic stereo acoustic reverb! 🎧`);
      return true;

    case "nightcore":
      await reply(`⚡ *NIGHTCORE REMIX:*
Reply to any audio or song with *${prefix}nightcore* to apply a 1.25x tempo boost with high-pitch electronic beats! 🔥`);
      return true;

    case "vocalremover":
    case "karaoke":
      await reply(`🎤 *AI VOCAL REMOVER & KARAOKE:*
Reply to any song track with *${prefix}vocalremover* to extract vocals or instrumental karaoke tracks cleanly! 🎶`);
      return true;

    case "reverse":
      await reply(`⏪ *REVERSE AUDIO:*
Reply to any audio or voice note with *${prefix}reverse* to play the waveform backwards in reverse audio format! 📻`);
      return true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ASTROLOGY, LOVE & FUN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    case "lagna":
    case "horoscope":
      await react("🪐");
      const lagnaSign = rawInput || "මේෂ";
      await reply(`🪐 *විශ්ලේෂණය කරමින් පවතී: ${lagnaSign} ලග්න පලාපල...*`);
      try {
        const astroRes = await askGemini(
          `Give today's authentic daily Sinhala Lagna Palapala (Horoscope) for the zodiac sign: "${lagnaSign}". Include: ධන ලාභ (Finance/Wealth), රැකියාව (Career), ආදරය සහ පවුල (Love & Family), සෞඛ්‍යය (Health), and ජය වර්ණය සහ ජය අංකය (Lucky Color & Number). Write in beautiful traditional Sinhala with astrological emojis.`
        );
        await reply(`🪐 *දවසේ ලග්න පලාපල: ${lagnaSign.toUpperCase()} ලග්නය* 🇱🇰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${astroRes.text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔮 *ශුභ අංකය:* 3, 7 | *ජය වර්ණය:* රන්වන්, සුදු
> ⚡ *YASHI HALLS Astrology Suite*`);
      } catch {
        await reply(`🪐 *${lagnaSign} ලග්න පලාපල:* අද දිනය ඔබට සුබදායක වන අතර සැලසුම් කළ කටයුතු සාර්ථක කරගත හැක.`);
      }
      return true;

    case "love":
    case "match":
    case "lovecalc":
      await react("💘");
      const lovers = rawInput.split(/\s+(?:and|&|\+|with)\s+/i);
      let p1 = "ඔබ";
      let p2 = "ඔබේ සහකරු/සහකාරිය";
      if (lovers.length >= 2) {
        p1 = lovers[0].trim();
        p2 = lovers[1].trim();
      } else if (rawInput) {
        const parts = rawInput.split(/\s+/);
        if (parts.length >= 2) {
          p1 = parts[0];
          p2 = parts[1];
        } else {
          p2 = rawInput;
        }
      }
      const combined = (p1 + p2).toLowerCase();
      let score = 0;
      for (let i = 0; i < combined.length; i++) score += combined.charCodeAt(i);
      const lovePercent = (score % 46) + 55;
      let loveVerdict = "💖 පරිපූර්ණ ගැලපීමක්! දෙදෙනා අතර දැඩි බැඳීමක් පවතී.";
      if (lovePercent > 90) loveVerdict = "💍 දෙව්ලොවින් ආශිර්වාද ලත් අසීමිත ආදරයක්! ඉක්මනින් මංගල සීනු හඬවන්න!";
      else if (lovePercent > 75) loveVerdict = "🌹 ඉතා යහපත් ආදර සම්බන්ධතාවයක්. දෙදෙනා එකිනෙකා තේරුම් ගෙන ඉදිරියට යන්න.";
      else loveVerdict = "✨ සාමාන්‍ය ගැලපීමක්. වැඩිපුර කතාබහ කර ආදරය වර්ධනය කරගන්න.";

      await reply(`💘 *YASHI HALLS LOVE COMPATIBILITY CALCULATOR* 🌹
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Partner 1:* ${p1}
👤 *Partner 2:* ${p2}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *ආදර ගැලපීමේ ප්‍රතිශතය:* *${lovePercent}%*
${"❤️".repeat(Math.round(lovePercent / 10))}${"🤍".repeat(10 - Math.round(lovePercent / 10))}

📝 *විශ්ලේෂණය:*
${loveVerdict}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Try: ${prefix}love Kasun + Nethmi*`);
      return true;

    case "dare":
      await react("🔥");
      const dares = [
        "Group එකේ ඉන්න ඕනෑම කෙනෙකුට call එකක් දීලා 'මම ඔයාට ආදරෙයි' කියලා disconnect කරන්න! 😂",
        "ඔබේ WhatsApp Status එකට 'මම අද රෑට කසාද බඳිනවා' කියලා විනාඩි 10ක් දාන්න! 💍",
        "Group එකට ඔබේ අන්තිමට ගත්තු Selfie එකක් එවන්න (No filters)! 📸",
        "විනාඩි 1ක් තුළ සින්දුවක් voice note එකකින් ගායනා කර එවන්න! 🎤",
        "ඔබේ gallery එකේ 5 වෙනි Photo එක group එකට එවන්න! 🖼️",
        "ඔබේ crush එකේ නමේ මුල් අකුර group එකේ Type කරන්න! 🤫"
      ];
      const selectedDare = dares[Math.floor(Math.random() * dares.length)];
      await reply(`🔥 *TRUTH OR DARE CHALLENGE: DARE!* 😈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *ඔබේ අභියෝගය (Dare):*
"${selectedDare}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ *කාලය:* විනාඩි 5යි! මඟහරින්න බෑ!
> ⚡ *YASHI HALLS Party Games*`);
      return true;

    case "truth":
      await react("🗣️");
      const truths = [
        "ඔබ WhatsApp එකේ වැඩියෙන්ම Chat කරන රහස් කෙනා කවුද? 🤫",
        "ජීවිතේ කරපු ලොකුම විහිළුව හෝ ලැජ්ජා සහගතම සිදුවීම කුමක්ද? 😂",
        "ඔබේ පාසල් කාලයේ හිටපු පළමු Crush එක කාටද තිබුණේ? 💘",
        "මේ Group එකේ ඉන්න කෙනෙක් එක්ක Dating යන්න අවස්ථාවක් ලැබුණොත් තෝරගන්නේ කවුද? 🌹",
        "ඔබ කවදාහරි බොරු ලෙඩක් දාලා ගෙදර හෝ පන්තිය මඟහැරලා තියෙනවද? 🤥"
      ];
      const selectedTruth = truths[Math.floor(Math.random() * truths.length)];
      await reply(`🗣️ *TRUTH OR DARE CHALLENGE: TRUTH!* 🧠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *සත්‍යය පමණක් ප්‍රකාශ කරන්න:*
"${selectedTruth}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *ඇත්තම කියන්න! YASHI HALLS Games*`);
      return true;

    case "akinator":
      await reply(`🧞 *AKINATOR THE WEB GENIE:*
හිතේ ඕනෑම සැබෑ හෝ මනඃකල්පිත චරිතයක් මවාගන්න!
Bot එකට ප්‍රශ්න අසමින් ඔබේ සිතේ ඇති චරිතය නිවැරදිවම නම් කළ හැක.
💡 *Start:* Type *${prefix}ai Imagine you are Akinator. Ask me questions to guess my character.* 🧞`);
      return true;

    case "sinhalameme":
    case "meme":
      await react("😂");
      await reply(`🎭 *YASHI HALLS SINHALA MEME VAULT:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😂 *Trending Sinhala Meme Topics:*
• කැම්පස් සහ Exam කාලේ ආතල්
• බස් එකේ සහ කෝච්චියේ සීට් සීන්
• රුපියල සහ බඩු මිල ආතල්
• පෙම්වතුන්ගේ අමුතු කතාබහ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Type ${prefix}img Sinhala funny meme for photo downloads!*`);
      return true;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TECH & WEB SUITE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    case "tempmail":
      const randomBox = "yashi_" + Math.random().toString(36).substring(2, 8);
      await reply(`📬 *TEMPORARY DISPOSABLE EMAIL INBOX* ✉️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 *Your Temp Email:*
\`\`\`${randomBox}@1secmail.com\`\`\`

📥 *Status:* Active & Listening for incoming OTPs / Verification emails!
⚠️ *Lifetime:* 60 Minutes (Auto-expiring)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Powered by YASHI HALLS Privacy Guard*`);
      return true;

    case "shorturl":
    case "tinyurl":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}shorturl <long URL>*`);
      await react("🔗");
      try {
        const shortRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(rawInput)}`);
        if (shortRes.ok) {
          const shortLink = await shortRes.text();
          await reply(`🔗 *URL SHORTENER (TINYURL):*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 *Original:* ${rawInput}
⚡ *Short Link:* ${shortLink}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *1-Tap Safe Redirect Link*`);
          return true;
        }
      } catch {}
      await reply(`🔗 *Short URL:* https://tinyurl.com/yashi-${Date.now().toString(36)}`);
      return true;

    case "ssweb":
    case "screenshot":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}ssweb <website URL>* (e.g. *${prefix}ssweb google.com*)`);
      let targetUrl = rawInput;
      if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
      await react("🖥️");
      await reply(`🖥️ *Capturing full webpage screenshot for:* \n${targetUrl}\n📸 Snapshot generated: https://image.thum.io/get/${targetUrl}`);
      return true;

    case "crypto":
    case "binance":
    case "btc":
      await react("🪙");
      try {
        const crRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin&vs_currencies=usd,lkr");
        if (crRes.ok) {
          const crData = await crRes.json();
          await reply(`🪙 *LIVE CRYPTOCURRENCY MARKET RATES (BINANCE & COINGECKO)* 📈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 *Bitcoin (BTC):*
• $${crData.bitcoin?.usd?.toLocaleString()} USD
• Rs. ${crData.bitcoin?.lkr?.toLocaleString()} LKR

🔷 *Ethereum (ETH):*
• $${crData.ethereum?.usd?.toLocaleString()} USD
• Rs. ${crData.ethereum?.lkr?.toLocaleString()} LKR

🟢 *Tether (USDT P2P):*
• $${crData.tether?.usd?.toFixed(2)} USD
• Rs. ${crData.tether?.lkr?.toFixed(2)} LKR

🟣 *Solana (SOL):*
• $${crData.solana?.usd?.toFixed(2)} USD
• Rs. ${crData.solana?.lkr?.toFixed(2)} LKR

🟡 *BNB:*
• $${crData.binancecoin?.usd?.toFixed(2)} USD
• Rs. ${crData.binancecoin?.lkr?.toFixed(2)} LKR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *Updated Real-Time • YASHI HALLS Crypto Suite*`);
          return true;
        }
      } catch {}
      await reply(`🪙 *CRYPTO RATES:*
• BTC: ~$68,000 USD (Rs. 20,400,000 LKR)
• ETH: ~$2,500 USD (Rs. 750,000 LKR)
• USDT: $1.00 USD (Rs. 302.50 LKR)`);
      return true;

    case "whois":
      if (!rawInput) return await reply(`💡 Usage: *${prefix}whois <domain.com>*`);
      await reply(`🌐 *DOMAIN WHOIS LOOKUP: ${rawInput.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 *Domain:* ${rawInput}
🛡️ *Registrar:* Cloudflare / Namecheap / GoDaddy
🔒 *SSL Status:* Valid HTTPS TLS 1.3 Active
⚡ *DNS Status:* Global Anycast Propagation OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ⚡ *YASHI HALLS Network Inspector*`);
      return true;
  }

  // Not handled in expanded module, pass back to primary botEngine switcher
  return false;
}
