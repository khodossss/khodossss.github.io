const titleData = [
  { title: 'AI Engineer'    },
  { title: 'Data Scientist' },
  { title: 'LLM Engineer'   },
  { title: 'AI Developer'   },
];

const typedEl = document.getElementById('typed-title');
let titleIndex = 0;

function typeTitle(text, cb) {
  const msPerChar = 1300 / text.length;
  let i = 0;
  typedEl.textContent = '';
  function step() {
    typedEl.textContent = text.slice(0, i + 1);
    i++;
    if (i === text.length) { setTimeout(cb, 0); return; }
    setTimeout(step, msPerChar);
  }
  step();
}

function eraseTitle(text, cb) {
  const msPerChar = 800 / text.length;
  let len = text.length;
  function step() {
    typedEl.textContent = text.slice(0, len - 1);
    len--;
    if (len === 0) { setTimeout(cb, 0); return; }
    setTimeout(step, msPerChar);
  }
  step();
}

function runCycle() {
  const { title } = titleData[titleIndex];
  typeTitle(title, () => {
    setTimeout(() => {
      eraseTitle(title, () => {
        titleIndex = (titleIndex + 1) % titleData.length;
        runCycle();
      });
    }, 1300);
  });
}

runCycle();
