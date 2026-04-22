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
exports.LLM = exports.MODEL_CONFIG = void 0;
/**
 * llm.ts
 * Complete LLM Model combining embedding, transformer blocks, and LM head.
 */
var framework_1 = require("@mni-ml/framework");
var embedding_1 = require("./embedding");
var transformer_1 = require("./transformer");
exports.MODEL_CONFIG = {
    vocabSize: 8000,
    dModel: 256,
    nHeads: 8,
    nLayers: 6,
    dFF: 1024,
    maxSeqLen: 512,
    dropout: 0.1,
    padTokenId: 0
};
var LLM = /** @class */ (function (_super) {
    __extends(LLM, _super);
    function LLM(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        _this.embedding = new embedding_1.Embedding(config.vocabSize, config.dModel, config.maxSeqLen);
        _this.registerModule('embedding', _this.embedding);
        _this.blocks = [];
        for (var i = 0; i < config.nLayers; i++) {
            var block = new transformer_1.TransformerBlock(config.dModel, config.nHeads, config.dFF);
            _this.blocks.push(block);
            _this.registerModule("block_".concat(i), block);
        }
        _this.finalLn = new transformer_1.LayerNorm(config.dModel);
        _this.registerModule('finalLn', _this.finalLn);
        _this.lmHead = new framework_1.Linear(config.dModel, config.vocabSize);
        _this.registerModule('lmHead', _this.lmHead);
        return _this;
    }
    LLM.prototype.countParameters = function () {
        var count = 0;
        var params = this.parameters();
        for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
            var p = params_1[_i];
            var size = 1;
            for (var _a = 0, _b = p.tensor.shape; _a < _b.length; _a++) {
                var dim = _b[_a];
                size *= dim;
            }
            count += size;
        }
        return count;
    };
    LLM.prototype.generateCausalMask = function (batchSize, seqLen, nHeads) {
        var totalSize = batchSize * nHeads * seqLen * seqLen;
        var maskData = new Float32Array(totalSize);
        for (var b = 0; b < batchSize; b++) {
            for (var h = 0; h < nHeads; h++) {
                for (var i = 0; i < seqLen; i++) {
                    for (var j = 0; j < seqLen; j++) {
                        var idx = b * (nHeads * seqLen * seqLen) + h * (seqLen * seqLen) + i * seqLen + j;
                        if (j > i) {
                            maskData[idx] = -1e9;
                        }
                        else {
                            maskData[idx] = 0.0;
                        }
                    }
                }
            }
        }
        return framework_1.Tensor.fromFloat32(maskData, [batchSize, nHeads, seqLen, seqLen]);
    };
    LLM.prototype.forward = function (tokenIds) {
        var batchSize = tokenIds.shape[0];
        var seqLen = tokenIds.shape[1];
        var x = this.embedding.forward(tokenIds);
        var mask = this.generateCausalMask(batchSize, seqLen, this.config.nHeads);
        for (var _i = 0, _a = this.blocks; _i < _a.length; _i++) {
            var block = _a[_i];
            x = block.forward(x, mask);
        }
        x = this.finalLn.forward(x);
        var logits = this.lmHead.forward(x);
        return logits;
    };
    LLM.prototype.save = function (path) {
        console.log("Saving LLM to ".concat(path));
    };
    LLM.prototype.load = function (path) {
        console.log("Loading LLM from ".concat(path));
    };
    return LLM;
}(framework_1.Module));
exports.LLM = LLM;
