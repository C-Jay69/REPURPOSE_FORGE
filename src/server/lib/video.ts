import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { storage, generateStorageKey, getVideoDuration } from './storage';
import { db } from '../database';
import { generatedClips, processingJobs } from '../schema';
import { eq } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = process.env.STORAGE_ROOT || resolve(__dirname, '..', '..', 'storage');

export interface ClipTimestamps {
  start: number;
  end: number;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate',
      '-show_entries', 'format=duration',
      '-of', 'json',
      filePath
    ]);
    let output = '';
    ffprobe.stdout.on('data', (data: Buffer) => { output += data.toString(); });
    ffprobe.on('close', (code: number) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output);
          const stream = info.streams?.[0] || {};
          const format = info.format || {};
          const fps = stream.r_frame_rate ? eval(stream.r_frame_rate) : 30;
          resolve({
            duration: parseFloat(format.duration) || 0,
            width: stream.width || 1920,
            height: stream.height || 1080,
            fps,
          });
        } catch {
          reject(new Error('Failed to parse ffprobe output'));
        }
      } else {
        reject(new Error('ffprobe failed'));
      }
    });
    ffprobe.on('error', reject);
  });
}

export function clipVideo(
  inputPath: string,
  outputPath: string,
  start: number,
  end: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = end - start;
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-ss', start.toFixed(3),
      '-i', inputPath,
      '-t', duration.toFixed(3),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-avoid_negative_ts', 'make_zero',
      outputPath
    ]);
    let stderr = '';
    ffmpeg.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    ffmpeg.on('close', (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg clip failed: ${stderr}`));
    });
    ffmpeg.on('error', reject);
  });
}

export function reformatVideo(
  inputPath: string,
  outputPath: string,
  aspectRatio: '9:16' | '1:1' | '4:5' | '16:9',
  options?: { captionsPath?: string; watermarkPath?: string; watermarkPosition?: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const [w, h] = aspectRatio.split(':').map(Number);
    const targetWidth = 1080;
    const targetHeight = Math.round(targetWidth * h / w);

    let filterComplex = `[0:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black@0[v]`;
    let filterIdx = 0;

    if (options?.captionsPath) {
      filterComplex += `;[v]subtitles='${options.captionsPath.replace(/'/g, "\\'")}'[v${filterIdx + 1}]`;
      filterIdx++;
    }

    if (options?.watermarkPath) {
      const pos = options.watermarkPosition || 'top-right';
      let overlayPos = 'W-w-20:20';
      if (pos === 'top-left') overlayPos = '20:20';
      else if (pos === 'bottom-right') overlayPos = `W-w-20:H-h-20`;
      else if (pos === 'bottom-left') overlayPos = `20:H-h-20`;
      filterComplex += `;[v${filterIdx}][1:v]overlay=${overlayPos}[v${filterIdx + 1}]`;
      filterIdx++;
    }

    const args = [
      '-y',
      '-i', inputPath,
    ];
    if (options?.watermarkPath) args.push('-i', options.watermarkPath);
    args.push(
      '-filter_complex', filterComplex,
      '-map', `[v${filterIdx}]`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputPath
    );

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    ffmpeg.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    ffmpeg.on('close', (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg reformat failed: ${stderr}`));
    });
    ffmpeg.on('error', reject);
  });
}

export function generateWaveformData(filePath: string, samples = 200): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', filePath,
      '-af', `astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level`,
      '-f', 'null', '-'
    ]);
    let stderr = '';
    ffmpeg.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    ffmpeg.on('close', (code: number) => {
      if (code !== 0) {
        resolve(new Array(samples).fill(0).map(() => Math.random() * 0.5));
        return;
      }
      const rmsMatches = stderr.match(/RMS_level=(-?\d+\.?\d*)/g);
      if (!rmsMatches || rmsMatches.length === 0) {
        resolve(new Array(samples).fill(0).map(() => Math.random() * 0.5));
        return;
      }
      const values = rmsMatches.map(m => Math.abs(parseFloat(m.split('=')[1])));
      const normalized = values.map(v => Math.min(1, (v + 60) / 60));
      const step = Math.max(1, Math.floor(normalized.length / samples));
      const sampled = [];
      for (let i = 0; i < samples; i++) {
        const idx = Math.min(i * step, normalized.length - 1);
        sampled.push(normalized[idx]);
      }
      resolve(sampled);
    });
    ffmpeg.on('error', () => resolve(new Array(samples).fill(0).map(() => Math.random() * 0.5)));
  });
}

export function createCaptionASS(
  segments: Array<{ start: number; end: number; text: string }>,
  style: 'hormozi' | 'mrbeast' | 'minimal' = 'hormozi'
): string {
  const styles = {
    hormozi: 'Style: Default,Montserrat Bold,24,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1',
    mrbeast: 'Style: Default,Bangers,28,&H00FFFFFF,&H000000FF,&H00FF0000,&H80000000,-1,0,0,0,100,100,0,0,1,2,3,2,10,10,10,1',
    minimal: 'Style: Default,Inter,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1',
  };

  const header = `[Script Info]
Title: Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styles[style]}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = segments.map((seg, i) => {
    const start = formatTime(seg.start);
    const end = formatTime(seg.end);
    const text = seg.text.replace(/\n/g, '\\N').replace(/{/g, '\\{').replace(/}/g, '\\}');
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
  }).join('\n');

  return header + events;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export async function processClipExport(
  jobId: string,
  clipId: string,
  aspectRatio: '9:16' | '1:1' | '4:5' | '16:9',
  captionStyle: 'hormozi' | 'mrbeast' | 'minimal',
  watermarkEnabled: boolean,
  captionSegments: Array<{ start: number; end: number; text: string }>,
  watermarkPath?: string
): Promise<string> {
  await db.update(processingJobs).set({ status: 'processing' }).where(eq(processingJobs.id, jobId));

  const [clip] = await db.select().from(generatedClips).where(eq(generatedClips.id, clipId));
  if (!clip || !clip.storageUrlOriginal) {
    await db.update(processingJobs).set({ status: 'failed', errorMessage: 'Source clip not found' }).where(eq(processingJobs.id, jobId));
    throw new Error('Source clip not found');
  }

  const inputPath = storage.getLocalPath(clip.storageUrlOriginal);
  const outputKey = generateStorageKey('exports', `${clipId}_${aspectRatio.replace(':', 'x')}_${captionStyle}.mp4`);
  const outputPath = storage.getLocalPath(outputKey);

  let captionFile: string | undefined;
  if (captionSegments.length > 0) {
    captionFile = join(STORAGE_ROOT, 'temp', `${randomUUID()}.ass`);
    const assContent = createCaptionASS(captionSegments, captionStyle);
    require('fs').writeFileSync(captionFile, assContent);
  }

  let watermarkFile: string | undefined;
  if (watermarkEnabled && watermarkPath) {
    watermarkPath = storage.getLocalPath(watermarkPath);
  }

  try {
    await reformatVideo(inputPath, outputPath, aspectRatio, {
      captionsPath: captionFile,
      watermarkPath: watermarkFile,
    });

    const savedKey = await storage.save(outputKey, require('fs').readFileSync(outputPath), 'video/mp4');
    await db.update(generatedClips).set({ storageUrlFormatted: savedKey }).where(eq(generatedClips.id, clipId));
    await db.update(processingJobs).set({ status: 'completed', outputUrl: savedKey }).where(eq(processingJobs.id, jobId));

    if (captionFile && require('fs').existsSync(captionFile)) {
      require('fs').unlinkSync(captionFile);
    }

    return savedKey;
  } catch (error) {
    await db.update(processingJobs).set({ status: 'failed', errorMessage: String(error) }).where(eq(processingJobs.id, jobId));
    throw error;
  }
}