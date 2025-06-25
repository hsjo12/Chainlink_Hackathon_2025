import { generateQRCodeImage } from '@/lib/qr-utils'

export default async function GenerateQRCodePage() {
  try {
    const qrData = 'Sample QR Code Data' // Replace with actual data
    const qrCodeImage = await generateQRCodeImage(
      'aaa9ec2d-7005-46bf-92a6-1f8fe5494910',
      '0x1234567890abcdef1234567890abcdef12345678'
    )

    return (
      <div>
        <h1>Generated QR Code</h1>
        <img src={qrCodeImage} alt="QR Code" />
      </div>
    )
  } catch (error) {
    console.error('Error generating QR code:', error)
    return <div>Error generating QR code</div>
  }
}
