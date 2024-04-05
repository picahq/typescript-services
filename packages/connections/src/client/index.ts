import { getHeaders } from '../logic/getHeaders';
import { createEventLinkTokenApi } from '../apis';

interface ClientConfig {
  baseUrl?: string;
}

export class AuthKitToken {
  private secret: string;
  private configs: ClientConfig;

  constructor(secret: string, configs: ClientConfig = {}) {
    this.secret = secret;
    this.configs = configs;
  }

  /**
   * Not for use outside the SDK lib
   */
  get _clientInfo() {
    return {
      secret: this.secret,
      configs: this.configs,
    };
  }

  get _url() {
    if (this.configs.baseUrl) {
      return this.configs.baseUrl;
    }

    return 'https://api.integrationos.com/internal';
  }

  async create(payload: {
    version?: string;
    label?: string;
    group: string;
    ttl?: number;
  }) {
    const secret = this._clientInfo.secret;
    const url = this._url;
    const headers = getHeaders(secret);

    const result = await createEventLinkTokenApi(headers, url, payload, secret);
    return result;
  }
}
