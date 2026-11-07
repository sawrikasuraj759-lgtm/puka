import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { extractYoutubeId, searchYoutubeVideo, getYtDlpBinary } from "./audioService";

const execFileAsync = promisify(execFile);

export interface VideoDownloadResult {
  success: boolean;
  videoUrl?: string;
  buffer?: Buffer;
  localPath?: string;
  title: string;
  sizeBytes?: number;
  fileSizeStr?: string;
  duration?: string;
  quality?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  views?: string;
  isDirectDownloadable?: boolean;
  error?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export async function resolveVideo(query: string): Promise<VideoDownloadResult> {
  const clean = (query || "").trim();
  if (!clean) {
    return { success: false, title: "", error: "No video query or link provided." };
  }

  // 1. Direct MP4 or video stream URL
  if (/^https?:\/\/.+\.(mp4|mkv|mov|webm|avi)(\?.*)?$/i.test(clean)) {
    try {
      const headResp = await fetch(clean, {
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(4000),
      });
      const cl = headResp.headers.get("content-length");
      const sizeBytes = cl ? parseInt(cl, 10) : 0;
      const sizeMB = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(1) + " MB" : "Direct Video Stream";
      const fileName = clean.split("/").pop()?.split("?")[0] || "video.mp4";

      // If <= 50MB, fetch directly into buffer for instant WhatsApp delivery
      if (sizeBytes > 0 && sizeBytes <= 50 * 1024 * 1024) {
        const fileResp = await fetch(clean, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(12000) });
        if (fileResp.ok) {
          const buf = Buffer.from(await fileResp.arrayBuffer());
          return {
            success: true,
            videoUrl: clean,
            buffer: buf,
            title: fileName,
            sizeBytes,
            fileSizeStr: sizeMB,
            quality: "HD Direct",
            sourceUrl: clean,
            isDirectDownloadable: true,
          };
        }
      }

      return {
        success: true,
        videoUrl: clean,
        title: fileName,
        sizeBytes,
        fileSizeStr: sizeMB,
        quality: "HD Direct",
        sourceUrl: clean,
        isDirectDownloadable: true,
      };
    } catch {
      return {
        success: true,
        videoUrl: clean,
        title: "Direct Video",
        fileSizeStr: "Online Stream",
        quality: "HD Direct",
        sourceUrl: clean,
        isDirectDownloadable: true,
      };
    }
  }

