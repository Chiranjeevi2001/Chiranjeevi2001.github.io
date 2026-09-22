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
