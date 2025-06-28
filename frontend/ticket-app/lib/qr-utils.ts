import QRCode from 'qrcode'

export interface QRCodeData {
  validationUrl: string
}

export function generateQRCodeData(
  contractAddress: string,
  tokenId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // {{baseURL}}/api/ticket-validation?contractAddress=0x1234567890abcdef1234567890abcdef12345678&tokenId=aaa9ec2d-7005-46bf-92a6-1f8fe5494910
  const validationUrl = `${baseUrl}/api/ticket-validation?contractAddress=${encodeURIComponent(
    contractAddress
  )}&tokenId=${encodeURIComponent(tokenId)}`

  const qrData: QRCodeData = {
    validationUrl,
  }

  return validationUrl
}

export async function generateQRCodeImage(
  tokenId: string,
  contractAddress: string
): Promise<string> {
  try {
    const data = generateQRCodeData(contractAddress, tokenId)
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}
