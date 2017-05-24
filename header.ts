/// <reference path="./util.ts" />
/// <reference path="./spritz.ts" />
/// <reference path="./hash.ts" />
namespace Spritz {

    export class Header {
        // helpful constant
        readonly length: number = 76;

        // this is the initialization vector
        iv: Uint8Array;

        // this is the encryption key
        key: Uint8Array;

        makeCipher(): Cipher {
            let c = new Cipher();
            c.soak(this.key);
            c.skip(2048 + this.key[3]);
            return c;
        }

        // a little helper method
        private static combineFour(tgt: Uint8Array, src: Uint8Array): void {
            tgt[0] ^= src[0];
            tgt[1] ^= src[1];
            tgt[2] ^= src[2];
            tgt[3] ^= src[3];
        }

        private static keyGen(pwBytes: Uint8Array, iv: Uint8Array): Uint8Array {
            let keyBytes = new Uint8Array(64);
            Hash.ofArray(keyBytes, pwBytes);

            let spritz = new Cipher();
            let iv2 = Uint8Array.from(iv);

            let iterations: number = 20000 + iv[3];
            for (let i: number = 0; i < iterations; ++i) {
                spritz.reset();
                spritz.soak(iv2);
                spritz.absorbStop();
                spritz.soak(keyBytes);
                spritz.squeeze(keyBytes);
                iv2[0] = (iv2[0] + 1) & 0xFF;
                if (iv2[0] == 0) {
                    iv2[1] = (iv2[1] + 1) & 0xFF;
                    if (iv2[1] == 0) {
                        iv2[2] = (iv2[2] + 1) & 0xFF;
                        if (iv2[2] == 0) {
                            iv2[3] = (iv2[3] + 1) & 0xFF;
                        }
                    }
                }
            }
            return keyBytes;
        }

        /// <summary>Write the header to a freshly-allocated byte array</summary>
        generate(pw: string): Uint8Array {
            let result = new Uint8Array(76);

            if (this.iv == null) {
                this.iv = new Uint8Array(4);
                Util.randFill(this.iv);
            }

            if (this.key == null) {
                this.key = new Uint8Array(64);
                Util.randFill(this.key);
            }

            // set up the cipher
            let pwBytes = Util.encodeUTF8(pw);
            let headerCipher = new Cipher();
            headerCipher.soak(Header.keyGen(pwBytes, this.iv));

            // generate a hash of the pw, to mask the IV...
            let maskedIV = new Uint8Array(4);
            Hash.ofArray(maskedIV, pwBytes);
            Header.combineFour(maskedIV, this.iv);

            // generate a random token, and its hash...
            let checkToken = new Uint8Array(4);
            Util.randFill(checkToken);
            let checkHash = new Uint8Array(4);
            Hash.ofArray(checkHash, checkToken);

            let toSkip = checkToken[3]; // random skip amount...

            // encrypt the token and hash...
            headerCipher.squeezeXOR(checkToken);
            headerCipher.skip(toSkip);
            headerCipher.squeezeXOR(checkHash);

            // encrypt the key...
            let copiedKey = Uint8Array.from(this.key);
            headerCipher.squeezeXOR(copiedKey);

            // ok, now write everything out...
            result.set(maskedIV, 0);
            result.set(checkToken, 4);
            result.set(checkHash, 8);
            result.set(copiedKey, 12);

            return result;
        }

        parse(pw: string, b: Uint8Array): void {
            if (b.length != this.length) {
                throw "header is the wrong size";
            }

            // get the IV..
            this.iv = new Uint8Array(b.subarray(0, 4));
            let pwBytes = Util.encodeUTF8(pw);
            let ivMask = new Uint8Array(4);
            Hash.ofArray(ivMask, pwBytes);
            Header.combineFour(this.iv, ivMask);

            // set up the cipher to decrypt the header
            let headerCipher = new Cipher();
            headerCipher.soak(Header.keyGen(pwBytes, this.iv));
            let token = b.subarray(4, 8);
            headerCipher.squeezeXOR(token);
            headerCipher.skip(b[7]);
            headerCipher.squeezeXOR(b.subarray(8, 76));

            // check the token...	
            let hashedToken = new Uint8Array(4);
            Hash.ofArray(hashedToken, token);
            let srcToken = b.subarray(8,12); 
            if (!hashedToken.every(function (hti, i) { return hti == srcToken[i] })) {
                throw "bad password or corrupted stream";
            }

            // get the actual key...
            this.key = new Uint8Array(b.subarray(12));
        }


    }


}