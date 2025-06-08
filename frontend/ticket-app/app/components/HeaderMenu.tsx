import Image from 'next/image';
import vercel from '../../public/vercel.svg';

export function HeaderMenu() {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Image width={50} height={50} alt="map icon" src={vercel} />
      <div style={{ marginLeft: 10 }} className="rr-title">
      Chainlink Hackathon 2025
      </div>
    </header>
  );
}
