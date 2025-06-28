import { generateQRCodeImage } from '@/lib/qr-utils'
import z from 'zod'

const GenerateQRCodePageProps = z.object({
  tokenId: z.string().min(1, 'Ticket address is required'),
  contractAddress: z.string().min(1, 'Organizer address is required'),
})

export default async function GenerateQRCodePage(
  props: z.infer<typeof GenerateQRCodePageProps>
) {
  try {
    const qrCodeImage = await generateQRCodeImage(
      props.tokenId,
      props.contractAddress
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
