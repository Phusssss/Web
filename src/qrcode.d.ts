declare module 'qrcode' {
    export function toDataURL(data: string, callback: (err: any, url: string) => void): void;
  }
  