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
    frame.style.setProperty('--art-shift', `${reduced ? 0 : -position * bounds.height * 0.1}px`);
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

const projectPanel = document.querySelector('#project-panel');
const projects = [...projectPanel.querySelectorAll('.project')];
const previousProject = document.querySelector('#project-prev');
const nextProject = document.querySelector('#project-next');
const projectPosition = document.querySelector('#project-position');
let projectFrame = null;
let pageTurn = null;
let turningPage = false;

function currentProject() {
  return projects.reduce((nearest, project, index) =>
    Math.abs(project.offsetLeft - projectPanel.scrollLeft) < Math.abs(projects[nearest].offsetLeft - projectPanel.scrollLeft) ? index : nearest, 0);
}

function updateProjectControls() {
  projectFrame = null;
  const index = currentProject();
  previousProject.disabled = turningPage || index === 0;
  nextProject.disabled = turningPage || index === projects.length - 1;
  const position = `${index + 1} / ${projects.length}`;
  if (projectPosition.textContent !== position) projectPosition.textContent = position;
}

async function moveProject(direction) {
  if (turningPage) return;
  const current = currentProject();
  const index = clamp(current + direction, 0, projects.length - 1);
  if (current === index) return;

  if (motionPreference.matches) {
    projectPanel.scrollTo({ left: projects[index].offsetLeft, behavior: 'instant' });
    updateProjectControls();
    return;
  }

  turningPage = true;
  updateProjectControls();
  const overlay = document.createElement('div');
  overlay.className = `page-turn ${direction > 0 ? 'page-forward' : 'page-backward'}`;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  const leaf = document.createElement('div');
  leaf.className = 'papyrus-leaf';
  const front = projects[current].cloneNode(true);
  front.classList.add('papyrus-front');
  await Promise.all([...front.querySelectorAll('img')].map(image => {
    image.loading = 'eager';
    return image.decode().catch(() => {});
  }));
  const fold = document.createElement('div');
  fold.className = 'papyrus-fold';
  leaf.append(front);
  overlay.append(leaf, fold);
  projectPanel.parentElement.append(overlay);

  const timing = { duration: motionPreference.matches ? 0 : 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' };
  const forward = direction > 0;
  pageTurn = front.animate([
    { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' },
    { clipPath: forward ? 'polygon(0 0,46% 0,54% 100%,0 100%)' : 'polygon(46% 0,100% 0,100% 100%,54% 100%)', offset: 0.5 },
    { clipPath: forward ? 'polygon(0 0,0 0,0 100%,0 100%)' : 'polygon(100% 0,100% 0,100% 100%,100% 100%)' },
  ], timing);
  const width = projectPanel.clientWidth;
  const skew = Math.atan(width * 0.08 / projectPanel.clientHeight) * 180 / Math.PI;
  fold.animate([
    { opacity: 0, transform: `translate3d(${forward ? width : -width * 0.08}px,0,0) scaleX(.2)` },
    { opacity: 1, transform: `translate3d(${width * 0.46}px,0,0) skewX(${skew}deg)`, offset: 0.5 },
    { opacity: 0, transform: `translate3d(${forward ? -width * 0.08 : width}px,0,0) scaleX(.2)` },
  ], timing);
  projectPanel.scrollTo({ left: projects[index].offsetLeft, behavior: 'instant' });
  updateProjectControls();
  try {
    await pageTurn.finished;
  } catch {
    // Resize and reduced-motion changes finish the turn immediately.
  } finally {
    overlay.remove();
    pageTurn = null;
    turningPage = false;
    updateProjectControls();
  }
}

motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) pageTurn?.finish();
});

previousProject.addEventListener('click', () => moveProject(-1));
nextProject.addEventListener('click', () => moveProject(1));
projectPanel.addEventListener('scroll', () => {
  if (projectFrame === null) projectFrame = requestAnimationFrame(updateProjectControls);
}, { passive: true });
window.addEventListener('resize', () => {
  pageTurn?.finish();
  const index = Number(projectPosition.textContent.split('/')[0]) - 1;
  projectPanel.scrollTo({ left: projects[index].offsetLeft, behavior: 'instant' });
  updateProjectControls();
});
document.querySelector('.project-controls').hidden = false;
updateProjectControls();
