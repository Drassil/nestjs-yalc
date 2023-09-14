import { Provider } from '@nestjs/common';

export function isProviderObject(obj: any): obj is Provider {
  return obj && typeof obj === 'object' && 'provide' in obj;
}
