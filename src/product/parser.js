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
exports.Parser = void 0;
var Parser = /** @class */ (function () {
    function Parser() {
    }
    Parser.parseJobDescription = function (text) {
        var lines = text.split('\n');
        var title = lines.length > 0 ? lines[0].trim() : 'Unknown Role';
        // Extract capitalized words as potential skills for our simple heuristic
        var skills = __spreadArray([], new Set(text.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || []), true).filter(function (w) { return w.length > 2; });
        return { title: title, skills: skills };
    };
    Parser.parseResume = function (text) {
        var skills = __spreadArray([], new Set(text.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || []), true).filter(function (w) { return w.length > 2; });
        return { rawText: text, skills: skills };
    };
    Parser.buildPrompt = function (jd, resume) {
        return "[BOS] JOB: ".concat(jd.title, " required skills: ").concat(jd.skills.join(', '), ". [SEP] RESUME: ").concat(resume.rawText, " [SEP]");
    };
    return Parser;
}());
exports.Parser = Parser;
