'use strict';


function dragging (e) {
  this.dx += (e.clientX + pageXOffset - lastX);
  this.dy += (e.clientY + pageYOffset - lastY);
  if (this.dx > 10 || this.dy > 10)
    this.dragging = true;
  this.lastX = e.clientX;
  this.lastY = e.clientY;
  if (!this.queued)
    requestAnimationFrame(animateDrag);
}

function animateDrag() {
  this.queued = false;
  this.style.transform = `translate(${dx}px,${dy}px)`;
}

function startDrag (e) {
  e.preventDefault();
  this.lastX = e.clientX + pageXOffset;
  this.lastY = e.clientY + pageYOffset;
  console.log('Clicked at: ' + lastX + ' ' + lastY);
  this.addEventListener('mousemove',dragging);
  this.addEventListener('mouseup',endDrag);
}

function endDrag (e) {
  this.dragging = false;
  this.removeEventListener('mousemove',dragging);
  this.removeEventListener('mouseup',endDrag);
}
