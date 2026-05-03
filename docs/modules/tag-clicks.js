/**
 * Wire up click handlers for tag buttons on project cards.
 * Uses event delegation on the projects container for efficiency.
 */
function wireTagClicks() {
    var container = document.getElementById("projects-container");
    if (!container) return;

    container.addEventListener("click", function(e) {
        var tagEl = e.target;
        if (!tagEl.classList.contains("tag-clickable")) return;

        e.preventDefault();
        e.stopPropagation();

        var tagName = tagEl.getAttribute("data-tag");
        if (!tagName) return;

        // Toggle: if same tag is clicked again, clear it
        if (_filterState.tag && _filterState.tag.toLowerCase() === tagName.toLowerCase()) {
            clearTagFilter();
        } else {
            setTagFilter(tagName);
        }
    });
}