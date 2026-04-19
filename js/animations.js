// Prompt line cursor blink
document.querySelectorAll('.prompt-line').forEach(el => {
  let show = true;
  setInterval(() => {
    el.style.opacity = show ? '1' : '0.3';
    show = !show;
  }, 600);
});

// Scroll fade-in for cards
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fadeIn 0.5s ease forwards';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.exp-card, .edu-card, .pub-card, .project-card, .skill-group, .contact-card').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
