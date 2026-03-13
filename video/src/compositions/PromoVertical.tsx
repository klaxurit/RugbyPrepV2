import type {FC, ReactNode} from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import manifest from '../data/screens.json';
import {PhoneFrame} from './PhoneFrame';

type PromoScreen = (typeof manifest.screens)[number];

const {videoConfig, brand, intro, screens, outro} = manifest;
const TRANSITION_FRAMES = videoConfig.transitionFrames;

const buildSceneStarts = (durations: number[]): number[] => {
  const starts: number[] = [];
  let cursor = 0;

  durations.forEach((duration, index) => {
    starts.push(cursor);

    cursor += duration;
    if (index < durations.length - 1) {
      cursor -= TRANSITION_FRAMES;
    }
  });

  return starts;
};

const SCENE_DURATIONS = [intro.duration, ...screens.map((screen) => screen.duration), outro.duration];
const SCENE_STARTS = buildSceneStarts(SCENE_DURATIONS);

export const PROMO_DURATION =
  SCENE_DURATIONS.reduce((sum, duration) => sum + duration, 0) -
  TRANSITION_FRAMES * (SCENE_DURATIONS.length - 1);

const SCENE_FONT = '"Arial Black", Impact, sans-serif';
const BODY_FONT = '"Helvetica Neue", Arial, sans-serif';

const useSceneProgress = (durationInFrames: number) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 20, durationInFrames - 1],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const contentY = interpolate(frame, [0, 24], [42, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {opacity, contentY};
};

const BackgroundShell: FC<{
  accent: string;
  secondary: string;
  children: ReactNode;
}> = ({accent, secondary, children}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 28) * 0.03;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 15% 15%, ${accent}33, transparent 24%), radial-gradient(circle at 82% 18%, ${secondary}33, transparent 28%), linear-gradient(180deg, #120907 0%, #1a100c 54%, #0f0705 100%)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'linear-gradient(180deg, transparent 0%, white 12%, white 88%, transparent 100%)',
          opacity: 0.28,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 78,
          borderRadius: 72,
          border: '2px solid rgba(255,255,255,0.06)',
          transform: `scale(${pulse})`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Pill: FC<{
  label: string;
  accent?: string;
}> = ({label, accent = '#ff6b35'}) => {
  return (
    <div
      style={{
        padding: '18px 26px',
        borderRadius: 999,
        border: `1px solid ${accent}55`,
        backgroundColor: 'rgba(255,255,255,0.06)',
        color: 'white',
        fontFamily: BODY_FONT,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </div>
  );
};

const IntroScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {opacity, contentY} = useSceneProgress(intro.duration);

  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 0.8,
    },
  });

  return (
    <BackgroundShell accent="#ff6b35" secondary="#1a5f3f">
      <AbsoluteFill
        style={{
          opacity,
          padding: '140px 90px 120px',
          transform: `translateY(${contentY}px)`,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              padding: '16px 24px',
              borderRadius: 999,
              border: '1px solid rgba(255,107,53,0.35)',
              backgroundColor: 'rgba(255,107,53,0.12)',
              color: '#ff9f7a',
              fontFamily: BODY_FONT,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {brand.eyebrow}
          </div>
          <div style={{marginTop: 56, display: 'flex', alignItems: 'center', gap: 34}}>
            <Img
              src={staticFile(intro.logoPath)}
              style={{
                width: 250,
                height: 250,
                objectFit: 'contain',
                transform: `scale(${0.82 + logoScale * 0.18}) rotate(${(1 - logoScale) * -12}deg)`,
                filter: 'drop-shadow(0 24px 30px rgba(255,107,53,0.28))',
              }}
            />
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              <div
                style={{
                  fontFamily: SCENE_FONT,
                  fontSize: 116,
                  lineHeight: 0.86,
                  color: 'white',
                  textTransform: 'uppercase',
                }}
              >
                {brand.name}
              </div>
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 40,
                  lineHeight: 1.25,
                  color: '#d4d4d8',
                  maxWidth: 540,
                }}
              >
                {brand.tagline}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 44,
              fontFamily: BODY_FONT,
              fontSize: 36,
              lineHeight: 1.42,
              color: '#cbd5e1',
              maxWidth: 860,
            }}
          >
            {brand.subline}
          </div>
        </div>

        <div style={{display: 'flex', gap: 22}}>
          {intro.stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: '28px 26px',
                borderRadius: 34,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontFamily: SCENE_FONT,
                  fontSize: 64,
                  color: '#ff6b35',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: BODY_FONT,
                  fontSize: 24,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </BackgroundShell>
  );
};

