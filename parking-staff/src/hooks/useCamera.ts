import { useRef, useState } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);

  const startCamera = async () => {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCameraAccess(false);
      return;
    }

    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
      { video: true },
    ];

    for (const c of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(c);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            /* muted + playsInline usually allows autoplay */
          }
        }
        setHasCameraAccess(true);
        return;
      } catch (err) {
        console.warn('getUserMedia failed for constraint', c, err);
      }
    }
    setHasCameraAccess(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCameraAccess(false);
  };

  /** Snapshot JPEG data-URL from the live stream (not stale React flags). */
  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || !stream.active) return null;

    try {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (e) {
      console.error('Failed to capture camera frame:', e);
      return null;
    }
  };

  const reattachStream = () => {
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  };

  return {
    videoRef,
    streamRef,
    hasCameraAccess,
    setHasCameraAccess,
    startCamera,
    stopCamera,
    captureFrame,
    reattachStream,
  };
};
