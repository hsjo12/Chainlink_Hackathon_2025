type QRImageProps = {
  imageURL: string;
  setQrImage: (type: null) => void;
};
import { Button } from "@/components/ui/button";
import { CircleX } from "lucide-react";
export default function QRImage({ imageURL, setQrImage }: QRImageProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70"
      onClick={() => setQrImage(null)}
    >
      <div className=" w-[90%] mx-auto flex justify-end">
        <CircleX
          className="mb-4 cursor-pointer text-[#868686]"
          size={32}
          onClick={() => setQrImage(null)}
        />
      </div>

      <img
        src={imageURL}
        alt="QR Code"
        className="rounded-lg w-64 h-64 shadow-lg"
      />
    </div>
  );
}
