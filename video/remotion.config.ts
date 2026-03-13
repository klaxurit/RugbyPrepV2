import {existsSync} from 'node:fs';
import {Config} from '@remotion/cli/config';

const localChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

if (existsSync(localChromePath)) {
  Config.setBrowserExecutable(localChromePath);
}
