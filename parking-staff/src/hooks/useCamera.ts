import { useState, useRef, useEffect } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);

  const startCamera = async () => {
    stopCamera();
    const constraints = [
      { video: { facingMode: 'environment', width: 640, height: 480 } },
      { video: { facingMode: 'user', width: 640, height: 480 } },
      { video: true }
    ];

    for (const c of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(c as MediaStreamConstraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasCameraAccess(true);
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    setHasCameraAccess(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current && hasCameraAccess) {
      try {
        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0) return null; // Ensure video is ready

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (e) {
        console.error('Failed to capture camera frame:', e);
      }
    }
    return null;
  };

  // Re-attach active stream if the video element mounts or state changes
  const reattachStream = () => {
    if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      console.log('Re-attached active webcam stream to video element');
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
