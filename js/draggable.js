'use strict';


function dragging (e) {
  var target = dragging.target;
  target.dx += (e.clientX + pageXOffset - target.lastX);
  target.dy += (e.clientY + pageYOffset - target.lastY);
  if (target.dx > 10 || target.dy > 10)
    target.ongoing = true;
  target.lastX = e.clientX + pageXOffset;
  target.lastY = e.clientY + pageYOffset;
  if (!target.queued)
    requestAnimationFrame(animateDrag);
}

function animateDrag() {
  var target = dragging.target;
  target.queued = false;
  // target.style.transform = `translate(${target.dx}px,${target.dy}px)`;
  target.style.left = `${target.dx}px`;
  target.style.top = `${target.dy}px`;
}

function startDrag (e) {
  e.preventDefault();
  var target = dragging.target = e.currentTarget;
  if (typeof target.dx == 'undefined' || typeof target.dy == 'undefined')
    target.dx = target.dy = 0;
  target.lastX = e.clientX + pageXOffset;
  target.lastY = e.clientY + pageYOffset;

  document.body.addEventListener('mousemove', dragging);
  document.body.addEventListener('mouseup', endDrag);
}

function endDrag () {
  dragging.target.ongoing = false;
  document.body.removeEventListener('mousemove', dragging);
  document.body.removeEventListener('mouseup', endDrag);
}

window.addEventListener ('DOMContentLoaded', () => {
  document.querySelectorAll ('.draggable').forEach (element => {
    element.addEventListener ('mousedown', startDrag);
  });
});
