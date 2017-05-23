namespace Util {

	// FIXME this is not good for unicode... just assumes everything is 127 or less...
	export function encodeUTF8(src : string) : Uint8Array {
		var answer = new Uint8Array(src.length)
		for(var idx = 0; idx < answer.length; idx++) {
			answer[idx] = src.charCodeAt(idx) & 0xFF;
		}
		return answer
	}

	export function b64Array(src: Uint8Array) : string {
		return btoa(String.fromCharCode.apply(null, src))
	}
	
	export function decodeUTF8(src : Uint8Array) : string {
		return 'not implemented'
	}

}