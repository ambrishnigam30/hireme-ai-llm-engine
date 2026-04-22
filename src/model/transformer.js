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
exports.TransformerBlock = exports.LayerNorm = void 0;
/**
 * transformer.ts
 * A single Decoder-only Transformer Block.
 */
var framework_1 = require("@mni-ml/framework");
var attention_1 = require("./attention");
var feedforward_1 = require("./feedforward");
var LayerNorm = /** @class */ (function (_super) {
    __extends(LayerNorm, _super);
    function LayerNorm(normalizedShape, eps) {
        if (eps === void 0) { eps = 1e-5; }
        var _this = _super.call(this) || this;
        _this.eps = eps;
        _this.gamma = new framework_1.Parameter(framework_1.Tensor.ones([normalizedShape]));
        _this.beta = new framework_1.Parameter(framework_1.Tensor.zeros([normalizedShape]));
        _this.registerParameter('gamma', _this.gamma);
        _this.registerParameter('beta', _this.beta);
        return _this;
    }
    LayerNorm.prototype.forward = function (x) {
        return (0, framework_1.layerNorm)(x, this.gamma.tensor, this.beta.tensor, this.eps);
    };
    return LayerNorm;
}(framework_1.Module));
exports.LayerNorm = LayerNorm;
var TransformerBlock = /** @class */ (function (_super) {
    __extends(TransformerBlock, _super);
    function TransformerBlock(dModel, nHeads, dFF) {
        var _this = _super.call(this) || this;
        _this.attention = new attention_1.MultiHeadAttention(dModel, nHeads);
        _this.ff = new feedforward_1.FeedForward(dModel, dFF);
        _this.ln1 = new LayerNorm(dModel);
        _this.ln2 = new LayerNorm(dModel);
        _this.registerModule('attention', _this.attention);
        _this.registerModule('ff', _this.ff);
        _this.registerModule('ln1', _this.ln1);
        _this.registerModule('ln2', _this.ln2);
        return _this;
    }
    TransformerBlock.prototype.forward = function (x, mask) {
        var normed1 = this.ln1.forward(x);
        var attnOut = this.attention.forward(normed1, mask);
        x = x.add(attnOut);
        var normed2 = this.ln2.forward(x);
        var ffOut = this.ff.forward(normed2);
        x = x.add(ffOut);
        return x;
    };
    return TransformerBlock;
}(framework_1.Module));
exports.TransformerBlock = TransformerBlock;
