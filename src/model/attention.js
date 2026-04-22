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
exports.MultiHeadAttention = void 0;
/**
 * attention.ts
 * Multi-Head Causal Self-Attention.
 */
var framework_1 = require("@mni-ml/framework");
var MultiHeadAttention = /** @class */ (function (_super) {
    __extends(MultiHeadAttention, _super);
    function MultiHeadAttention(dModel, nHeads) {
        var _this = _super.call(this) || this;
        _this.dModel = dModel;
        _this.nHeads = nHeads;
        _this.dHead = Math.floor(dModel / nHeads);
        if (_this.dHead * nHeads !== dModel) {
            throw new Error("dModel must be divisible by nHeads");
        }
        _this.qProj = new framework_1.Linear(dModel, dModel);
        _this.kProj = new framework_1.Linear(dModel, dModel);
        _this.vProj = new framework_1.Linear(dModel, dModel);
        _this.outProj = new framework_1.Linear(dModel, dModel);
        _this.registerModule('qProj', _this.qProj);
        _this.registerModule('kProj', _this.kProj);
        _this.registerModule('vProj', _this.vProj);
        _this.registerModule('outProj', _this.outProj);
        return _this;
    }
    MultiHeadAttention.prototype.forward = function (x, mask) {
        var batchSize = x.shape[0];
        var seqLen = x.shape[1];
        var Q = this.qProj.forward(x);
        var K = this.kProj.forward(x);
        var V = this.vProj.forward(x);
        Q = Q.view(batchSize, seqLen, this.nHeads, this.dHead).permute(0, 2, 1, 3).contiguous();
        K = K.view(batchSize, seqLen, this.nHeads, this.dHead).permute(0, 2, 1, 3).contiguous();
        V = V.view(batchSize, seqLen, this.nHeads, this.dHead).permute(0, 2, 1, 3).contiguous();
        var K_T = K.permute(0, 1, 3, 2).contiguous();
        var scores = Q.matmul(K_T);
        var scale = 1.0 / Math.sqrt(this.dHead);
        scores = scores.mul(scale);
        if (mask) {
            scores = scores.add(mask);
        }
        var attn = (0, framework_1.softmax)(scores, 3);
        var out = attn.matmul(V);
        out = out.permute(0, 2, 1, 3).contiguous().view(batchSize, seqLen, this.dModel);
        return this.outProj.forward(out);
    };
    return MultiHeadAttention;
}(framework_1.Module));
exports.MultiHeadAttention = MultiHeadAttention;
