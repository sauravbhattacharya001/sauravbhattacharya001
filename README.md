<div align="center">

<!-- Header -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=26&duration=4000&pause=1000&color=58A6FF&center=true&vCenter=true&multiline=true&repeat=true&width=760&height=100&lines=Hey%2C+I'm+Saurav+%F0%9F%91%8B;I+work+on+agent+reliability" alt="Typing SVG" />

**Software Engineer @ Microsoft · Agent Reliability**

*Measuring whether agents are right — and stopping them before they're wrong.*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sauravbhattacharya001/)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:online.saurav@gmail.com)
[![gate-agent](https://img.shields.io/badge/gate--agent-deterministic_guardrails-black?style=for-the-badge&logo=rust&logoColor=white)](https://github.com/sauravbhattacharya001/gate-agent)
[![agent-eval](https://img.shields.io/badge/agent--eval-eval_toolkit-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/sauravbhattacharya001/agent-eval)

</div>

---

I build the **measurement and enforcement layer for AI agents** — the part that tells you whether an agent's answer is actually correct, and the part that blocks a dangerous action *before* it happens.

Most "agent safety" today is an LLM grading another LLM after the fact. That's a wobbly sensor bolted on after the money already moved. My work is the opposite: **deterministic checks that gate, calibrated judges that only report, and evidence ranked by how hard it is to forge.**

**🏢 Microsoft** · Redmond, WA

---

## 🎯 The focus: can you trust what the agent just did?

Two questions, two pillars. Everything below serves one of them.

| Pillar | Question | Repo |
|---|---|---|
| **Measure it** | Was the answer right — retrieval, grounding, reasoning? And is my *judge* even calibrated? | [`agent-eval`](https://github.com/sauravbhattacharya001/agent-eval) · [`maf-evals`](https://github.com/sauravbhattacharya001/maf-evals) |
| **Enforce it** | Can I stop a bad action *before* it runs, deterministically, on the hot path? | [`gate-agent`](https://github.com/sauravbhattacharya001/gate-agent) |

> **One principle ties them together:** rank evidence by *independence*, not cost. A document-ID match or a tool-argument check means the same thing every run — so it gates. An LLM judge wobbles between runs — so it only reports. Never let a number that flips a coin block a merge or a payout.

---

## 🚀 Core work

### 🛡️ [gate-agent](https://github.com/sauravbhattacharya001/gate-agent) — a circuit breaker on the live wire

A safety gate that says **"no" *before* an agent does something dangerous**, not after. Rust core (PyO3), checked before *every* tool step in tens of nanoseconds, with an identical verdict every time. Drop-in adapters for **LangGraph, CrewAI, AutoGen, LlamaIndex**.

Enforces structural facts a judge can't reliably see: prerequisites (`ExecuteRefund` requires prior `VerifyIdentity`), runaway-loop detection, depth/token budgets, tool-argument schemas.

```text
 gate-agent  vs  LLM-as-a-judge   —  same unsafe refund trace
------------------------------------------------------------------
 Blocks unsafe refund          100% every run        62% of runs
 Unverified refunds leaked            0.0%                 37.5%
 When it decides             BEFORE the refund       AFTER the refund
 Verdict                        deterministic        wobbles (SD~0.20)
 Latency / step                    ~9 µs                  ~700 ms
------------------------------------------------------------------
```

*Why it matters: no evaluation run afterward can un-refund $5,000. Safety has to be a pre-execution decision.*

### 📐 [agent-eval](https://github.com/sauravbhattacharya001/agent-eval) — evaluation ranked by independence, not by cost

A zero-dependency TypeScript toolkit for evaluating agent output — in tests, on production transcripts, and as a CI gate. Built on an **independence-first tier pyramid**:

| Tier | What it is | Why it's trusted |
|---|---|---|
| **1 — Externally Observable** | JSON parses, tool ran, diff exists | The agent *cannot forge it* |
| **2 — Statistically Observable** | Embeddings, drift, staleness | The agent didn't produce the baseline |
| **3 — Shared-Substrate Judgment** | Model-as-judge | Last resort — most forgeable |

Most agent failures (crashes, stale runs, format breaks, hallucinated paths) are caught by Tier 1+2 alone. **Gate vs. grade:** a check either gates (binary) or grades (0–1). A low grade is *information, not a failure* — never coerce one into the other.

### 🔬 [maf-evals](https://github.com/sauravbhattacharya001/maf-evals) — the same discipline, on Microsoft Agent Framework + calibrated

A .NET 8 reference implementation of three-tier evaluation, and the repo where I make the case that **calibration is non-negotiable** — with numbers from actually running it:

- **Split the RAG judge into Retrieval / Groundedness / Relevance. Never average them.** One blended "quality score" hides the exact failure you need to fix.
- Calibration caught the Groundedness judge scoring **outright fabrication at exactly 3.0 every time** while *also* penalizing good answers — two errors that cancel into a healthy-looking −0.17 bias. Moving the floor 3.0 → 3.5 lifted band agreement **50% → 75%**.
- The Retrieval judge returned `5, 2, 4, 5, 2` on identical input — **17% of merge decisions would flip at random**, so an exact `expectedChunkIds` check does the gating and the judge only advises.
- The judge costs **~250× the agent** — measuring quality is the entire bill, so caching and counting judge calls is the real engineering.

*The thesis: a threshold picked without calibration is just taste.*

---

## 🧰 Also building (adjacent, not the focus)

Where the reliability work gets battle-tested — real agents and prompt tooling to point the evals and gates at.

| Project | What it is |
|---|---|
| **[WinSentinel](https://github.com/sauravbhattacharya001/WinSentinel)** ⭐ | Always-on Windows security agent (.NET, 70k+ LOC, 4k+ tests) — a real autonomous agent to stress the reliability layer against |
| **[prompt / promptlib](https://github.com/sauravbhattacharya001/prompt)** | .NET Azure OpenAI prompt-engineering toolkit — templates, chains, injection guards (published NuGet) |
| **[agentic-recipes](https://github.com/sauravbhattacharya001/agentic-recipes)** | Canonical agentic pipeline patterns built on promptlib |

<sub>Full portfolio — languages, distributed systems, viz — in **[PROJECTS.md](./PROJECTS.md)**.</sub>

---

## 🛠️ Tech

<div align="center">

![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=flat-square&logo=csharp&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-512BD4?style=flat-square&logo=dotnet&logoColor=white)
![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)
![PyO3](https://img.shields.io/badge/PyO3-black?style=flat-square&logo=rust&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-425CC7?style=flat-square&logo=opentelemetry&logoColor=white)

</div>

---

## 🔬 Research

- **Agent evaluation & judge calibration** — why a single quality score lies, and how to measure the measurer
- **Deterministic pre-execution safety** — enforcing invariants on the hot path instead of grading traces after the fact
- **AI agent identity, accountability & self-replication safety** — governing autonomous agents
- Published in **IEEE** and **Springer** · Chair, **ICGIS 2026** · [📄 Papers](https://github.com/sauravbhattacharya001/papers)

---

## 📊 GitHub Stats

<div align="center">

<img src="https://github-readme-stats.vercel.app/api?username=sauravbhattacharya001&show_icons=true&theme=github_dark&hide_border=true&count_private=true&include_all_commits=true" height="165" />
<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=sauravbhattacharya001&layout=compact&theme=github_dark&hide_border=true&langs_count=8" height="165" />

<img src="https://github-readme-activity-graph.vercel.app/graph?username=sauravbhattacharya001&theme=github-dark&hide_border=true&area=true" width="720" />

</div>

---

<div align="center">

*If your agent can move money, delete data, or ship code — you need to measure whether it's right, and gate it before it's wrong.*

**That's what I build.**

</div>
