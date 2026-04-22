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
exports.FeedForward = void 0;
/**
 * feedforward.ts
 * Position-wise FeedForward Network.
 */
var framework_1 = require("@mni-ml/framework");
var FeedForward = /** @class */ (function (_super) {
    __extends(FeedForward, _super);
    function FeedForward(dModel, dFF) {
        var _this = _super.call(this) || this;
        _this.linear1 = new framework_1.Linear(dModel, dFF);
        _this.linear2 = new framework_1.Linear(dFF, dModel);
        _this.registerModule('linear1', _this.linear1);
        _this.registerModule('linear2', _this.linear2);
        return _this;
    }
    FeedForward.prototype.forward = function (x) {
        var out = this.linear1.forward(x);
        out = out.relu();
        out = this.linear2.forward(out);
        return out;
    };
    return FeedForward;
}(framework_1.Module));
exports.FeedForward = FeedForward;
