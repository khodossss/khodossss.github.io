const skillDetails = {
  'languages-infra': {
    title: 'Languages & Infrastructure',
    skills: [
      {
        name: 'Python (Advanced)',
        desc: 'The primary language behind everything I build. From data pipelines and model training to API servers and automation scripts — Python is where most of my production code lives. Its ecosystem covers every tool in the AI/ML space without compromise.'
      },
      {
        name: 'SQL & NoSQL (PostgreSQL · MongoDB)',
        desc: 'Depending on the data shape, different databases solve different problems. PostgreSQL handles structured, relational workloads with complex queries and strong consistency. MongoDB fits heterogeneous, schema-flexible documents coming out of extraction pipelines — designed with indexing and sharding strategies to support high-throughput reads in production.'
      },
      {
        name: 'REST API — FastAPI',
        desc: 'ML pipelines are only useful if other systems can reach them. FastAPI is my go-to for exposing model and pipeline functionality — async by default, auto-documented, and fast enough to put in front of real traffic without a second thought.'
      },
      {
        name: 'Docker & Docker Compose',
        desc: 'Every service I ship runs in a container. Docker eliminates the "works on my machine" problem entirely, and Compose lets me wire together multi-service environments — LLM inference servers, API backends, databases — in a single declarative file.'
      },
      {
        name: 'Linux · macOS',
        desc: 'Most of my development and all of my production deployments live on Linux. Comfortable navigating servers, writing shell scripts, managing processes and environments without a GUI.'
      },
      {
        name: 'Git',
        desc: 'Version control is non-negotiable. Clean commits, meaningful history, and branching strategies that make collaboration smooth and rollbacks painless. Every project, no exceptions.'
      },
    ]
  },
  'llm-agents': {
    title: 'LLM & Agents',
    skills: [
      {
        name: 'LangChain & LangGraph',
        desc: 'LangChain handles the orchestration layer — chaining prompts, tools, and retrievers into coherent workflows. LangGraph takes it further: stateful, graph-based agent execution with branching logic, reviewer-style checkpoints, and control over what happens at each node. Most of my production agent systems are built on top of both.'
      },
      {
        name: 'AI LLM Agent Development',
        desc: 'Building agents that don\'t just respond — they plan, act, and adapt. From investigation systems that dynamically update evidence graphs to multi-step analytical pipelines that determine what to do next based on what they\'ve already found. The goal is always autonomous, reliable execution over sequences of decisions.'
      },
      {
        name: 'Open-Source LLMs (Llama, Qwen, Mistral)',
        desc: 'Running models locally unlocks things cloud APIs can\'t offer: no data leaves the environment, costs don\'t scale with volume, and model behavior can be tuned for specific extraction tasks. Llama, Qwen, and Mistral are the workhorses across most of my on-premise pipelines.'
      },
      {
        name: 'Proprietary LLM APIs (OpenAI, Google, Anthropic)',
        desc: 'Frontier models earn their place when reasoning quality, instruction-following, or multimodal capabilities are non-negotiable. OpenAI, Google, and Anthropic APIs are integrated where top-tier performance justifies the cost — always with careful token budgeting and latency management.'
      },
      {
        name: 'LangSmith',
        desc: 'Production LLM pipelines fail in ways that are hard to see without the right tooling. LangSmith brings full trace visibility — every prompt, every tool call, every token — making it possible to catch regressions, debug edge cases, and measure output quality across runs without flying blind.'
      },
    ]
  },
  'ml-dl': {
    title: 'ML & DL',
    skills: [
      {
        name: 'PyTorch',
        desc: 'The framework behind all my custom neural network work. Dynamic computation graphs make it easy to experiment, and the ecosystem covers everything from training loops to deployment. Built an attention-based classifier for credential pattern recognition entirely from scratch — custom tokenization, training pipeline, and evaluation included.'
      },
      {
        name: 'Keras',
        desc: 'When the goal is rapid prototyping, Keras shortens the path from idea to running model significantly. Good for validating architectures before committing to a full low-level implementation, and strong enough for production use when the task doesn\'t demand fine-grained control.'
      },
      {
        name: 'Scikit-learn',
        desc: 'The standard toolkit for classical ML. Used throughout for feature engineering, preprocessing, evaluation metrics, and baseline models. When deep learning is overkill, a well-tuned gradient boosting model from scikit-learn often gets the job done faster and with less fragility.'
      },
      {
        name: 'Pandas',
        desc: 'Data rarely arrives clean. Pandas handles the messy middle ground — loading, cleaning, reshaping, and aggregating tabular data before it enters a pipeline. Essential for any data-heavy project, especially during exploration and feature preparation.'
      },
      {
        name: 'NumPy',
        desc: 'The numerical foundation under almost everything else. Array operations, linear algebra, vectorized computation — NumPy sits at the core of most ML workflows whether or not it\'s referenced directly.'
      },
    ]
  },
  'data-retrieval': {
    title: 'Data & Retrieval',
    skills: [
      {
        name: 'Retrieval-Augmented Generation (RAG)',
        desc: 'Rather than expecting LLMs to memorize domain knowledge, RAG pulls relevant context from a vector store at query time and injects it into the prompt. The result is dramatically more accurate, grounded answers on specialized content — without retraining anything. Built full RAG pipelines including chunking strategies, embedding models, retrieval logic, and post-processing into structured outputs.'
      },
      {
        name: 'Vector Search',
        desc: 'Dense vector retrieval powers both semantic search and similarity-based lookup at scale. FAISS is the engine behind most of my retrieval systems — sub-second nearest-neighbor search over millions of vectors. Applied in face recognition pipelines (facial embeddings), document retrieval (text embeddings), and cross-modal search workflows.'
      },
      {
        name: 'OCR',
        desc: 'Experienced building fully custom OCR pipelines from scratch — including a fully local pipeline with a self-tuned YOLO model for region detection paired with PaddleOCR for text extraction. No third-party services, no cloud dependencies. The same stack powers document intelligence workflows for identity documents, combining MRZ parsing with field-level LLM extraction on top.'
      },
    ]
  },
  'engineering': {
    title: 'Engineering',
    skills: [
      {
        name: 'OOP',
        desc: 'Structuring code around objects and clear abstractions makes complex systems manageable. AI pipelines have a lot of moving parts — models, retrievers, databases, APIs — and good object-oriented design keeps those parts decoupled, swappable, and easy to reason about independently.'
      },
      {
        name: 'Clean Code',
        desc: 'Code gets read far more than it gets written. Naming things clearly, keeping functions focused, avoiding clever shortcuts that save five minutes and cost five hours later — these habits compound over time and make the difference between a codebase that scales and one that becomes a liability.'
      },
      {
        name: 'Unit Testing',
        desc: 'AI pipelines have a lot of surface area for silent failures. Unit tests catch regressions before they reach production, document expected behavior for the next person reading the code, and make refactoring significantly less nerve-wracking. Especially critical around extraction logic, scoring functions, and data transformations.'
      },
      {
        name: 'Agile',
        desc: 'Shipping iteratively, adapting to new information, and keeping the feedback loop short. Agile practices — sprints, standups, retrospectives — are the difference between a project that delivers incrementally and one that disappears into months of planning before anyone sees a result.'
      },
    ]
  },
};

// Build and inject modal HTML once
const backdrop = document.createElement('div');
backdrop.className = 'modal-backdrop';
backdrop.innerHTML = `
  <div class="modal">
    <div class="modal-header">
      <div class="modal-dots">
        <button class="modal-dot r" id="modal-close">✕</button>
        <div class="modal-dot y"></div>
        <div class="modal-dot g"></div>
      </div>
      <div class="modal-title" id="modal-title"></div>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
`;
document.body.appendChild(backdrop);

const modalTitle = document.getElementById('modal-title');
const modalBody  = document.getElementById('modal-body');

function openModal(key) {
  const data = skillDetails[key];
  if (!data) return;

  modalTitle.textContent = data.title;
  modalBody.innerHTML = data.skills.map(s => `
    <div class="modal-skill-row">
      <div class="modal-skill-name">${s.name}</div>
      <div class="modal-skill-desc">${s.desc}</div>
    </div>
  `).join('');

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.querySelectorAll('.skill-group[data-skill]').forEach(el => {
  el.addEventListener('click', () => openModal(el.dataset.skill));
});
