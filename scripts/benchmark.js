"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
/**
 * scripts/benchmark.ts
 */
var generator_1 = require("../src/inference/generator");
var optimizer_1 = require("../src/product/optimizer");
var llm_1 = require("../src/model/llm");
var parser_1 = require("../src/product/parser");
// Helper to extract skills and check for hallucinations
function findInventedSkills(originalResume, generatedText) {
    var originalSkillsLower = new Set(originalResume.skills.map(function (s) { return s.toLowerCase(); }));
    // Basic extraction of skills from generated text
    var generatedSkills = __spreadArray([], new Set(generatedText.match(/\b[A-Z][a-zA-Z0-9#\+]*\b/g) || []), true).filter(function (w) { return w.length > 2; })
        .map(function (s) { return s.toLowerCase(); });
    var invented = [];
    for (var _i = 0, generatedSkills_1 = generatedSkills; _i < generatedSkills_1.length; _i++) {
        var skill = generatedSkills_1[_i];
        if (!originalSkillsLower.has(skill) && skill !== 'JOB' && skill !== 'RESUME' && skill !== 'BOS' && skill !== 'SEP' && skill !== 'EOS') {
            // Basic filter to ignore common non-skill capitalized words in sentences
            var commonWords = ['the', 'and', 'with', 'proven', 'architected', 'delivered', 'senior'];
            if (!commonWords.includes(skill)) {
                invented.push(skill);
            }
        }
    }
    return invented;
}
function runBenchmark() {
    return __awaiter(this, void 0, void 0, function () {
        var jdText, resumeText, sampleJD, sampleResume, tokenizer, model, generator, startTime, optimizedResume, duration, tokenCount, tps, rawScore, optimizedResumeParsed, optimizedScore, lift, newSkills;
        return __generator(this, function (_a) {
            console.log("🚀 Starting HireMe.ai Benchmark Suite...\n");
            jdText = "Looking for a Senior Backend Developer with expertise in Node, TypeScript, Docker, and AWS.";
            resumeText = "I am a dev. I know Node and JS.";
            sampleJD = parser_1.Parser.parseJobDescription(jdText);
            sampleResume = parser_1.Parser.parseResume(resumeText);
            tokenizer = {
                encode: function (text) { return Array(Math.floor(text.length / 4)).fill(1); },
                decode: function (ids) { return ids.map(function () { return 'word'; }).join(' '); }
            };
            model = new llm_1.LLM(llm_1.MODEL_CONFIG);
            generator = new generator_1.Generator(model, tokenizer);
            startTime = performance.now();
            optimizedResume = optimizer_1.Optimizer.optimizeResume(sampleJD, sampleResume, generator);
            duration = (performance.now() - startTime) / 1000;
            tokenCount = tokenizer.encode(optimizedResume).length;
            tps = duration > 0 ? (tokenCount / duration) : 0;
            console.log("\u23F1 Speed: ".concat(tps.toFixed(2), " tokens/sec"));
            console.log("\u23F1 Duration: ".concat(duration.toFixed(3), " seconds"));
            console.log("\uD83D\uDCDD Generated Length: ".concat(tokenCount, " tokens\n"));
            rawScore = optimizer_1.Optimizer.scoreATS(sampleJD, sampleResume);
            optimizedResumeParsed = parser_1.Parser.parseResume(optimizedResume);
            optimizedScore = optimizer_1.Optimizer.scoreATS(sampleJD, optimizedResumeParsed);
            console.log("\uD83D\uDCC8 Raw ATS Score: ".concat(rawScore, "%"));
            console.log("\uD83D\uDCC8 Optimized ATS Score: ".concat(optimizedScore, "%"));
            lift = optimizedScore - rawScore;
            console.log("\uD83D\uDCC8 ATS Lift: ".concat(lift >= 0 ? '+' : '').concat(lift.toFixed(2), "% Improvement\n"));
            newSkills = findInventedSkills(sampleResume, optimizedResume);
            console.log("\u26A0\uFE0F Hallucination Count: ".concat(newSkills.length, " invented skills/capitalized words found."));
            if (newSkills.length > 0) {
                console.log("   Invented: [".concat(newSkills.join(', '), "]"));
            }
            return [2 /*return*/];
        });
    });
}
runBenchmark().catch(console.error);
