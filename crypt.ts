/// <reference path="./util.ts" />
/// <reference path="./header.ts" />
/// <reference path="./spritz.ts" />
namespace Spritz {

	export class Crypt {

		static decrypt(pw: string, data: Uint8Array): [string, Uint8Array] {
			let hdr = new Header();
			hdr.parse(pw, data.subarray(0, hdr.length));
			// now decrypt the payload
			let cipher = hdr.makeCipher();
			cipher.squeezeXOR(data.subarray(hdr.length));

			// now read the filename, if any...
			let fnamelen = data[hdr.length];
			let fname = Util.decodeUTF8(data.subarray(hdr.length + 1, hdr.length + 1 + fnamelen))

			// return the filename and the decrypted data
			let payload = data.subarray(hdr.length + 1 + fnamelen)
			return [fname, payload];
		}

		static encrypt(pw: string, origFn: string, data: Uint8Array): Uint8Array {
			let hdr = new Header();
			let hdat = hdr.generate(pw);
			let cipher = hdr.makeCipher();

			// make an encrypted array for the filename
			let fnamedat = Util.encodeUTF8(origFn);
			let fnamelen = Uint8Array.of(fnamedat.length);
			cipher.squeezeXOR(fnamelen);
			cipher.squeezeXOR(fnamedat);

			// encrypt the payload
			cipher.squeezeXOR(data);

			// generate the result...
			let result = new Uint8Array(hdr.length + 1 + fnamedat.length + data.length);
			result.set(hdat, 0);
			result.set(fnamelen, hdat.length);
			result.set(fnamedat, hdat.length + 1);
			result.set(data, hdat.length + 1 + fnamedat.length);
			return result;
		}

		static encryptString(pw: string, origFN: string, data: string): Uint8Array {
			let databytes = Util.encodeUTF8(data);
			return this.encrypt(pw, origFN, databytes); 
		}

	}
}