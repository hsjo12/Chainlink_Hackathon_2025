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

// Define the shape of the API response for ticket validation (GET)
interface TicketValidationGetResponse {
  ticketValidation: {
    id: string
    contractAddress: string
    tokenId: string
    eventId: string
    ticketTypeId: string
    isUsed: boolean
    usedAt: string | null
    validatedBy: string | null
    createdAt: string
    updatedAt: string
  }
}

// Define the shape for the PUT request body based on your schema
interface UpdateTicketValidationPayload {
  isUsed: boolean
  usedAt?: string
  validatedBy?: string
}

// Extend your ValidationResult interface to include more detailed ticket info
interface ValidationResult {
  success: boolean
  message: string
  data?: {
    ticket: {
      id: string
      tokenId: string
      status: string // e.g., "valid", "used", "invalid", "marked_used"
      usedAt: string | null // Can be null if not used
      usedBy: string | null // Can be null if not used
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
  const [staffInfo, setStaffInfo] = useState({
    id: 'STAFF123',
    name: 'John Doe',
  })
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const qrcodeRegionId = 'html5qr-code-full-region'

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
  }

  const isScanningRef = useRef(isScanning)
  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (!isScanningRef.current) {
      console.log(
        'Scan result received, but scanner is no longer active. Ignoring.'
      )
      return
    }

    setIsLoading(true)
    setValidationResult(null) // Clear previous validation results

    try {
      console.log(`QR Code scanned successfully! Decoded text: ${decodedText}`)

      // 1. Parse the URL from the QR code content
      const url = new URL(decodedText)
      const contractAddress = url.searchParams.get('contractAddress')
      const tokenId = url.searchParams.get('tokenId')

      if (!contractAddress || !tokenId) {
        setValidationResult({
          success: false,
          message:
            'QR code content is invalid. Missing contractAddress or tokenId.',
        })
        setIsScanning(false) // Stop scanning on invalid QR content
        return
      }

      // 2. Perform GET request to check current ticket status
      const getValidationApiUrl = `/api/ticket-validation?contractAddress=${contractAddress}&tokenId=${tokenId}`
      const getResponse = await fetch(getValidationApiUrl)

      if (!getResponse.ok) {
        const errorData = await getResponse
          .json()
          .catch(() => ({ message: 'Unknown error' }))
        setValidationResult({
          success: false,
          message: `API Error (GET): ${getResponse.status} - ${
            errorData.message || 'Failed to fetch validation data.'
          }`,
        })
        setIsScanning(false) // Stop on GET API error
        return
      }

      const getResult: TicketValidationGetResponse = await getResponse.json()
      const ticketValidation = getResult.ticketValidation

      // Simulate getting event/owner/ticketType info (you'll need real data here)
      // This is still placeholder data. In a real app, this should come from
      // your backend either as part of the initial GET response or a separate API.
      const mockTicketDetails = {
        event: {
          title: 'Summer Music Fest',
          location: 'Open Air Arena',
          startDate: '2025-08-10T18:00:00Z',
        },
        owner: { username: 'johndoe123', firstName: 'John', lastName: 'Doe' },
        ticketType: { name: 'VIP Pass' },
      }

      if (ticketValidation.isUsed) {
        // Ticket is already used
        setValidationResult({
          success: false,
          message: 'Ticket has already been used.',
          data: {
            ticket: {
              id: ticketValidation.id,
              tokenId: ticketValidation.tokenId,
              status: 'used',
              usedAt: ticketValidation.usedAt,
              usedBy: ticketValidation.validatedBy,
              event: mockTicketDetails.event, // Use mock data for display
              owner: mockTicketDetails.owner, // Use mock data for display
              ticketType: mockTicketDetails.ticketType, // Use mock data for display
            },
          },
        })
        setIsScanning(false) // Stop scanning after detecting used ticket
      } else {
        // Ticket is valid and not used, proceed to mark it as used
        const now = new Date().toISOString()
        const updatePayload: UpdateTicketValidationPayload = {
          isUsed: true,
        }

        const putValidationApiUrl = `/api/ticket-validation/${ticketValidation.id}` // Your PUT API uses ID in params
        const putResponse = await fetch(putValidationApiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        })

        if (!putResponse.ok) {
          const updateErrorData = await putResponse
            .json()
            .catch(() => ({ message: 'Unknown error' }))
          setValidationResult({
            success: false,
            message: `API Error (PUT): ${putResponse.status} - ${
              updateErrorData.message || 'Failed to mark ticket as used.'
            }`,
          })
          setIsScanning(false) // Stop on PUT API error
          return
        }

        // Successfully marked as used
        setValidationResult({
          success: true,
          message:
            'Ticket successfully validated and marked as used. Allow entry!',
          data: {
            ticket: {
              id: ticketValidation.id,
              tokenId: ticketValidation.tokenId,
              status: 'marked_used', // Custom status for clarity
              usedAt: now,
              usedBy: staffInfo.name || staffInfo.id, // Display staff name if available, else ID
              event: mockTicketDetails.event, // Use mock data for display
              owner: mockTicketDetails.owner, // Use mock data for display
              ticketType: mockTicketDetails.ticketType, // Use mock data for display
            },
          },
        })
        setIsScanning(false) // Stop scanning after successful validation and usage
      }
    } catch (error) {
      console.error('Validation process error:', error)
      setValidationResult({
        success: false,
        message:
          'An unexpected error occurred during validation. Check console for details.',
      })
      setIsScanning(false) // Stop scanning on unexpected errors
    } finally {
      setIsLoading(false)
    }
  }

  const onScanFailure = (error: string) => {
    // console.warn('QR scan error:', error);
  }

  const startScanning = () => {
    setIsScanning(true)
    setValidationResult(null)
  }

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.clear()
        console.log('Scanner cleared successfully.')
      } catch (err) {
        console.warn('Failed to clear html5QrcodeScanner while stopping:', err)
      } finally {
        scannerRef.current = null
        setIsScanning(false)
      }
    } else {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    if (isScanning) {
      const element = document.getElementById(qrcodeRegionId)
      if (!element) {
        console.error(`Element with ID ${qrcodeRegionId} not found.`)
        setIsScanning(false)
        return
      }

      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((e) => console.warn('Pre-existing scanner clear failed:', e))
        scannerRef.current = null
      }

      scannerRef.current = new Html5QrcodeScanner(
        qrcodeRegionId,
        config,
        /* verbose= */ true
      )

      scannerRef.current.render(onScanSuccess, onScanFailure)
    } else {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => {
            console.warn(
              'Failed to clear html5QrcodeScanner during cleanup:',
              err
            )
          })
          .finally(() => {
            scannerRef.current = null
          })
      }
    }

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
  }, [isScanning, config])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      console.error('Invalid date string:', dateString, e)
      return 'Invalid Date'
    }
  }

  // Optional: Function to save staff info if you uncomment the input fields
  // const saveStaffInfo = () => {
  //   // Implement saving staffInfo to localStorage or a global state if desired
  //   console.log('Staff Info Saved:', staffInfo);
  // };

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

          {/* Staff Information (Uncomment and implement saveStaffInfo if needed) */}
          {/* <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Staff Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff ID
                </label>
                <input
                  type="text"
                  value={staffInfo.id}
                  onChange={(e) =>
                    setStaffInfo({ ...staffInfo, id: e.target.value })
                  }
                  // onBlur={saveStaffInfo} // Uncomment if you have this function
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your staff ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={staffInfo.name}
                  onChange={(e) =>
                    setStaffInfo({ ...staffInfo, name: e.target.value })
                  }
                  // onBlur={saveStaffInfo} // Uncomment if you have this function
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          </div> */}

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
                    ? 'Ticket Validated!'
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

              {validationResult.data && (
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
                    <span className="text-sm text-gray-600">
                      {validationResult.data.ticket.status === 'used'
                        ? 'Used At:'
                        : 'Validated At:'}
                    </span>
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
              <li>
                1. Ensure your staff ID and name are entered (if enabled).
              </li>
              <li>2. Click "Start Scanning" to activate the camera.</li>
              <li>
                3. Point the camera at the ticket's QR code (which contains the
                API URL).
              </li>
              <li>
                4. The system will automatically validate and mark the ticket.
              </li>
              <li>5. Check the validation result before allowing entry.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
