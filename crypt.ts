/// <reference path="./util.ts" />
/// <reference path="./header.ts" />
/// <reference path="./spritz.ts" />
namespace Spritz {

	export class Crypt {

		static decrypt(pw: string, data: Uint8Array): [string,Uint8Array] {
			let hdr = new Header();
			hdr.parse(pw, data.subarray(0,hdr.length));
			// now decrypt the payload
			let cipher = hdr.makeCipher();
			cipher.squeezeXOR(data.subarray(hdr.length));
			
			// now read the filename, if any...
			let fnamelen = data[hdr.length];
			let fname = Util.decodeUTF8(data.subarray(hdr.length+1,hdr.length+1+fnamelen))

			// return the filename and the decrypted data
			let payload = data.subarray(hdr.length+1+fnamelen)
			return [fname, payload];
		}
	}

}