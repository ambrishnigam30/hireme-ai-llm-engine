"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Optimizer = void 0;
/**
 * optimizer.ts
 */
var parser_1 = require("./parser");
var Optimizer = /** @class */ (function () {
    function Optimizer() {
    }
    Optimizer.scoreATS = function (jd, resume) {
        if (jd.skills.length === 0)
            return 0;
        var jdSkills = new Set(jd.skills.map(function (s) { return s.toLowerCase(); }));
        var resumeSkills = new Set(resume.skills.map(function (s) { return s.toLowerCase(); }));
        var matches = 0;
        for (var _i = 0, jdSkills_1 = jdSkills; _i < jdSkills_1.length; _i++) {
            var skill = jdSkills_1[_i];
            if (resumeSkills.has(skill))
                matches++;
        }
        return Math.round((matches / jdSkills.size) * 100);
    };
    Optimizer.optimizeResume = function (jd, resume, generator) {
        var prompt = parser_1.Parser.buildPrompt(jd, resume);
        var config = {
            maxNewTokens: 256,
            temperature: 0.7,
            topK: 40
        };
        var output = generator.generate(prompt, config);
        return output;
    };
    return Optimizer;
}());
exports.Optimizer = Optimizer;
