import type {FC} from 'react';
import {Composition} from 'remotion';
import manifest from './data/screens.json';
import {PROMO_DURATION, PromoVertical} from './compositions/PromoVertical';

const {videoConfig} = manifest;

export const Root: FC = () => {
  return (
    <Composition
      id={videoConfig.id}
      component={PromoVertical}
      durationInFrames={PROMO_DURATION}
      fps={videoConfig.fps}
      width={videoConfig.width}
      height={videoConfig.height}
    />
  );
};
