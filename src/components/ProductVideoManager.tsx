import React, { useState, useRef } from 'react';
import { Video, Play, X, Sparkles, Check, Film, UploadCloud, Loader2, FileVideo, Zap } from 'lucide-react';
import { compressVideoFile, formatBytes, VideoCompressionResult } from '../utils/videoCompressor';

interface ProductVideoManagerProps {
  videoUrl: string;
  onChange: (url: string) => void;
}

const SAMPLE_DEMO_VIDEOS = [
  {
    name: 'Gadget & Tech Demo',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41551-large.mp4',
  },
  {
    name: 'Fashion & Apparel Reel',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-[#FF5500]-girl-posing-in-a-studio-41554-large.mp4',
  },
  {
    name: 'Unboxing & Review',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-opening-a-gift-box-41555-large.mp4',
  },
];

export const ProductVideoManager: React.FC<ProductVideoManagerProps> = ({ videoUrl, onChange }) => {
  const [inputUrl, setInputUrl] = useState(videoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStatus, setCompressionStatus] = useState('');
  const [compressionStats, setCompressionStats] = useState<VideoCompressionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyUrl = (urlToApply: string) => {
    onChange(urlToApply);
    setInputUrl(urlToApply);
    setCompressionStats(null);
    setUploadError(null);
  };

  const handleClearVideo = () => {
    onChange('');
    setInputUrl('');
    setFileName(null);
    setCompressionStats(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (MP4, WebM, MOV, etc.).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setCompressionProgress(0);
    setCompressionStatus('Starting smart video compression...');
    setFileName(file.name);

    try {
      const result = await compressVideoFile(file, (progress, statusText) => {
        setCompressionProgress(progress);
        setCompressionStatus(statusText);
      });

      setCompressionStats(result);
      onChange(result.compressedDataUrl);
      setInputUrl(result.compressedDataUrl.substring(0, 40) + '... (Compressed Video)');
    } catch (err: any) {
      console.warn('Video compression error:', err);
      // Fallback to standard reader if compression fails unexpectedly
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
        setInputUrl(dataUrl.substring(0, 40) + '... (Uploaded File)');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
          <Video className="w-4 h-4 text-[#FF5500]" />
          <span>Product Demo Video (Optional - Not Compulsory)</span>
        </label>
        {videoUrl ? (
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            Video Attached
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2.5 py-0.5 rounded-full">
            Not Compulsory
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-normal">
        Adding a video is <strong>completely optional</strong>. Uploaded videos are automatically clipped to a <strong>7-second max duration</strong> and compressed under <strong>1,048,576 bytes (1 MB)</strong>.
      </p>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload File & Link Options */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* File Picker Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-3 bg-white hover:bg-orange-50/60 border-2 border-dashed border-slate-300 hover:border-[#FF5500] rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group relative overflow-hidden"
          >
            {isUploading ? (
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-[#FF5500] font-extrabold text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compressing Video ({compressionProgress}%)</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#FF5500] h-full transition-all duration-200"
                    style={{ width: `${Math.max(5, compressionProgress)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[200px] mx-auto">
                  {compressionStatus}
                </span>
              </div>
            ) : (
              <>
                <div className="p-1.5 rounded-lg bg-orange-100/70 text-[#FF5500] group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-extrabold text-slate-800 group-hover:text-[#FF5500] block">
                    Upload Video from Device Files
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Max 7 sec clip • Compressed ≤ 1 MB</span>
                </div>
              </>
            )}
          </button>

          {/* Video URL Input */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Film className="w-3 h-3 text-[#FF5500]" />
              <span>Or Paste Video Link URL</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://example.com/video.mp4"
                value={videoUrl.startsWith('data:') ? 'Uploaded from Device File' : inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  onChange(e.target.value);
                  setFileName(null);
                  setUploadError(null);
                }}
                className="w-full pr-7 py-1.5 text-xs text-slate-900 border-b border-slate-300 focus:border-[#FF5500] focus:outline-none bg-transparent font-medium"
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={handleClearVideo}
                  className="absolute right-0 top-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-semibold flex items-center justify-between">
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Sample Video Links */}
        <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Click sample MP4 demo video to test:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_DEMO_VIDEOS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleApplyUrl(sample.url)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
                  videoUrl === sample.url
                    ? 'bg-orange-100 text-[#FF5500] border-orange-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-[#FF5500]'
                }`}
              >
                <Play className="w-3 h-3 text-[#FF5500]" />
                <span>{sample.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Preview Box */}
      {videoUrl && (
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold px-1">
            <span className="flex items-center gap-1">
              <FileVideo className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Video Preview {fileName ? `(${fileName})` : ''}</span>
            </span>
            <button
              type="button"
              onClick={handleClearVideo}
              className="text-rose-600 hover:underline cursor-pointer"
            >
              Remove Video
            </button>
          </div>

          {/* Compression badge stats */}
          {compressionStats && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Compressed ({compressionStats.dimensions.width}x{compressionStats.dimensions.height})</span>
              </span>
              <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {formatBytes(compressionStats.originalSize)} ➔ {formatBytes(compressionStats.compressedSize)}{' '}
                {compressionStats.compressionRatio > 0 && `(${compressionStats.compressionRatio}% smaller)`}
              </span>
            </div>
          )}

          <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 group aspect-video max-h-48 flex items-center justify-center">
            <video
              src={videoUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              onError={(e) => {
                console.warn('Video playback error', e);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
