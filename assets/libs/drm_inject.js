// Refactored conversion functions
const fromHexString_dld = hexString => Uint8Array.from(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const toHexString_dld = bytes => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const b64ToHex_dld = b64 => [...atob(b64)].map(c=> c.charCodeAt(0).toString(16).padStart(2,0)).join``

// initData to PSSH
function getPssh_dld(buffer) {
    const bytes = fromHexString_dld(toHexString_dld(new Uint8Array(buffer)).match(/000000..70737368.*/)[0]);
    return window.btoa(String.fromCharCode(...bytes));
}

// Get Clearkey keys
function getClearkey_dld(response) {
    let obj=JSON.parse((new TextDecoder("utf-8")).decode(response))
    obj = obj["keys"].map(o => [o["kid"], o["k"]]);
    obj = obj.map(o => o.map(a => a.replace(/-/g, '+').replace(/_/g, '/')+"=="))
    return obj.map(o => `${b64ToHex_dld(o[0])}:${b64ToHex_dld(o[1])}`).join("\n")
}

// Widevine PSSH extraction from init
const originalGenerateRequest_dld = MediaKeySession.prototype.generateRequest;
MediaKeySession.prototype.generateRequest = function(initDataType, initData) {
    const result = originalGenerateRequest_dld.call(this, initDataType, initData);
    //Get PSSH and pass into content.js
    try {
        document.dispatchEvent(new CustomEvent('pssh_dld', {
            detail: getPssh_dld(initData)
        }));
    } finally {
        return result;
    }
};

//Clearkey Support
const originalUpdate_dld = MediaKeySession.prototype.update;
MediaKeySession.prototype.update = function(response) {
    const result = originalUpdate_dld.call(this, response);
    try {
        document.dispatchEvent(new CustomEvent('clearkey_dld', {
            detail: getClearkey_dld(response)
        }));
    } finally {
        return result;
    }
};
