/**
 * Tests for Project Finder Quiz module
 */

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

/**
 * Bootstrap a JSDOM environment with quiz panel DOM elements
 * and evaluate docs/app.js within it.
 *
 * @returns {JSDOM} Configured JSDOM instance with app.js globals.
 */
function loadApp() {
    var dom = new JSDOM(
        '<!DOCTYPE html><html><body>' +
        '<div id="projects-container"></div>' +
        '<input id="project-search">' +
        '<div id="category-filters"></div>' +
        '<div id="active-tag-indicator" class="active-tag-indicator hidden"></div>' +
        '<div id="no-results" class="hidden"></div>' +
        '<button id="analytics-toggle" aria-expanded="false" aria-controls="analytics-panel"></button>' +
        '<div id="analytics-panel" role="region"></div>' +
        '<div id="spotlight-container"></div>' +
        '<button id="techradar-toggle" aria-expanded="false" aria-controls="techradar-panel"></button>' +
        '<div id="techradar-panel" role="region"></div>' +
        '<button id="quiz-toggle"></button>' +
        '<div id="quiz-panel" class="quiz-panel"></div>' +
        '</body></html>',
        { runScripts: "dangerously", resources: "usable" }
    );
    var code = fs.readFileSync(path.join(__dirname, "..", "docs", "app.js"), "utf-8");
    dom.window.eval(code);
    return dom;
}

var dom, win;

beforeAll(function() {
    dom = loadApp();
    win = dom.window;
});

afterAll(function() {
    dom.window.close();
});