const PromoSlide: FC<{
  screen: PromoScreen;
  index: number;
}> = ({screen, index}) => {
  const {opacity, contentY} = useSceneProgress(screen.duration);
  const frame = useCurrentFrame();
  const tiltDeg = index % 2 === 0 ? -4 : 4;
  const badgeX = Math.sin(frame / 20) * 8;

  return (
    <BackgroundShell accent={screen.accent} secondary={screen.secondary}>
      <AbsoluteFill
        style={{
          opacity,
          padding: '120px 78px 110px',
          transform: `translateY(${contentY}px)`,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              padding: '14px 22px',
              borderRadius: 999,
              border: `1px solid ${screen.accent}66`,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: screen.accent,
              fontFamily: BODY_FONT,
              fontSize: 26,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1.4,
            }}
          >
            {screen.eyebrow}
          </div>
          <div
            style={{
              fontFamily: SCENE_FONT,
              fontSize: 92,
              lineHeight: 0.95,
              color: 'white',
              textTransform: 'uppercase',
              maxWidth: 900,
            }}
          >
            {screen.title}
          </div>
          <div
            style={{
              fontFamily: BODY_FONT,
              fontSize: 34,
              lineHeight: 1.35,
              color: '#d6d3d1',
              maxWidth: 900,
            }}
          >
            {screen.description}
          </div>
        </div>

        <div
          style={{
            marginTop: 42,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {screen.chips.map((chip) => (
            <Pill key={chip} label={chip} accent={screen.accent} />
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginTop: 28,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 90,
              left: 36,
              padding: '18px 24px',
              borderRadius: 28,
              background: `linear-gradient(135deg, ${screen.accent}, ${screen.secondary})`,
              color: 'white',
              fontFamily: BODY_FONT,
              fontSize: 26,
              fontWeight: 800,
              transform: `translateX(${badgeX}px)`,
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
            }}
          >
            {screen.kicker}
          </div>
          <PhoneFrame imagePath={screen.imagePath} accent={screen.accent} tiltDeg={tiltDeg} />
        </div>
      </AbsoluteFill>
    </BackgroundShell>
  );
};

const OutroScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {opacity, contentY} = useSceneProgress(outro.duration);
  const buttonSpring = spring({
    frame,
    fps,
    delay: 8,
    config: {
      damping: 12,
      stiffness: 130,
    },
  });

  return (
    <BackgroundShell accent="#ff6b35" secondary="#1a5f3f">
      <AbsoluteFill
        style={{
          opacity,
          padding: '170px 84px 150px',
          transform: `translateY(${contentY}px)`,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: BODY_FONT,
            fontSize: 28,
            color: '#ff9f7a',
            textTransform: 'uppercase',
            letterSpacing: 4,
            fontWeight: 800,
          }}
        >
          {brand.name}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: SCENE_FONT,
            fontSize: 108,
            lineHeight: 0.94,
            color: 'white',
            textTransform: 'uppercase',
            maxWidth: 880,
          }}
        >
          {outro.headline}
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: BODY_FONT,
            fontSize: 38,
            lineHeight: 1.35,
            color: '#d6d3d1',
            maxWidth: 840,
          }}
        >
          {outro.subline}
        </div>
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Pill label="Programme periodise" />
          <Pill label="Charge maitrisee" />
          <Pill label="Coach IA" />
        </div>

        <div
          style={{
            marginTop: 88,
            padding: '26px 42px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #ff6b35, #ff8759)',
            color: 'white',
            fontFamily: BODY_FONT,
            fontSize: 34,
            fontWeight: 900,
            boxShadow: '0 24px 56px rgba(255,107,53,0.32)',
            transform: `scale(${0.9 + buttonSpring * 0.1})`,
          }}
        >
          {outro.cta}
        </div>
      </AbsoluteFill>
    </BackgroundShell>
  );
};

export const PromoVertical: FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#100705'}}>
      <Sequence from={SCENE_STARTS[0]} durationInFrames={intro.duration}>
        <IntroScene />
      </Sequence>

      {screens.map((screen, index) => (
        <Sequence
          key={screen.id}
          from={SCENE_STARTS[index + 1]}
          durationInFrames={screen.duration}
        >
          <PromoSlide screen={screen} index={index} />
        </Sequence>
      ))}

      <Sequence
        from={SCENE_STARTS[SCENE_STARTS.length - 1]}
        durationInFrames={outro.duration}
      >
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
