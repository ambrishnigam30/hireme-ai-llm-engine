"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Embedding = void 0;
/**
 * embedding.ts
 */
var framework_1 = require("@mni-ml/framework");
var Embedding = /** @class */ (function (_super) {
    __extends(Embedding, _super);
    function Embedding(vocabSize, dModel, maxSeqLen) {
        var _this = _super.call(this) || this;
        _this.dModel = dModel;
        _this.maxSeqLen = maxSeqLen;
        _this.tokenEmbedding = new framework_1.Embedding(vocabSize, dModel);
        _this.registerModule('tokenEmbedding', _this.tokenEmbedding);
        return _this;
    }
    Embedding.prototype.forward = function (tokenIds) {
        var batchSize = tokenIds.shape[0];
        var seqLen = tokenIds.shape[1];
        if (seqLen > this.maxSeqLen) {
            throw new Error("Sequence length ".concat(seqLen, " exceeds maxSeqLen ").concat(this.maxSeqLen));
        }
        var tokEmb = this.tokenEmbedding.forward(tokenIds);
        var pe = new Float32Array(batchSize * seqLen * this.dModel);
        for (var b = 0; b < batchSize; b++) {
            for (var pos = 0; pos < seqLen; pos++) {
                for (var i = 0; i < this.dModel; i += 2) {
                    var divTerm = Math.exp((i * -Math.log(10000.0)) / this.dModel);
                    var posOffset = b * (seqLen * this.dModel) + pos * this.dModel + i;
                    pe[posOffset] = Math.sin(pos * divTerm);
                    if (i + 1 < this.dModel) {
                        pe[posOffset + 1] = Math.cos(pos * divTerm);
                    }
                }
            }
        }
        var posEmb = framework_1.Tensor.fromFloat32(pe, [batchSize, seqLen, this.dModel]);
        return tokEmb.add(posEmb);
    };
    return Embedding;
}(framework_1.Module));
exports.Embedding = Embedding;
