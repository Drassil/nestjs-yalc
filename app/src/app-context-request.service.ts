import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
/**
 * It's purpose is to preserve information during the lifespam of a request.
 * i.e: headers that need to be propagatted to internal API calls
 */
export class AppContextRequestService {
  private headers = new Map();

  setHeader(key: string, value: string) {
    this.headers.set(key, value);
  }

  getHeader(key: string): string {
    return this.headers.get(key);
  }

  getHeaders(): { string: string } {
    return Object.fromEntries(this.headers);
  }
}