  // 2. TikTok URL
  if (clean.includes("tiktok.com")) {
    // Strategy A: TikWM API
    try {
      const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(clean)}`, {
        signal: AbortSignal.timeout(6000),
      });
      const json = await apiRes.json();
      if (json && json.code === 0 && json.data?.play) {
        const directPlay = json.data.play;
        const vidTitle = json.data.title || "TikTok Video";
        const duration = `${json.data.duration || 0}s`;

        try {
          const vidRes = await fetch(directPlay, { signal: AbortSignal.timeout(10000) });
          if (vidRes.ok) {
            const buf = Buffer.from(await vidRes.arrayBuffer());
            return {
              success: true,
              videoUrl: directPlay,
              buffer: buf,
              title: vidTitle,
              duration,
              quality: "1080p HD (No Watermark)",
              sourceUrl: clean,
              fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
              isDirectDownloadable: true,
            };
          }
        } catch {}

        return {
          success: true,
          videoUrl: directPlay,
          title: vidTitle,
          duration,
          quality: "1080p HD (No Watermark)",
          sourceUrl: clean,
          fileSizeStr: json.data.size ? (json.data.size / (1024 * 1024)).toFixed(1) + " MB" : "HD Video",
          isDirectDownloadable: true,
        };
      }
    } catch (err: any) {
      console.warn("[VideoService] TikWM error:", err?.message);
    }

    // Strategy B: ruhend ttdl
    try {
      // @ts-ignore
      const { ttdl } = await import("ruhend-scraper");
      const res = await ttdl(clean);
      if (res && (res.video_hd || res.video)) {
        const vidUrl = res.video_hd || res.video;
        try {
          const dlRes = await fetch(vidUrl, { signal: AbortSignal.timeout(10000) });
          if (dlRes.ok) {
            const buf = Buffer.from(await dlRes.arrayBuffer());
            return {
              success: true,
              videoUrl: vidUrl,
              buffer: buf,
              title: res.title || "TikTok Video",
              quality: "HD No Watermark",
              sourceUrl: clean,
              fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
              isDirectDownloadable: true,
            };
          }
        } catch {}
      }
    } catch {}
  }

  // 3. Facebook URL
  if (clean.includes("facebook.com") || clean.includes("fb.watch") || clean.includes("fb.com")) {
    try {
      // @ts-ignore
      const { fbdl2, fbdl } = await import("ruhend-scraper");
      const fbRes2 = await fbdl2(clean).catch(() => null);
      let vidUrl: string | null = null;
      if (fbRes2 && fbRes2.data && fbRes2.data.length > 0 && fbRes2.data[0].url) {
        vidUrl = fbRes2.data[0].url;
      }
      if (!vidUrl) {
        const fbRes1 = await fbdl(clean).catch(() => null);
        vidUrl = Array.isArray(fbRes1) ? fbRes1[0] : fbRes1;
      }

      if (vidUrl && typeof vidUrl === "string" && vidUrl.startsWith("http")) {
        try {
          const res = await fetch(vidUrl, {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(12000),
          });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            return {
              success: true,
              videoUrl: vidUrl,
              buffer: buf,
              title: "Facebook Video",
              quality: "720p HD",
              sourceUrl: clean,
              fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
              isDirectDownloadable: true,
            };
          }
        } catch {}

        return {
          success: true,
          videoUrl: vidUrl,
          title: "Facebook Video",
          quality: "720p HD",
          sourceUrl: clean,
          isDirectDownloadable: true,
        };
      }
    } catch {}

    // Fallback: yt-dlp fast download for Facebook
    const ytDlp = getYtDlpBinary();
    const tempFb = path.join("/tmp", `fb_${Date.now()}.mp4`);
    try {
      await execFileAsync(ytDlp, ["--max-filesize", "60M", "-o", tempFb, clean], { timeout: 15000 });
      if (fs.existsSync(tempFb)) {
        const buf = fs.readFileSync(tempFb);
        fs.unlinkSync(tempFb);
        return {
          success: true,
          buffer: buf,
          title: "Facebook Video",
          quality: "HD Video",
          sourceUrl: clean,
          fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
          isDirectDownloadable: true,
        };
      }
    } catch (e: any) {
      if (fs.existsSync(tempFb)) try { fs.unlinkSync(tempFb); } catch {}
    }
  }

  // 4. Twitter / X URL
  if (clean.includes("twitter.com") || clean.includes("x.com")) {
    try {
      const form = new URLSearchParams({ q: clean, lang: "en", cftoken: "" });
      const res = await fetch("https://savetwitter.net/api/ajaxSearch", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          origin: "https://savetwitter.net",
          referer: "https://savetwitter.net/en4",
          "user-agent": USER_AGENT,
        },
        body: form.toString(),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status === "ok" && json.data) {
          const match = json.data.match(/href="([^"]*(?:dl\.snapcdn\.app|twimg\.com)[^"]*)"/i);
          if (match && match[1]) {
            const vidUrl = match[1];
            try {
              const dlRes = await fetch(vidUrl, { signal: AbortSignal.timeout(10000) });
              if (dlRes.ok) {
                const buf = Buffer.from(await dlRes.arrayBuffer());
                return {
                  success: true,
                  videoUrl: vidUrl,
                  buffer: buf,
                  title: "Twitter / X Video",
                  quality: "720p HD",
                  sourceUrl: clean,
                  fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
                  isDirectDownloadable: true,
                };
              }
            } catch {}
          }
        }
      }
    } catch {}

    const ytDlp = getYtDlpBinary();
    const tempTw = path.join("/tmp", `tw_${Date.now()}.mp4`);
    try {
      await execFileAsync(ytDlp, ["--max-filesize", "60M", "-o", tempTw, clean], { timeout: 15000 });
      if (fs.existsSync(tempTw)) {
        const buf = fs.readFileSync(tempTw);
        fs.unlinkSync(tempTw);
        return {
          success: true,
          buffer: buf,
          title: "Twitter / X Video",
          quality: "HD Video",
          sourceUrl: clean,
          fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
          isDirectDownloadable: true,
        };
      }
    } catch (e: any) {
      if (fs.existsSync(tempTw)) try { fs.unlinkSync(tempTw); } catch {}
    }
  }

  // 5. Instagram URL
  if (clean.includes("instagram.com")) {
    try {
      // @ts-ignore
      const { igdl2, igdl } = await import("ruhend-scraper");
      let igRes = await igdl2(clean).catch(() => null);
      let vidUrl: string | null = null;
      if (igRes && igRes.data && igRes.data.length > 0 && igRes.data[0].url) {
        vidUrl = igRes.data[0].url;
      }
      if (!vidUrl) {
        const igRes1 = await igdl(clean).catch(() => null);
        vidUrl = Array.isArray(igRes1) ? igRes1[0] : (igRes1?.video || igRes1?.url);
      }

      if (vidUrl && typeof vidUrl === "string" && vidUrl.startsWith("http")) {
        try {
          const dlRes = await fetch(vidUrl, { signal: AbortSignal.timeout(10000) });
          if (dlRes.ok) {
            const buf = Buffer.from(await dlRes.arrayBuffer());
            return {
              success: true,
              videoUrl: vidUrl,
              buffer: buf,
              title: "Instagram Reel",
              quality: "HD Reel",
              sourceUrl: clean,
              fileSizeStr: `${(buf.length / (1024 * 1024)).toFixed(1)} MB`,
              isDirectDownloadable: true,
            };
          }
        } catch {}

        return {
          success: true,
          videoUrl: vidUrl,
          title: "Instagram Reel",
          quality: "HD Reel",
          sourceUrl: clean,
          isDirectDownloadable: true,
        };
      }
    } catch {}
  }

  // 6. YouTube or General Search Query
  try {
    let title = clean;
    let videoId = extractYoutubeId(clean) || "";
    let duration = "HQ Video";
    let author = "YouTube Creator";
    let views = "";
    let thumbnailUrl = "";

    // Fast search via ruhend ytsearch
    try {
      // @ts-ignore
      const { ytsearch } = await import("ruhend-scraper");
      const searchRes = await ytsearch(clean);
      if (searchRes && searchRes.video && searchRes.video.length > 0) {
        const top = searchRes.video[0];
        title = top.title || title;
        videoId = top.videoId || videoId;
        duration = top.duration || top.durationH || duration;
        author = top.authorName || author;
        views = top.viewH || top.view || "";
        thumbnailUrl = top.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch {
      const ytVideo = await searchYoutubeVideo(clean);
      if (ytVideo && ytVideo.videoId) {
        videoId = ytVideo.videoId;
        title = ytVideo.title || title;
        thumbnailUrl = ytVideo.thumbnailUrl;
      }
    }

    if (!videoId) {
      return {
        success: false,
        title: clean,
        error: `Could not find any video matching "${clean}".`,
      };
    }

    const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if (!thumbnailUrl) thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      success: true,
      videoUrl: sourceUrl,
      title,
      duration,
      author,
      views,
      thumbnailUrl,
      quality: "1080p / 720p HD",
      sourceUrl,
      isDirectDownloadable: false,
      fileSizeStr: "HD Stream",
    };
  } catch (err: any) {
    return {
      success: false,
      title: clean,
      error: `Failed to process video: ${err?.message || err}`,
    };
  }
}
