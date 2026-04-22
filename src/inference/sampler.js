"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sampler = void 0;
/**
 * sampler.ts
 */
var Sampler = /** @class */ (function () {
    function Sampler() {
    }
    Sampler.greedy = function (logits) {
        var maxIdx = 0;
        var maxVal = -Infinity;
        for (var i = 0; i < logits.length; i++) {
            if (logits[i] > maxVal) {
                maxVal = logits[i];
                maxIdx = i;
            }
        }
        return maxIdx;
    };
    Sampler.temperature = function (logits, temp) {
        if (temp === 0 || temp === 1.0)
            return __spreadArray([], logits, true);
        return logits.map(function (l) { return l / temp; });
    };
    Sampler.softmax = function (logits) {
        var maxLogit = Math.max.apply(Math, logits);
        var exps = logits.map(function (l) { return Math.exp(l - maxLogit); });
        var sumExps = exps.reduce(function (a, b) { return a + b; }, 0);
        return exps.map(function (e) { return e / sumExps; });
    };
    Sampler.topK = function (probs, k) {
        var indexedProbs = probs.map(function (p, i) { return ({ p: p, i: i }); }).sort(function (a, b) { return b.p - a.p; });
        var topK = indexedProbs.slice(0, k);
        var result = new Array(probs.length).fill(0);
        for (var _i = 0, topK_1 = topK; _i < topK_1.length; _i++) {
            var item = topK_1[_i];
            result[item.i] = item.p;
        }
        return result;
    };
    Sampler.sample = function (probs) {
        var r = Math.random();
        var cumulative = 0.0;
        for (var i = 0; i < probs.length; i++) {
            cumulative += probs[i];
            if (r <= cumulative)
                return i;
        }
        return probs.length - 1;
    };
    return Sampler;
}());
exports.Sampler = Sampler;
