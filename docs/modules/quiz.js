// ── Project Finder Quiz ──────────────────────────────────────────────

var QUIZ_QUESTIONS = [
    {
        id: "interest",
        text: "What are you most interested in?",
        options: [
            { label: "🤖 AI & Machine Learning", value: "ai", tags: ["AI Agents", "AI Safety", "GPT-4o", "Monte Carlo", "Observability"] },
            { label: "🔒 Security & Safety", value: "security", tags: ["Security", "C#", ".NET 8", "WPF"] },
            { label: "💻 Programming Languages", value: "lang", tags: ["Compiler", "Language Design", "Python", "C"] },
            { label: "📊 Data & Visualization", value: "data", tags: ["Visualization", "Java", "Graph Theory"] },
            { label: "📱 Apps & Tools", value: "apps", tags: ["Flutter", "Swift", "iOS", "SaaS"] }
        ]
    },
    {
        id: "skill",
        text: "What's your technical background?",
        options: [
            { label: "🐍 Python / Backend", value: "python", langs: ["Python", "Node.js"] },
            { label: "🌐 Web / JavaScript", value: "web", langs: ["JavaScript", "HTML/JS", "React"] },
            { label: "⚙️ Systems / C / C# / Java", value: "systems", langs: ["C#", "C", "Java", ".NET 8"] },
            { label: "🧪 Research / Academic", value: "research", langs: ["Python", "OCaml", "Research"] },
            { label: "📱 Mobile / Cross-platform", value: "mobile", langs: ["Swift", "Flutter", "iOS"] }
        ]
    },
    {
        id: "goal",
        text: "What would you use this for?",
        options: [
            { label: "🔬 Learn something new", value: "learn", boost: ["Ocaml-sample-code", "sauravcode", "ai"] },
            { label: "🛠️ Build a project", value: "build", boost: ["prompt", "agentlens", "agenticchat"] },
            { label: "🔍 Explore & experiment", value: "explore", boost: ["VoronoiMap", "GraphVisual", "gif-captcha"] },
            { label: "📋 Solve a real problem", value: "solve", boost: ["WinSentinel", "FeedReader", "everything"] },
            { label: "🎨 See cool demos", value: "demo", boost: ["BioBots", "getagentbox", "Vidly"] }
        ]
    }
];

var _quizState = {
    active: false,
    step: 0,
    answers: []
};

/**
 * Start the interactive project-finder quiz, resetting state.
 */
function startQuiz() {
    _quizState.active = true;
    _quizState.step = 0;
    _quizState.answers = [];
    renderQuizStep();
}

/**
 * Record a quiz answer and advance to the next question or results.
 * @param {number} questionIdx - Index of the current question.
 * @param {number} optionIdx - Index of the selected option.
 */
function answerQuiz(questionIdx, optionIdx) {
    _quizState.answers.push({
        question: QUIZ_QUESTIONS[questionIdx].id,
        option: QUIZ_QUESTIONS[questionIdx].options[optionIdx]
    });
    _quizState.step++;
    if (_quizState.step >= QUIZ_QUESTIONS.length) {
        renderQuizResults();
    } else {
        renderQuizStep();
    }
}

/**
 * Score a project against quiz answers using tag/category matching.
 * @param {Object} project - Project object with tags and category.
 * @param {Array} answers - Array of {question, tags} answer objects.
 * @returns {number} Match score (higher = better fit).
 */
function _scoreProject(project, answers) {
    var score = 0;

    // Use pre-computed _searchIndex tagSet for O(1) tag lookups
    // instead of building a fresh lowercase array per call.
    var projIdx = PROJECTS.indexOf(project);
    var tagSet = (projIdx >= 0 && projIdx < _searchIndex.length)
        ? _searchIndex[projIdx].tagSet : null;

    // Fallback: build a tag set if the project isn't in the index
    if (!tagSet) {
        tagSet = Object.create(null);
        var projTags = project.tags || [];
        for (var ft = 0; ft < projTags.length; ft++) {
            tagSet[projTags[ft].toLowerCase()] = true;
        }
    }

    for (var i = 0; i < answers.length; i++) {
        var ans = answers[i];
        // Tag matching — O(1) per tag via tagSet
        if (ans.option.tags) {
            for (var j = 0; j < ans.option.tags.length; j++) {
                if (tagSet[ans.option.tags[j].toLowerCase()]) {
                    score += 3;
                }
            }
        }
        // Language matching — O(1) per lang via tagSet
        if (ans.option.langs) {
            for (var k = 0; k < ans.option.langs.length; k++) {
                if (tagSet[ans.option.langs[k].toLowerCase()]) {
                    score += 2;
                }
            }
        }
        // Direct boost
        if (ans.option.boost) {
            if (ans.option.boost.indexOf(project.repo) !== -1) {
                score += 4;
            }
        }
        // Category matching
        if (ans.option.value === "ai" && project.category === "AI & Agents") score += 2;
        if (ans.option.value === "security" && project.category === "Security") score += 2;
        if (ans.option.value === "lang" && project.category === "Languages & Tools") score += 2;
        if (ans.option.value === "data" && project.category === "Visualization & Data") score += 2;
        if (ans.option.value === "apps" && project.category === "Apps & More") score += 2;
    }
    return score;
}

