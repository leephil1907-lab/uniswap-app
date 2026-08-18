import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-reader-container";

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setError(null);
      setScannedResult(null);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setError(null);
        setIsScanning(true);

        const html5Qrcode = new Html5Qrcode(elementId);
        scannerRef.current = html5Qrcode;

        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const cameraId = devices[0].id;
          await html5Qrcode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText) => {
              if (isMounted) {
                handleScannedCode(decodedText);
              }
            },
            (_errorMessage) => {
              // ignore frame decode errors
            }
          );
        } else {
          setError("No camera device found on this device.");
          setIsScanning(false);
        }
      } catch (err: any) {
        console.warn("[QRScanner] Camera start error:", err);
        setError(err.message || "Failed to access camera. You can upload a QR image instead.");
        setIsScanning(false);
      }
    };

    // Small delay to ensure DOM node is rendered
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const cleanEthereumAddress = (text: string): string => {
    let clean = text.trim();
    if (clean.toLowerCase().startsWith('ethereum:')) {
      clean = clean.substring(9);
    }
    // Remove query params if any (e.g. ethereum:0x123...?value=1)
    if (clean.includes('?')) {
      clean = clean.split('?')[0];
    }
    if (clean.includes('@')) {
      clean = clean.split('@')[0];
    }
    return clean;
  };

  const handleScannedCode = (rawText: string) => {
    const address = cleanEthereumAddress(rawText);
    setScannedResult(address);
    stopScanner();
    setTimeout(() => {
      onScan(address);
      onClose();
    }, 600);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const html5Qrcode = new Html5Qrcode("qr-file-temp");
      const decodedText = await html5Qrcode.scanFile(file, true);
      handleScannedCode(decodedText);
      html5Qrcode.clear();
    } catch (err: any) {
      setError("Could not read a valid QR code from the selected image.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div id="qr-file-temp" className="hidden" />

      <div className="bg-surface border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary bg-surface-2 hover:bg-border/40 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent mb-3">
          <Camera className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold font-display text-text-primary text-center">
          Scan QR Code
        </h3>
        <p className="text-xs text-text-secondary text-center mb-4">
          Point camera at recipient's wallet QR code or upload an image
        </p>

        {/* Scanner Video Frame */}
        <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border border-border/60 flex items-center justify-center mb-4">
          <div id={elementId} className="w-full h-full" />

          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-emerald-300">Address Scanned!</span>
              <span className="text-[11px] font-mono text-white/90 break-all mt-1 bg-black/40 p-2 rounded-xl border border-emerald-500/30">
                {scannedResult}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Image Option */}
        <label className="w-full bg-surface-2 hover:bg-border/40 border border-border/80 text-text-primary text-xs font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
          <Upload className="w-4 h-4 text-accent" />
          <span>Upload QR Image File</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
