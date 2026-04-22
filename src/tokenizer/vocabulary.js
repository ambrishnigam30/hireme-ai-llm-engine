"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vocabulary = exports.SEP_ID = exports.EOS_ID = exports.BOS_ID = exports.UNK_ID = exports.PAD_ID = exports.SPECIAL_TOKENS = void 0;
/**
 * vocabulary.ts
 * Manages the token-to-ID and ID-to-token mappings, including special tokens.
 */
var fs = require("fs");
exports.SPECIAL_TOKENS = {
    PAD: '[PAD]',
    UNK: '[UNK]',
    BOS: '[BOS]',
    EOS: '[EOS]',
    SEP: '[SEP]',
};
exports.PAD_ID = 0;
exports.UNK_ID = 1;
exports.BOS_ID = 2;
exports.EOS_ID = 3;
exports.SEP_ID = 4;
var Vocabulary = /** @class */ (function () {
    function Vocabulary() {
        this.tokenToId = new Map();
        this.idToToken = new Map();
        this.nextId = 0;
        // Initialize special tokens
        this.addToken(exports.SPECIAL_TOKENS.PAD); // 0
        this.addToken(exports.SPECIAL_TOKENS.UNK); // 1
        this.addToken(exports.SPECIAL_TOKENS.BOS); // 2
        this.addToken(exports.SPECIAL_TOKENS.EOS); // 3
        this.addToken(exports.SPECIAL_TOKENS.SEP); // 4
    }
    /**
     * Adds a token to the vocabulary if it doesn't exist.
     * @param token The string token to add.
     * @returns The integer ID assigned to the token.
     */
    Vocabulary.prototype.addToken = function (token) {
        if (this.tokenToId.has(token)) {
            return this.tokenToId.get(token);
        }
        var id = this.nextId++;
        this.tokenToId.set(token, id);
        this.idToToken.set(id, token);
        return id;
    };
    /**
     * Retrieves the string token for a given integer ID.
     * @param id The token ID.
     * @returns The string token or undefined if not found.
     */
    Vocabulary.prototype.getToken = function (id) {
        return this.idToToken.get(id);
    };
    /**
     * Retrieves the integer ID for a given string token.
     * @param token The string token.
     * @returns The token ID or undefined if not found.
     */
    Vocabulary.prototype.getId = function (token) {
        return this.tokenToId.get(token);
    };
    /**
     * Returns the total number of tokens in the vocabulary.
     */
    Vocabulary.prototype.size = function () {
        return this.tokenToId.size;
    };
    /**
     * Serializes the vocabulary to a JSON file.
     * @param path The file path to save to.
     */
    Vocabulary.prototype.save = function (path) {
        var data = JSON.stringify(Object.fromEntries(this.tokenToId), null, 2);
        fs.writeFileSync(path, data, 'utf-8');
    };
    /**
     * Loads the vocabulary from a JSON file.
     * @param path The file path to load from.
     */
    Vocabulary.prototype.load = function (path) {
        var data = fs.readFileSync(path, 'utf-8');
        var parsed = JSON.parse(data);
        this.tokenToId.clear();
        this.idToToken.clear();
        this.nextId = 0;
        var entries = Object.entries(parsed).sort(function (a, b) { return a[1] - b[1]; });
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var _a = entries_1[_i], token = _a[0], id = _a[1];
            this.tokenToId.set(token, id);
            this.idToToken.set(id, token);
            this.nextId = Math.max(this.nextId, id + 1);
        }
    };
    return Vocabulary;
}());
exports.Vocabulary = Vocabulary;