/** Render the current quiz question step into the quiz container. */
function renderQuizStep() {
    var panel = typeof document !== "undefined" ? document.getElementById("quiz-panel") : null;
    if (!panel) return;

    var q = QUIZ_QUESTIONS[_quizState.step];
    var progress = (_quizState.step + 1) + "/" + QUIZ_QUESTIONS.length;
    var progressPct = Math.round(((_quizState.step) / QUIZ_QUESTIONS.length) * 100);

    var html = '<div class="quiz-container">';
    html += '<div class="quiz-header">';
    html += '<span class="quiz-progress">Question ' + progress + '</span>';
    html += '<button type="button" class="quiz-close" data-action="reset-quiz" aria-label="Close quiz">&times;</button>';
    html += '</div>';
    html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + progressPct + '%"></div></div>';
    html += '<h3 class="quiz-question">' + escapeHTML(q.text) + '</h3>';
    html += '<div class="quiz-options">';
    for (var i = 0; i < q.options.length; i++) {
        html += '<button type="button" class="quiz-option" data-q="' + _quizState.step + '" data-o="' + i + '">';
        html += escapeHTML(q.options[i].label);
        html += '</button>';
    }
    html += '</div></div>';
    panel.innerHTML = html;
    panel.style.display = "block";

    // Activate modal focus management (#24)
    _activateModal(panel);

    // Wire up option clicks
    var buttons = panel.querySelectorAll(".quiz-option");
    for (var b = 0; b < buttons.length; b++) {
        buttons[b].addEventListener("click", function() {
            var qi = parseInt(this.dataset.q, 10);
            var oi = parseInt(this.dataset.o, 10);
            answerQuiz(qi, oi);
        });
    }
}

/** Render quiz results — rank projects by match score and display top picks. */
function renderQuizResults() {
    var panel = typeof document !== "undefined" ? document.getElementById("quiz-panel") : null;
    if (!panel) return;

    // Score all projects
    var scored = [];
    for (var i = 0; i < PROJECTS.length; i++) {
        var s = _scoreProject(PROJECTS[i], _quizState.answers);
        scored.push({ project: PROJECTS[i], score: s });
    }

    // Sort by score descending
    scored.sort(function(a, b) { return b.score - a.score; });

    // Take top 3
    var top = scored.slice(0, 3);

    var html = '<div class="quiz-container quiz-results">';
    html += '<div class="quiz-header">';
    html += '<span class="quiz-progress">Your Matches</span>';
    html += '<button type="button" class="quiz-close" data-action="reset-quiz" aria-label="Close quiz">&times;</button>';
    html += '</div>';
    html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:100%"></div></div>';
    html += '<h3 class="quiz-question">🎯 Top projects for you</h3>';
    html += '<div class="quiz-results-list">';

    var medals = ["🥇", "🥈", "🥉"];
    for (var r = 0; r < top.length; r++) {
        var p = top[r].project;
        var matchPct = Math.min(100, Math.round((top[r].score / 15) * 100));
        html += '<div class="quiz-result-card">';
        html += '<div class="quiz-result-rank">' + medals[r] + '</div>';
        html += '<div class="quiz-result-info">';
        html += '<div class="quiz-result-title">' + escapeHTML(p.icon + " " + p.title) + '</div>';
        html += '<div class="quiz-result-desc">' + escapeHTML(p.desc.substring(0, 120)) + (p.desc.length > 120 ? "…" : "") + '</div>';
        html += '<div class="quiz-result-match">Match: ' + matchPct + '%</div>';
        html += '<div class="quiz-result-tags">';
        for (var t = 0; t < Math.min(p.tags.length, 4); t++) {
            html += '<span class="quiz-tag">' + escapeHTML(p.tags[t]) + '</span>';
        }
        html += '</div>';
        if (p.links && p.links.length > 0) {
            html += '<div class="quiz-result-links">';
            for (var l = 0; l < p.links.length; l++) {
                html += '<a href="' + sanitizeURL(p.links[l].url) + '" target="_blank" rel="noopener noreferrer" class="quiz-link">' + escapeHTML(p.links[l].label) + '</a>';
            }
            html += '</div>';
        }
        html += '</div></div>';
    }

    html += '</div>';
    html += '<div class="quiz-actions">';
    html += '<button type="button" class="quiz-retry" data-action="start-quiz">🔄 Try Again</button>';
    html += '<button type="button" class="quiz-close-btn" data-action="reset-quiz">Close</button>';
    html += '</div>';
    html += '</div>';
    panel.innerHTML = html;

    // Re-activate modal focus on results view (#24)
    _activateModal(panel);
}

/** Reset quiz state and hide the quiz panel. */
function resetQuiz() {
    _quizState.active = false;
    _quizState.step = 0;
    _quizState.answers = [];
    var panel = typeof document !== "undefined" ? document.getElementById("quiz-panel") : null;
    if (panel) {
        panel.innerHTML = "";
        panel.style.display = "none";
    }
    _deactivateModal();
}

/** Toggle quiz panel visibility; starts quiz on first open. */
function toggleQuiz() {
    if (_quizState.active) {
        resetQuiz();
    } else {
        startQuiz();
    }
}

/** Initialize quiz feature — wire up the quiz button. */
function initQuiz() {
    if (typeof document === "undefined") return;
    var btn = document.getElementById("quiz-toggle");
    if (btn) {
        btn.addEventListener("click", function() {
            toggleQuiz();
        });
    }

    // Delegate data-action clicks for quiz buttons (CSP-safe, no inline onclick)
    document.addEventListener("click", function(e) {
        var action = e.target && e.target.getAttribute("data-action");
        if (action === "reset-quiz") resetQuiz();
        else if (action === "start-quiz") startQuiz();
    });
}

/**
 * Bootstrap all modules in the correct order.
 * Extracted to avoid duplicating the init sequence between the
 * DOMContentLoaded handler and the already-loaded branch.
 */
// ── Project Timeline ─────────────────────────────────────────────
//
// Interactive chronological timeline of project creation and releases.
// Shows when each project was started, its release history, and
// portfolio growth over time.
//
// Added to the analytics bar as a "📅 Timeline" toggle button.
