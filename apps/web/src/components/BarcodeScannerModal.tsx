import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X } from 'lucide-react'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onDetected: (code: string) => void
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (!isOpen) return

    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      },
      /* verbose= */ false
    )

    scannerRef.current.render(
      (decodedText) => {
        // Success
        onDetected(decodedText)
      },
      () => {
        // Ignored, happens constantly as it scans
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [isOpen, onDetected])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Escanear Código</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-100 rounded-xl overflow-hidden min-h-[300px]">
          <div id="reader" className="w-full h-full"></div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Apunta la cámara al código de barras del producto.
        </p>
      </div>
    </div>
  )
}
