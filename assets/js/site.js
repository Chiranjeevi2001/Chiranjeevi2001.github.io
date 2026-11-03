const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const officeMoment = document.querySelector('.office-moment');
const officeToggle = document.querySelector('#office-toggle');
const officeScene = document.querySelector('#office-scene');
const officeStatus = document.querySelector('#office-status');

function stopOfficeMoment() {
  officeScene.replaceChildren();
  officeScene.hidden = true;
  officeToggle.textContent = 'Play an Office moment';
  officeToggle.setAttribute('aria-expanded', 'false');
  officeStatus.textContent = '';
}

function updateMotionPreference() {
  if (motionPreference.matches) stopOfficeMoment();
  officeMoment.hidden = motionPreference.matches;
}

officeToggle.addEventListener('click', () => {
  if (!officeScene.hidden || motionPreference.matches) {
    stopOfficeMoment();
    return;
  }

  const image = new Image(500, 272);
  image.alt = 'Dwight’s fire-drill scene from The Office.';
  officeStatus.textContent = 'Loading the Office moment…';
  image.addEventListener('load', () => {
    if (image.isConnected) officeStatus.textContent = '';
  });
  image.addEventListener('error', () => {
    if (!image.isConnected) return;
    stopOfficeMoment();
    officeStatus.textContent = 'The clip couldn’t load. You can try playing it again.';
  });
  image.src = 'assets/images/dwight.gif';
  officeScene.replaceChildren(image);
  officeScene.hidden = false;
  officeToggle.textContent = 'Stop the Office moment';
  officeToggle.setAttribute('aria-expanded', 'true');
});

motionPreference.addEventListener('change', updateMotionPreference);
updateMotionPreference();

const navigation = document.querySelector('.site-nav');
const hero = document.querySelector('.intro');
const projectFrames = [...document.querySelectorAll('.project-art-frame')];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
let scrollFrame = null;
let smoothScroll = null;

function renderScroll() {
  scrollFrame = null;
  const scroll = window.scrollY;
  const viewport = window.innerHeight;
  const reduced = motionPreference.matches;
  navigation.classList.toggle('compact', scroll > 60);

  const progress = reduced ? 0 : clamp(scroll / hero.offsetHeight, 0, 1) ** 2;
  hero.style.setProperty('--hero-lag', `${reduced ? 0 : clamp(scroll * 0.35, 0, viewport)}px`);
  hero.style.setProperty('--hero-progress', progress);

  for (const frame of projectFrames) {
    const bounds = frame.getBoundingClientRect();
    const position = clamp((bounds.top + bounds.height / 2 - viewport / 2) / (viewport / 2 + bounds.height / 2), -1, 1);
    const isCard = Boolean(frame.closest('.project-grid'));
    const travel = bounds.height * (isCard ? 0.065 : 0.1);
    const movement = isCard ? clamp(position * 2.5, -1, 1) : position;
    frame.style.setProperty('--art-shift', `${reduced ? 0 : -movement * travel}px`);
  }
}

function requestScrollRender() {
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(renderScroll);
}

function configureScrolling() {
  smoothScroll?.destroy();
  smoothScroll = null;
  if (!motionPreference.matches && typeof Lenis !== 'undefined') {
    smoothScroll = new Lenis({
      lerp: 0.09,
      autoRaf: true,
      anchors: { offset: -90 },
    });
    smoothScroll.on('scroll', requestScrollRender);
  }
  requestScrollRender();
}

window.addEventListener('scroll', requestScrollRender, { passive: true });
window.addEventListener('resize', requestScrollRender);
motionPreference.addEventListener('change', configureScrolling);
document.fonts.ready.then(requestScrollRender);
configureScrolling();
renderScroll();
