import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';

/** Pull embedded QR_xxx / QR-xxx out of raw webcam payload (plain or URL). */
export function extractQrPayload(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/QR[_-][A-Za-z0-9\-]+/i);
  return (match ? match[0] : trimmed).toUpperCase();
}

export const useQrScanner = (
  gateState: 'SCANNING' | 'COMPARING' | 'GATE_OPEN',
  hasCameraAccess: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  triggerScan: (data: string) => Promise<void>
) => {
  const triggerScanRef = useRef(triggerScan);
  const gateStateRef = useRef(gateState);
  const lastHandledRef = useRef<{ code: string; at: number } | null>(null);

  triggerScanRef.current = triggerScan;
  gateStateRef.current = gateState;

  useEffect(() => {
    if (!hasCameraAccess) return;

    let active = true;
    let frameId = 0;
    let isProcessing = false;

    const decodeLoop = () => {
      if (!active) return;

      if (gateStateRef.current === 'SCANNING' && videoRef.current && !isProcessing) {
        const video = videoRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (code?.data) {
                const payload = extractQrPayload(code.data);
                const now = Date.now();
                const last = lastHandledRef.current;
                // Prevent spam-scanning the same dead/cancelled QR every frame.
                if (payload && (!last || last.code !== payload || now - last.at > 4500)) {
                  lastHandledRef.current = { code: payload, at: now };
                  isProcessing = true;
                  console.log('Webcam scanned QR successfully:', payload);
                  Promise.resolve(triggerScanRef.current(payload)).finally(() => {
                    setTimeout(() => {
                      isProcessing = false;
                    }, 2000);
                  });
                }
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }

      frameId = requestAnimationFrame(decodeLoop);
    };

    frameId = requestAnimationFrame(decodeLoop);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
    // Intentionally only depend on camera access — gateState/triggerScan via refs
    // so notification polls don't tear down the decode loop.
  }, [hasCameraAccess, videoRef]);
};
