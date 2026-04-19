const photoSlides = document.querySelectorAll('.photo-slide');
const photoCmdName = document.getElementById('photo-cmd-name');
const scanLine = document.querySelector('.photo-scan-line');

if (photoSlides.length > 1 && photoCmdName && scanLine) {
  let index = 0;
  scanLine.addEventListener('animationiteration', () => {
    photoSlides[index].classList.remove('active');
    index = (index + 1) % photoSlides.length;
    photoSlides[index].classList.add('active');
    photoCmdName.textContent = photoSlides[index].dataset.name;
  });
}
