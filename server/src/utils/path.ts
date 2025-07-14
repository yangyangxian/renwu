import path from 'path'
import appConfig from '../appConfig';
import { fileURLToPath } from 'url';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
export const serverRootDir : string = path.resolve(currentDirname, '..');
export const staticDistDir : string = path.resolve(serverRootDir, appConfig.staticDir);