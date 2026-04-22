"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BPE = void 0;
var BPE = /** @class */ (function () {
    function BPE() {
        this.merges = new Map();
    }
    /**
     * Returns the learned merge rules.
     */
    BPE.prototype.getMerges = function () {
        return this.merges;
    };
    /**
     * Trains the BPE tokenizer on a given corpus.
     * @param corpus Array of text strings.
     * @param targetVocabSize The desired final vocabulary size.
     * @param vocab The Vocabulary instance to populate.
     */
    BPE.prototype.train = function (corpus, targetVocabSize, vocab) {
        // 1. Initialize character vocabulary and base words
        var words = [];
        for (var _i = 0, corpus_1 = corpus; _i < corpus_1.length; _i++) {
            var text = corpus_1[_i];
            var chars = Array.from(text);
            for (var _a = 0, chars_1 = chars; _a < chars_1.length; _a++) {
                var char = chars_1[_a];
                vocab.addToken(char);
            }
            words.push(chars);
        }
        // 2. Iteratively merge the most frequent pair
        while (vocab.size() < targetVocabSize) {
            var pairCounts = new Map();
            // Count pairs
            for (var _b = 0, words_1 = words; _b < words_1.length; _b++) {
                var word = words_1[_b];
                for (var i = 0; i < word.length - 1; i++) {
                    var pair = "".concat(word[i], "|").concat(word[i + 1]);
                    pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
                }
            }
            if (pairCounts.size === 0) {
                break; // No more pairs to merge
            }
            // Find most frequent pair
            var bestPair = '';
            var maxCount = -1;
            for (var _c = 0, _d = pairCounts.entries(); _c < _d.length; _c++) {
                var _e = _d[_c], pair = _e[0], count = _e[1];
                if (count > maxCount) {
                    maxCount = count;
                    bestPair = pair;
                }
            }
            var _f = bestPair.split('|'), first = _f[0], second = _f[1];
            var mergedToken = first + second;
            var newId = vocab.addToken(mergedToken);
            this.merges.set(bestPair, newId);
            // Apply merge to all words
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                var newWord = [];
                var j = 0;
                while (j < word.length) {
                    if (j < word.length - 1 && word[j] === first && word[j + 1] === second) {
                        newWord.push(mergedToken);
                        j += 2;
                    }
                    else {
                        newWord.push(word[j]);
                        j += 1;
                    }
                }
                words[i] = newWord;
            }
        }
    };
    return BPE;
}());
exports.BPE = BPE;
