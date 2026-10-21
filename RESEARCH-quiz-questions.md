# Best practices for quiz questions generated from article content

**Answer:** For a ~1200–1800-word blog post, write 3–4 questions — one per key learning outcome, takeaway first. Prefer application/scenario stems over recall, 3–4 options with distractors built from real misconceptions, and a one-sentence explanation that teaches the *why*. Most failures are distractor-quality failures, not question-stem failures.

**Confidence:** high on item-writing rules (decades of assessment literature, sources agree); medium on counts — no study fixes an optimal number for a blog; ranges below are practitioner judgment scaled from classroom guidance [6].

## Why

### Count and placement

- **No research fixes a number; purpose decides.** A low-stakes comprehension check after one text: 5–8 in classroom terms — for a blog, where completion is voluntary, **3–4 is the working range; 5 ceiling** [6]. Match roughly one question per major section, and always cover the post's single key takeaway.
- **Several short quizzes beat one long one** [6] — the site's per-post quiz model is already the right shape.
- **Placement:** a "Test yourself" block near the end (after payoff, before resources) matches the retrieval-practice pattern; the score line auto-renders after the last card.
- Interactive quizzes measurably raise time-on-page and recall vs. plain text — mixing question formats raises engagement further [7].

### Question types (what the content supports)

Match type to the learning outcome [5][9]:

- **Application/scenario** — put the mechanism in a mini-situation ("Your suite does X — which setting?"). The strongest type; memory-plus-application outperforms recall items [4].
- **Best-answer** — when options differ in degree ("which is the biggest risk").
- **Multi-select** (`multi="true"`) — for genuine sets ("which of these make parallel tests flaky"). Cap at one per post; 1–2 correct options.
- **Odd-one-out / tradeoff** — comparisons the post makes implicitly.
- **Avoid** — pure trivia (version numbers, syntax spelling) unless it IS the takeaway; negative stems ("which is NOT…"); "all/none of the above"; fill-in-the-blank restatements of a sentence from the post (tests recall of the source, not comprehension) [1][5].

### Distractor rules — where quality lives [1][2][3][8]

- **Plausible only** — a wrong option a prepared reader instantly dismisses is a wasted slot. Best source: real misconceptions and common errors (the post's own "tried it, didn't work" moments).
- **Homogeneous** — same length, grammar, voice, format across all options. The longest/most-detailed option reliably wins guesses.
- **Mutually exclusive** — no option partially true; no overlaps ("more than 50%" / "70%").
- **No cues** — don't repeat a stem keyword in the correct answer; avoid absolute terms ("always", "never") in wrong options (they read as dismissible) and vague frequency terms.
- **3–4 options** is the sweet spot; more just adds non-functional distractors [1][5].
- **Vary the correct index** across a post's questions — position patterns are a cue.
- **Stems stand alone** — a prepared reader should be able to answer before reading options; put necessary context in the stem, keep options short.
- **Explanations teach** — one to two sentences on *why* the answer is right and the tempting distractor wrong; the `source` param links back into the post.
- **Trivial? Cut it.** If the question tests a fact nobody acts on, delete rather than pad the count [8].

### Iterate with real data

The shortcode already records submissions vs. correct answers per question (Waline counters). That enables item analysis: very high correct-rate = too easy/cued; very low = ambiguous or off-content; mid-range discriminates best [4]. Revisit questions with near-100% or near-0% rates after a few hundred submissions.

## What would change this

If quizzes shifted from engagement/retrieval practice to assessment (certification, hiring screens), counts and validity requirements would jump — blueprinting, item analysis, 20+ items [4]. Not the blog's use case.

## Considered and rejected

- **More questions to cover more content** — rejected: completion collapses past ~5 for voluntary readers; coverage matters less than the takeaway.
- **Search-proofing every question** — rejected: the quiz is self-check, not exam; scenario stems already reduce copy-paste trivially [3].

## Open

- Which question types correlate with completion/correctness on this site — answerable from the Waline aggregates once enough data accrues.

## Sources

[1] Educator's blueprint: 10 strategies for high-quality MCQs (PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC9873868/
[2] Developing, Analyzing, and Using Distractors — comprehensive review (Sage): https://journals.sagepub.com/doi/10.3102/0034654317726529
[3] Writing effective MCQs — Bath Teaching Hub: https://teachinghub.bath.ac.uk/guide/writing-effective-multiple-choice-questions/
[4] 14 Rules for Writing Multiple-Choice Questions (Haladyna/Downing, Schreyer Institute): https://www.schreyerinstitute.psu.edu/pdf/14RulesforWritingMultiple-ChoiceQuestions2009.pdf
[5] Designing effective MCQs — Trinity College Dublin: https://www.tcd.ie/media/tcd/academic-practice/pdfs/Designing_effective_MCQs.pdf
[6] How Many Questions Should a Reading Quiz Have? — iRead: https://iread.education/resources/reading-quizzes/how-many-questions-reading-quiz
[7] Help Audiences Learn By Adding Quizzes — Center for Media Engagement: https://mediaengagement.org/blogs/help-audiences-learn-by-adding-quizzes-to-your-content/
[8] Avoiding common MCQ pitfalls (PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC3045096/
[9] ReaderQuizzer — question categories for comprehension (arXiv): https://doi.org/10.48550/arxiv.2308.07988
[10] Generating Guiding Questions to Promote Active Reading (arXiv): https://doi.org/10.48550/arxiv.2407.14309
