import { constants, createPublicKey, publicEncrypt } from "crypto";

export function encrypt_ticket(key: Buffer, ticket: Buffer): Buffer {
    const publicKey = createPublicKey({
      key: key,
      format: 'der',
      type: 'spki',
    });
  
    return publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1',
      },
      ticket
    );
  }