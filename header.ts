/// <reference path="./util.ts" />
/// <reference path="./spritz.ts" />
/// <reference path="./hash.ts" />
namespace Spritz {

    export class Header {
        // helpful constant
        readonly length: number = 72;

        // this is the initialization vector
        iv: Uint8Array;

        // this is the encryption key
        key: Uint8Array;

        makeCipher(): Cipher {
            var c = new Cipher();
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
            var keyBytes = new Uint8Array(64);
            hashArray(keyBytes, pwBytes);

            var spritz = new Cipher();
            var iv2 = Uint8Array.from(iv);

            var iterations: number = 20000 + iv[3];
            for (var i: number = 0; i < iterations; ++i) {
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
            var result = new Uint8Array(76);

            if (this.iv == null) {
                this.iv = new Uint8Array(4);
                Util.randFill(this.iv);
            }

            if (this.key == null) {
                this.key = new Uint8Array(64);
                Util.randFill(this.key);
            }

            // set up the cipher
            var pwBytes = Util.encodeUTF8(pw);
            var headerCipher = new Cipher();
            headerCipher.soak(Header.keyGen(pwBytes, this.iv));

            // generate a hash of the pw, to mask the IV...
            var maskedIV = new Uint8Array(4);
            hashArray(maskedIV, pwBytes);
            Header.combineFour(maskedIV, this.iv);

            // generate a random token, and its hash...
            var checkToken = new Uint8Array(4);
            Util.randFill(checkToken);
            var checkHash = new Uint8Array(4);
            hashArray(checkHash, checkToken);

            var toSkip = checkToken[3]; // random skip amount...

            // encrypt the token and hash...
            headerCipher.squeezeXOR(checkToken);
            headerCipher.skip(toSkip);
            headerCipher.squeezeXOR(checkHash);

            // encrypt the key...
            var copiedKey = Uint8Array.from(this.key);
            headerCipher.squeezeXOR(copiedKey);

            // ok, now write everything out...
            result.set(maskedIV, 0);
            result.set(checkToken, 4);
            result.set(checkHash, 8);
            result.set(copiedKey, 12);

            return result;
        }

        parse(pw: string, b: Uint8Array): void {
            if (b.length != 76) {
                throw "header must be 76 bytes long";
            }

            // get the IV..
            this.iv = new Uint8Array(b.subarray(0, 4));
            var pwBytes = Util.encodeUTF8(pw);
            var ivMask = new Uint8Array(4);
            hashArray(ivMask, pwBytes);
            Header.combineFour(this.iv, ivMask);

            // set up the cipher to decrypt the header
            var headerCipher = new Cipher();
            headerCipher.soak(Header.keyGen(pwBytes, this.iv));
            var token = b.subarray(4, 8);
            headerCipher.squeezeXOR(token);
            headerCipher.skip(b[7]);
            headerCipher.squeezeXOR(b.subarray(8, 76));

            // check the token...	
            var hashedToken = new Uint8Array(4);
            hashArray(hashedToken, token);
            if (!hashedToken.every(function (hti, i) { return hti == token[i] })) {
                throw "bad password or corrupted stream";
            }

            // get the actual key...
            this.key = new Uint8Array(b.subarray(12));
        }


    }


}