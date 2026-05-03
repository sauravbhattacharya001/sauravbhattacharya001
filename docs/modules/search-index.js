// ── Pre-computed Search Index ────────────────────────────────────────
//
// Instead of calling .toLowerCase() on every project field on every
// keystroke / filter change, we pre-compute a search index once at load
// time.  Each entry holds a single concatenated lowercase string for
// full-text matching and a Set of lowercase tag names for O(1) tag
// filtering.  This eliminates ~O(N*T) repeated toLowerCase() calls in
// filterProjects() and projectMatchesQuery(), where N = number of
// projects and T = average tags per project.

var _searchIndex = (function() {
    var idx = [];
    for (var i = 0; i < PROJECTS.length; i++) {
        var p = PROJECTS[i];
        // Concatenate all searchable fields into one lowercase string.
        // Separated by \0 (won't appear in user queries) to prevent
        // false cross-field matches like "codeai" matching "code" + "ai".
        var parts = [
            p.title.toLowerCase(),
            p.desc.toLowerCase(),
            p.repo.toLowerCase()
        ];
        for (var t = 0; t < p.tags.length; t++) {
            parts.push(p.tags[t].toLowerCase());
        }
        var searchText = parts.join("\0");

        // Build a Set of lowercase tags for O(1) tag-filter lookups
        var tagSet = Object.create(null);
        for (var j = 0; j < p.tags.length; j++) {
            tagSet[p.tags[j].toLowerCase()] = true;
        }

        idx.push({ text: searchText, tagSet: tagSet });
    }
    return idx;
})();