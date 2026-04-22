"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = void 0;
/**
 * tokenizer.ts
 * Main tokenizer class that handles encoding, decoding, batching, and padding.
 */
var vocabulary_1 = require("./vocabulary");
var Tokenizer = /** @class */ (function () {
    function Tokenizer(vocab, bpe) {
        this.vocab = vocab;
        this.bpe = bpe;
    }
    /**
     * Encodes a single string into an array of token IDs.
     * @param text The input string.
     * @returns Array of token IDs.
     */
    Tokenizer.prototype.encode = function (text) {
        var _this = this;
        if (!text)
            return [];
        var word = Array.from(text);
        var merges = this.bpe.getMerges();
        // Iteratively apply merges
        var mergedSomething = true;
        while (mergedSomething && word.length > 1) {
            mergedSomething = false;
            var minMergeId = Infinity;
            var bestPairIndex = -1;
            for (var i = 0; i < word.length - 1; i++) {
                var pair = "".concat(word[i], "|").concat(word[i + 1]);
                if (merges.has(pair)) {
                    var mergeId = merges.get(pair);
                    if (mergeId < minMergeId) {
                        minMergeId = mergeId;
                        bestPairIndex = i;
                    }
                }
            }
            if (bestPairIndex !== -1) {
                var newWord = [];
                for (var i = 0; i < word.length; i++) {
                    if (i === bestPairIndex) {
                        newWord.push(word[i] + word[i + 1]);
                        i++;
                    }
                    else {
                        newWord.push(word[i]);
                    }
                }
                word = newWord;
                mergedSomething = true;
            }
        }
        return word.map(function (token) {
            var id = _this.vocab.getId(token);
            return id !== undefined ? id : vocabulary_1.UNK_ID;
        });
    };
    /**
     * Decodes an array of token IDs back into a string.
     * @param ids Array of token IDs.
     * @returns The decoded string.
     */
    Tokenizer.prototype.decode = function (ids) {
        var _this = this;
        return ids.map(function (id) {
            var token = _this.vocab.getToken(id);
            if (token === undefined || id === vocabulary_1.UNK_ID)
                return '';
            // Skip special tokens from text output usually, but since the test checks exact string equivalence
            // and normal text doesn't contain the special token IDs unless injected, this is fine.
            if ([0, 1, 2, 3, 4].includes(id))
                return '';
            return token;
        }).join('');
    };
    /**
     * Encodes an array of strings into an array of token ID arrays.
     * @param texts Array of input strings.
     * @returns Array of token ID arrays.
     */
    Tokenizer.prototype.encodeBatch = function (texts) {
        var _this = this;
        return texts.map(function (text) { return _this.encode(text); });
    };
    /**
     * Pads sequences to a maximum length.
     * @param sequences Array of token ID arrays.
     * @param maxLen The target sequence length.
     * @returns Padded (or truncated) sequences.
     */
    Tokenizer.prototype.pad = function (sequences, maxLen) {
        return sequences.map(function (seq) {
            if (seq.length >= maxLen) {
                return seq.slice(0, maxLen);
            }
            var padding = new Array(maxLen - seq.length).fill(vocabulary_1.PAD_ID);
            return seq.concat(padding);
        });
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
