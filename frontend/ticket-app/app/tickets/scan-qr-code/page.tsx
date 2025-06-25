'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import {
  CheckCircle,
  XCircle,
  Scan,
  User,
  Calendar,
  MapPin,
  Ticket,
  AlertCircle,
} from 'lucide-react'

interface ValidationResult {
  success: boolean
  message: string
  data?: {
    ticket: {
      id: string
      tokenId: string
      status: string
      usedAt: string
      usedBy: string
      event: {
        title: string
        location: string
        startDate: string
      }
      owner: {
        username: string
        firstName?: string
        lastName?: string
      }
      ticketType: {
        name: string
      }
    }
  }
}

export default function ScanQrCode() {
  const [isScanning, setIsScanning] = useState(false)
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [staffInfo, setStaffInfo] = useState({ id: '', name: '' }) // Kept for completeness
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const qrcodeRegionId = 'html5qr-code-full-region'

  const config = {
    fps: 60,
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
  }

  // Ref to hold the current `isScanning` value, useful in callbacks
  const isScanningRef = useRef(isScanning)
  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    // Only process if we are currently in scanning mode
    if (!isScanningRef.current) {
      console.log(
        'Scan result received, but scanner is no longer active. Ignoring.'
      )
      return
    }

    setIsLoading(true)
    // Do NOT call setIsScanning(false) here immediately.
    // We want the scanner to continue scanning until explicitly stopped by the user
    // or until the validation process (if it involves an API call) decides to stop it.

    try {
      alert(
        `QR Code scanned successfully! ${decodedText}, ${JSON.stringify(
          decodedResult
        )}`
      )

      // Simulate API call or validation logic
      // In a real app, you'd fetch /api/validateTicket?code=${decodedText}
      const mockSuccess = decodedText.includes('valid') // Example condition
      if (mockSuccess) {
        setValidationResult({
          success: true,
          message: 'Ticket validated successfully!',
          data: {
            ticket: {
              id: 'mock-id-123',
              tokenId: decodedText,
              status: 'valid',
              usedAt: new Date().toISOString(),
              usedBy: staffInfo.name || 'Unknown Staff',
              event: {
                title: 'Mock Event Name',
                location: 'Virtual World',
                startDate: '2025-07-01T10:00:00Z',
              },
              owner: {
                username: 'mockuser',
                firstName: 'John',
                lastName: 'Doe',
              },
              ticketType: {
                name: 'General Admission',
              },
            },
          },
        })
        // After a successful validation, you likely want to stop the scanner
        setIsScanning(false) // This will trigger the useEffect cleanup
      } else {
        setValidationResult({
          success: false,
          message: 'Invalid ticket or already used.',
        })
        // If validation fails, perhaps the scanner should continue for the next attempt
        // Or stop it if you want to force user to click start again
        // For now, let's keep it scanning on failure
        // setIsScanning(false); // Optional: stop on failure too
      }
    } catch (error) {
      console.error('Validation error:', error)
      setValidationResult({
        success: false,
        message: 'Failed to validate ticket. Please try again.',
      })
      // Ensure scanner is stopped on critical errors
      setIsScanning(false)
    } finally {
      setIsLoading(false)
    }
  }

  const onScanFailure = (error: string) => {
    // Handle scan failure silently or log for debugging
    // This often fires continuously if no QR code is in view.
    // Avoid setting state here unless it's for a specific error message.
    // console.warn('QR scan error:', error);
  }

  const startScanning = () => {
    setIsScanning(true)
    setValidationResult(null) // Clear previous results
  }

  const stopScanning = async () => {
    // This will trigger the cleanup in the useEffect
    if (scannerRef.current && isScanning) {
      // Ensure scanner exists and is active before trying to clear
      try {
        await scannerRef.current.clear()
      } catch (err) {
        // This catch specifically handles the "already under transition" error
        console.warn('Attempted to clear scanner while it was busy:', err)
      } finally {
        scannerRef.current = null
        setIsScanning(false) // Set state AFTER attempting to clear
      }
    } else {
      setIsScanning(false) // If scanner is not active, just update state
    }
  }

  // useEffect to manage the Html5QrcodeScanner lifecycle
  useEffect(() => {
    let html5QrcodeScannerInstance: Html5QrcodeScanner | null = null

    if (isScanning) {
      const element = document.getElementById(qrcodeRegionId)
      if (!element) {
        console.error(`Element with ID ${qrcodeRegionId} not found.`)
        setIsScanning(false) // Reset state if element is missing unexpectedly
        return
      }

      // If a scanner instance already exists, clear it before creating a new one
      // This is a failsafe, usually not needed with proper cleanup
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((e) => console.warn('Pre-existing scanner clear failed:', e))
        scannerRef.current = null
      }

      html5QrcodeScannerInstance = new Html5QrcodeScanner(
        qrcodeRegionId,
        config,
        /* verbose= */ true
      )

      // Store the instance in ref
      scannerRef.current = html5QrcodeScannerInstance

      // Render the scanner
      html5QrcodeScannerInstance.render(onScanSuccess, onScanFailure)
    } else {
      // Cleanup: clear the scanner when `isScanning` is false
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => {
            // This is the specific error you're seeing.
            // It means Html5Qrcode is already in the middle of a state change (like stopping).
            // We can often just log it and proceed, as the state will eventually settle.
            console.warn(
              'Failed to clear html5QrcodeScanner during cleanup (possibly already stopping):',
              err
            )
          })
          .finally(() => {
            scannerRef.current = null // Ensure ref is nulled after attempting clear
          })
      }
    }

    // Cleanup function: This runs when the component unmounts or when `isScanning` changes to false
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => {
            console.warn(
              'Failed to clear html5QrcodeScanner on unmount/re-render:',
              err
            )
          })
          .finally(() => {
            scannerRef.current = null
          })
      }
    }
  }, [isScanning]) // Depend on isScanning

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      console.error('Invalid date string:', dateString, e)
      return 'Invalid Date'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Scan className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Staff Ticket Validation
            </h1>
            <p className="text-gray-600">
              Scan QR codes to validate event tickets
            </p>
          </div>

          {/* Scanner Section */}
          <div className="text-center mb-6">
            {!isScanning && !isLoading && (
              <button
                onClick={startScanning}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Scan className="w-5 h-5 mr-2" />
                Start Scanning
              </button>
            )}

            {isScanning && (
              <>
                <div
                  id={qrcodeRegionId}
                  className="mx-auto mb-4 border border-gray-300 rounded-lg overflow-hidden"
                ></div>
                <button
                  onClick={stopScanning}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-4"
                >
                  Stop Scanning
                </button>
              </>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Validating ticket...</span>
              </div>
            )}
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`rounded-lg p-6 mb-6 ${
                validationResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center mb-4">
                {validationResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-2" />
                )}
                <h3
                  className={`text-lg font-semibold ${
                    validationResult.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {validationResult.success
                    ? 'Ticket Valid'
                    : 'Validation Failed'}
                </h3>
              </div>

              <p
                className={`mb-4 ${
                  validationResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {validationResult.message}
              </p>

              {validationResult.success && validationResult.data && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <Ticket className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Token ID:</span>
                    <span className="ml-2 font-mono text-sm">
                      {validationResult.data.ticket.tokenId}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Event:</span>
                    <span className="ml-2 font-medium">
                      {validationResult.data.ticket.event.title}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="ml-2">
                      {validationResult.data.ticket.event.location}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Ticket Holder:
                    </span>
                    <span className="ml-2">
                      {validationResult.data.ticket.owner.firstName &&
                      validationResult.data.ticket.owner.lastName
                        ? `${validationResult.data.ticket.owner.firstName} ${validationResult.data.ticket.owner.lastName}`
                        : validationResult.data.ticket.owner.username}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Validated At:</span>
                    <span className="ml-2">
                      {formatDate(validationResult.data.ticket.usedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Enter your staff ID and name above (if enabled)</li>
              <li>2. Click "Start Scanning" to activate the camera</li>
              <li>3. Point the camera at the ticket's QR code</li>
              <li>4. The system will automatically validate the ticket</li>
              <li>5. Check the validation result before allowing entry</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
