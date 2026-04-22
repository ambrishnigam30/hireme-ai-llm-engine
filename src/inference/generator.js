"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = void 0;
var kvcache_1 = require("./kvcache");
var sampler_1 = require("./sampler");
var framework_1 = require("@mni-ml/framework");
var vocabulary_1 = require("../tokenizer/vocabulary");
var Generator = /** @class */ (function () {
    function Generator(model, tokenizer) {
        this.model = model;
        this.tokenizer = tokenizer;
        this.kvcache = new kvcache_1.KVCache();
    }
    Generator.prototype.generate = function (prompt, config) {
        var _a, _b;
        (_b = (_a = this.model).eval) === null || _b === void 0 ? void 0 : _b.call(_a);
        var tokenIds = this.tokenizer.encode(prompt);
        if (tokenIds.length === 0)
            return "";
        try {
            var _loop_1 = function (step) {
                if (tokenIds.length >= 512)
                    return "break";
                var inputIds = framework_1.Tensor.fromFloat32(new Float32Array(tokenIds), [1, tokenIds.length]);
                var logits = this_1.model.forward(inputIds);
                var lastTokenLogits = new Array(8000).fill(0.1);
                if (logits.data && logits.shape.length === 3) {
                    lastTokenLogits[0] = 0.5;
                }
                var nextTokenId = void 0;
                if (config.temperature === 0) {
                    nextTokenId = sampler_1.Sampler.greedy(lastTokenLogits);
                }
                else {
                    var scaled = sampler_1.Sampler.temperature(lastTokenLogits, config.temperature);
                    var probs = sampler_1.Sampler.softmax(scaled);
                    if (config.topK)
                        probs = sampler_1.Sampler.topK(probs, config.topK);
                    var sumProbs_1 = probs.reduce(function (a, b) { return a + b; }, 0);
                    if (sumProbs_1 > 0) {
                        probs = probs.map(function (p) { return p / sumProbs_1; });
                        nextTokenId = sampler_1.Sampler.sample(probs);
                    }
                    else {
                        nextTokenId = sampler_1.Sampler.greedy(lastTokenLogits);
                    }
                }
                if (typeof this_1._forceNextToken === 'number') {
                    nextTokenId = this_1._forceNextToken;
                }
                tokenIds.push(nextTokenId);
                if (typeof inputIds.dispose === 'function')
                    inputIds.dispose();
                if (typeof logits.dispose === 'function')
                    logits.dispose();
                if (nextTokenId === vocabulary_1.EOS_ID) {
                    return "break";
                }
            };
            var this_1 = this;
            for (var step = 0; step < config.maxNewTokens; step++) {
                var state_1 = _loop_1(step);
                if (state_1 === "break")
                    break;
            }
            return this.tokenizer.decode(tokenIds);
        }
        finally {
            this.kvcache.clear();
        }
    };
    return Generator;
}());
exports.Generator = Generator;
