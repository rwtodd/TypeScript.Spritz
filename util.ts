namespace Spritz {

	export class Util {
		// convert a unicode string to utf-8
		// FIXME this is not good for unicode... just assumes everything is 127 or less...
		static encodeUTF8(src: string): Uint8Array {
			var answer = new Uint8Array(src.length)
			for (var idx = 0; idx < answer.length; idx++) {
				answer[idx] = src.charCodeAt(idx) & 0xFF;
			}
			return answer
		}

		// convert an array of utf-8 into a string
		// FIXME this is not good for unicode... just assumes everything is 127 or less...
		static decodeUTF8(src: Uint8Array): string {
			return String.fromCharCode.apply(null, src)
		}

		// turn an array into base64 string
		static b64Array(src: Uint8Array): string {
			return btoa(String.fromCharCode.apply(null, src))
		}

		// fill an array with random bytes
		static randFill(tgt: Uint8Array): void {
			for (var idx = 0; idx < tgt.length; idx++) {
				tgt[idx] = Math.floor(Math.random() * 256);
			}
		}
	}

}