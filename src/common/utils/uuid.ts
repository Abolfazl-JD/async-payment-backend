import { v4 as uuIdv4 } from 'uuid';

export function generateUuId(): string {
  return uuIdv4();
}
