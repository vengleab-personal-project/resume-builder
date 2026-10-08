// `bakong-khqr` ships as untyped CommonJS. These declarations mirror
// node_modules/bakong-khqr/src/{index,model/information,model/response}.js as of
// 1.0.20. Note the IndividualInfo constructor really is
// (accountID, merchantName, merchantCity, optional) -- the package README shows
// an outdated five-argument form with `currency` in third position.
declare module 'bakong-khqr' {
  export interface KhqrOptionalData {
    currency?: number;
    amount?: number;
    billNumber?: string;
    mobileNumber?: string;
    storeLabel?: string;
    terminalLabel?: string;
    purposeOfTransaction?: string;
    expirationTimestamp?: number;
    merchantCategoryCode?: string;
    accountInformation?: string;
    acquiringBank?: string;
  }

  export class IndividualInfo {
    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      optional?: KhqrOptionalData
    );
  }

  export class MerchantInfo extends IndividualInfo {
    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      merchantID: string,
      acquiringBank: string,
      optional?: KhqrOptionalData
    );
  }

  export interface KhqrResponse<T> {
    status: { code: number; errorCode: number | null; message: string | null };
    data: T | null;
  }

  export interface KhqrPayload {
    qr: string;
    md5: string;
  }

  export class BakongKHQR {
    generateIndividual(info: IndividualInfo): KhqrResponse<KhqrPayload>;
    generateMerchant(info: MerchantInfo): KhqrResponse<KhqrPayload>;
    static decode(khqrString: string): KhqrResponse<Record<string, unknown>>;
    static verify(khqrString: string): { isValid: boolean };
  }

  export const khqrData: {
    currency: { usd: number; khr: number };
    merchantType: { merchant: string; individual: string };
  };
}
