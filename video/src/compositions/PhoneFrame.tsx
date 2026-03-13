import type {FC} from 'react';
import {Img, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

interface PhoneFrameProps {
  imagePath: string;
  accent: string;
  tiltDeg?: number;
}

export const PhoneFrame: FC<PhoneFrameProps> = ({
  imagePath,
  accent,
  tiltDeg = -4,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 16,
      stiffness: 110,
      mass: 0.9,
    },
  });

  const floatY = Math.sin(frame / 18) * 12;
  const rotate = tiltDeg + Math.sin(frame / 32) * 1.8;
  const scale = 0.9 + entrance * 0.1;
  const shadowOpacity = 0.22 + entrance * 0.2;

  return (
    <div
      style={{
        position: 'relative',
        width: 560,
        height: 1120,
        borderRadius: 72,
        padding: 18,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))',
        boxShadow: `0 40px 110px rgba(0, 0, 0, ${shadowOpacity}), 0 0 80px ${accent}33`,
        transform: `translateY(${floatY}px) rotate(${rotate}deg) scale(${scale})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 132,
          height: 26,
          borderRadius: 999,
          backgroundColor: '#160c09',
          zIndex: 3,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 56,
          overflow: 'hidden',
          backgroundColor: '#050505',
          position: 'relative',
        }}
      >
        <Img
          src={staticFile(imagePath)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </div>
  );
};