describe("Project Finder Quiz", function() {

    afterEach(function() {
        win.resetQuiz();
    });

    describe("QUIZ_QUESTIONS", function() {
        test("should have 3 questions", function() {
            expect(win.QUIZ_QUESTIONS.length).toBe(3);
        });

        test("each question has id, text, and options", function() {
            win.QUIZ_QUESTIONS.forEach(function(q) {
                expect(q.id).toBeTruthy();
                expect(q.text).toBeTruthy();
                expect(q.options.length).toBeGreaterThanOrEqual(3);
            });
        });

        test("each option has label and value", function() {
            win.QUIZ_QUESTIONS.forEach(function(q) {
                q.options.forEach(function(o) {
                    expect(o.label).toBeTruthy();
                    expect(o.value).toBeTruthy();
                });
            });
        });

        test("question ids are unique", function() {
            var ids = win.QUIZ_QUESTIONS.map(function(q) { return q.id; });
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

    describe("_quizState", function() {
        test("starts inactive", function() {
            expect(win._quizState.active).toBe(false);
            expect(win._quizState.step).toBe(0);
            expect(win._quizState.answers.length).toBe(0);
        });
    });

    describe("startQuiz", function() {
        test("sets state to active", function() {
            win.startQuiz();
            expect(win._quizState.active).toBe(true);
            expect(win._quizState.step).toBe(0);
        });

        test("renders quiz panel", function() {
            win.startQuiz();
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toContain("quiz-question");
            expect(panel.innerHTML).toContain("quiz-option");
        });

        test("shows first question text", function() {
            win.startQuiz();
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toContain(win.QUIZ_QUESTIONS[0].text);
        });

        test("shows correct number of options", function() {
            win.startQuiz();
            var buttons = win.document.querySelectorAll(".quiz-option");
            expect(buttons.length).toBe(win.QUIZ_QUESTIONS[0].options.length);
        });

        test("shows progress counter", function() {
            win.startQuiz();
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toContain("Question 1/3");
        });

        test("shows progress bar", function() {
            win.startQuiz();
            var bar = win.document.querySelector(".quiz-progress-bar");
            expect(bar).not.toBeNull();
        });

        test("shows close button", function() {
            win.startQuiz();
            var close = win.document.querySelector(".quiz-close");
            expect(close).not.toBeNull();
        });
    });

    describe("answerQuiz", function() {
        test("advances to next question", function() {
            win.startQuiz();
            win.answerQuiz(0, 0);
            expect(win._quizState.step).toBe(1);
            expect(win._quizState.answers.length).toBe(1);
        });

        test("stores selected option", function() {
            win.startQuiz();
            win.answerQuiz(0, 2);
            expect(win._quizState.answers[0].option.value).toBe(
                win.QUIZ_QUESTIONS[0].options[2].value
            );
        });

        test("updates progress counter", function() {
            win.startQuiz();
            win.answerQuiz(0, 0);
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toContain("Question 2/3");
        });

        test("shows results after all questions", function() {
            win.startQuiz();
            for (var i = 0; i < win.QUIZ_QUESTIONS.length; i++) {
                win.answerQuiz(i, 0);
            }
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toContain("quiz-results");
            expect(panel.innerHTML).toContain("Top projects for you");
        });
    });

    describe("results", function() {
        /**
         * Run through the quiz by answering each question programmatically.
         *
         * @param {number[]} choices - Array of answer indices, one per quiz question.
         */
        function runQuiz(choices) {
            win.startQuiz();
            for (var i = 0; i < choices.length; i++) {
                win.answerQuiz(i, choices[i]);
            }
        }

        test("shows top 3 projects", function() {
            runQuiz([0, 0, 0]);
            var cards = win.document.querySelectorAll(".quiz-result-card");
            expect(cards.length).toBe(3);
        });

        test("shows medal emojis", function() {
            runQuiz([0, 0, 0]);
            var ranks = win.document.querySelectorAll(".quiz-result-rank");
            expect(ranks[0].textContent).toContain("🥇");
            expect(ranks[1].textContent).toContain("🥈");
            expect(ranks[2].textContent).toContain("🥉");
        });

        test("shows project links", function() {
            runQuiz([0, 0, 0]);
            var links = win.document.querySelectorAll(".quiz-link");
            expect(links.length).toBeGreaterThan(0);
        });

        test("shows try again and close buttons", function() {
            runQuiz([0, 0, 0]);
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toContain("Try Again");
            expect(panel.innerHTML).toContain("Close");
        });

        test("shows match percentage", function() {
            runQuiz([0, 0, 0]);
            var matches = win.document.querySelectorAll(".quiz-result-match");
            expect(matches.length).toBe(3);
            matches.forEach(function(m) {
                expect(m.textContent).toMatch(/Match: \d+%/);
            });
        });

        test("shows project tags", function() {
            runQuiz([0, 0, 0]);
            var tags = win.document.querySelectorAll(".quiz-tag");
            expect(tags.length).toBeGreaterThan(0);
        });

        test("AI selection ranks AI projects high", function() {
            runQuiz([0, 0, 0]); // AI, Python, Learn
            var cards = win.document.querySelectorAll(".quiz-result-card");
            var hasAI = false;
            for (var i = 0; i < cards.length; i++) {
                var t = cards[i].textContent;
                if (t.indexOf("AgentLens") !== -1 || t.indexOf("Safety") !== -1 ||
                    t.indexOf("AgentBox") !== -1 || t.indexOf("AgenticChat") !== -1) {
                    hasAI = true;
                }
            }
            expect(hasAI).toBe(true);
        });

        test("security selection ranks WinSentinel high", function() {
            runQuiz([1, 2, 3]); // Security, Systems, Solve
            var cards = win.document.querySelectorAll(".quiz-result-card");
            var hasSec = false;
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].textContent.indexOf("WinSentinel") !== -1) hasSec = true;
            }
            expect(hasSec).toBe(true);
        });

        test("language selection ranks sauravcode high", function() {
            runQuiz([2, 3, 0]); // Languages, Research, Learn
            var cards = win.document.querySelectorAll(".quiz-result-card");
            var hasLang = false;
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].textContent.indexOf("sauravcode") !== -1) hasLang = true;
            }
            expect(hasLang).toBe(true);
        });

        test("different answers produce different results", function() {
            runQuiz([0, 0, 0]); // AI path
            var aiResults = [];
            win.document.querySelectorAll(".quiz-result-title").forEach(function(el) {
                aiResults.push(el.textContent);
            });

            win.resetQuiz();
            runQuiz([1, 2, 3]); // Security path
            var secResults = [];
            win.document.querySelectorAll(".quiz-result-title").forEach(function(el) {
                secResults.push(el.textContent);
            });

            // Results should differ (at least first result)
            expect(aiResults[0]).not.toBe(secResults[0]);
        });
    });

    describe("resetQuiz", function() {
        test("resets state", function() {
            win.startQuiz();
            win.answerQuiz(0, 0);
            win.resetQuiz();
            expect(win._quizState.active).toBe(false);
            expect(win._quizState.step).toBe(0);
            expect(win._quizState.answers.length).toBe(0);
        });

        test("clears panel content", function() {
            win.startQuiz();
            win.resetQuiz();
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.innerHTML).toBe("");
        });

        test("hides panel", function() {
            win.startQuiz();
            win.resetQuiz();
            var panel = win.document.getElementById("quiz-panel");
            expect(panel.style.display).toBe("none");
        });
    });

    describe("toggleQuiz", function() {
        test("starts quiz when inactive", function() {
            win.toggleQuiz();
            expect(win._quizState.active).toBe(true);
        });

        test("resets quiz when active", function() {
            win.startQuiz();
            expect(win._quizState.active).toBe(true);
            win.toggleQuiz();
            expect(win._quizState.active).toBe(false);
        });
    });

    describe("initQuiz", function() {
        test("quiz toggle button is wired after init", function() {
            // initQuiz already ran during DOMContentLoaded eval
            // Verify the button is responsive
            win.resetQuiz();
            var btn = win.document.getElementById("quiz-toggle");
            btn.click();
            expect(win._quizState.active).toBe(true);
        });
    });
});
