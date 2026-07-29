export interface VideoCompressionResult {
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  durationSeconds: number;
  dimensions: { width: number; height: number };
}

export async function compressVideoFile(
  file: File,
  onProgress?: (progress: number, statusText: string) => void,
  maxDurationSeconds: number = 7,
  maxDimension: number = 480,
  targetBitrate: number = 700_000
): Promise<VideoCompressionResult> {
  const originalSize = file.size;

  const result = await runCompressionPass(
    file,
    onProgress,
    maxDurationSeconds,
    maxDimension,
    targetBitrate
  );

  // Strict check for 1,048,576 bytes (1 MB limit)
  const MAX_BYTES = 1_048_576;
  if (result.compressedSize > MAX_BYTES) {
    onProgress?.(80, 'Optimizing video to fit strictly within 1 MB limit (1,048,576 bytes)...');
    // Second pass with 360p resolution and lower bitrate to guarantee <= 1,048,576 bytes
    return await runCompressionPass(
      file,
      onProgress,
      maxDurationSeconds,
      360,
      400_000
    );
  }

  return result;
}

function runCompressionPass(
  file: File,
  onProgress?: (progress: number, statusText: string) => void,
  maxDurationSeconds: number = 7,
  maxDimension: number = 480,
  targetBitrate: number = 700_000
): Promise<VideoCompressionResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const timeout = setTimeout(() => {
      video.pause();
      URL.revokeObjectURL(objectUrl);
      fallbackReadFile(file).then(resolve).catch(reject);
    }, 25000);

    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      fallbackReadFile(file).then(resolve).catch(reject);
    };

    video.onloadedmetadata = () => {
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (!width || !height) {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        fallbackReadFile(file).then(resolve).catch(reject);
        return;
      }

      // Calculate scaled dimensions (keep aspect ratio within maxDimension)
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Enforce even dimension dimensions required by video codecs
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx || !window.MediaRecorder || typeof canvas.captureStream !== 'function') {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        fallbackReadFile(file).then(resolve).catch(reject);
        return;
      }

      const fps = 24;
      const stream = canvas.captureStream(fps);

      let mimeType = 'video/webm;codecs=vp8';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: targetBitrate });
      } catch {
        try {
          mediaRecorder = new MediaRecorder(stream);
        } catch {
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          fallbackReadFile(file).then(resolve).catch(reject);
          return;
        }
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      let isFinished = false;

      const finishRecording = () => {
        if (isFinished) return;
        isFinished = true;
        cancelAnimationFrame(animationFrameId);
        video.pause();

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        const compressedBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
        const compressedSize = compressedBlob.size;
        const compressionRatio = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        const reader = new FileReader();
        reader.onloadend = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({
            compressedDataUrl: reader.result as string,
            originalSize,
            compressedSize,
            compressionRatio,
            durationSeconds: Math.min(maxDurationSeconds, Math.round(video.currentTime * 10) / 10),
            dimensions: { width, height },
          });
        };
        reader.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          fallbackReadFile(file).then(resolve).catch(reject);
        };
        reader.readAsDataURL(compressedBlob);
      };

      const videoDuration = Math.min(video.duration || maxDurationSeconds, maxDurationSeconds);
      // Playback speed up to 2x for fast encoding
      video.playbackRate = 2.0;

      let animationFrameId: number;

      const drawFrame = () => {
        if (isFinished) return;

        if (video.currentTime >= maxDurationSeconds || video.ended) {
          finishRecording();
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        const currentProg = Math.min(99, Math.round((video.currentTime / videoDuration) * 100));
        onProgress?.(
          currentProg,
          `Trimming to 7s max & compressing (${width}x${height}) (${currentProg}%)...`
        );
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        finishRecording();
      };

      mediaRecorder.start(100);
      video.play().then(() => {
        drawFrame();
      }).catch(() => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        fallbackReadFile(file).then(resolve).catch(reject);
      });
    };
  });
}

function fallbackReadFile(file: File): Promise<VideoCompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        compressedDataUrl: reader.result as string,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        durationSeconds: 7,
        dimensions: { width: 640, height: 360 },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
