import { useEffect } from 'react';
import jsQR from 'jsqr';

export const useQrScanner = (
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN',
  hasCameraAccess: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  triggerScan: (data: string) => Promise<void>
) => {
  useEffect(() => {
    let active = true;
    let frameId: number;
    let isProcessing = false;

    const decodeLoop = () => {
      if (!active) return;

      if (gateState === 'SCANNING' && hasCameraAccess && videoRef.current && !isProcessing) {
        const video = videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                isProcessing = true;
                console.log('Webcam scanned QR successfully:', code.data);
                triggerScan(code.data);
                setTimeout(() => {
                  isProcessing = false;
                }, 1500);
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      if (gateState === 'SCANNING') {
        frameId = requestAnimationFrame(decodeLoop);
      } else {
        setTimeout(() => {
          if (active) frameId = requestAnimationFrame(decodeLoop);
        }, 1000);
      }
    };

    if (hasCameraAccess && gateState === 'SCANNING') {
      frameId = requestAnimationFrame(decodeLoop);
    }

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [hasCameraAccess, gateState, triggerScan]);
};
