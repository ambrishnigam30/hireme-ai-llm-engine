"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KVCache = void 0;
var KVCache = /** @class */ (function () {
    function KVCache() {
        this.cache = new Map();
        this.seqLen = 0;
    }
    KVCache.prototype.update = function (layer, newK, newV) {
        if (!this.cache.has(layer)) {
            this.cache.set(layer, { k: newK, v: newV });
            if (layer === 0)
                this.seqLen = newK.shape[1]; // batch, seq, heads, dim
            return { k: newK, v: newV };
        }
        var cached = this.cache.get(layer);
        var kResult;
        var vResult;
        if (typeof cached.k.cat === 'function') {
            kResult = cached.k.cat([newK], 1);
            vResult = cached.v.cat([newV], 1);
        }
        else {
            kResult = newK;
            vResult = newV;
        }
        this.cache.set(layer, { k: kResult, v: vResult });
        if (layer === 0)
            this.seqLen += newK.shape[1];
        return { k: kResult, v: vResult };
    };
    KVCache.prototype.size = function () {
        return this.seqLen;
    };
    KVCache.prototype.clear = function () {
        for (var _i = 0, _a = this.cache; _i < _a.length; _i++) {
            var _b = _a[_i], _ = _b[0], cached = _b[1];
            if (typeof cached.k.dispose === 'function')
                cached.k.dispose();
            if (typeof cached.v.dispose === 'function')
                cached.v.dispose();
        }
        this.cache.clear();
        this.seqLen = 0;
    };
    return KVCache;
}());
exports.KVCache = KVCache;
