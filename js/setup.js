'use strict';


var SOURCE, SINK;
var FRAME_WIDTH, FRAME_HEIGHT;
var FPS, FPS_LABEL, DECAY, FPS_DECAY_THRESHOLD;
var FRAME_BOUNDS = {};
var FILTER_BOUNDS = {};


var camera_constraints =
{
  audio: false,
  video:
  {
    facingMode: "user",
    width: {max: 640},
    height: {max: 480},
    frameRate: 30,
  }
}


function camera_error (error)
{
  console.error('Couldn\'t get access to webcam.', error);
}


function camera_init (mediaStream)
{
  window.stream = mediaStream;

  SOURCE.onloadedmetadata = function(e)
  {
    FRAME_WIDTH = SINK.canvas.width = SOURCE.videoWidth;
    FRAME_HEIGHT = SINK.canvas.height = SOURCE.videoHeight;
    FRAME_BOUNDS = SINK.canvas.getBoundingClientRect();
    loaded ();
    console.log('camera source loaded.')
    pyramids_init ();
    videomag_init ();
    blur_init ();

    requestAnimationFrame (render);
  };
  SOURCE.srcObject = mediaStream;
}


function image_init()
{
  SOURCE.onload = function ()
  {
    FRAME_WIDTH = SINK.canvas.width = SOURCE.width;
    FRAME_HEIGHT = SINK.canvas.height = SOURCE.height;
    FRAME_BOUNDS = SINK.canvas.getBoundingClientRect();
    loaded ();
    console.log('image source loaded.')
    pyramids_init ();
    videomag_init ();
    blur_init ();

    requestAnimationFrame (render);
  }
  SOURCE.src = SOURCE.src;
}


function init ()
{
  SOURCE = document.querySelector('.source');
  SINK = document.querySelector('.sink').getContext('2d');

  heap_init ();
  options_init ();
  fps_init ();

  switch (SOURCE.tagName)
  {
    case 'VIDEO':
      if (SOURCE.src === '')
        navigator.mediaDevices.getUserMedia(camera_constraints).
        then(camera_init).catch(camera_error);
    case 'IMG':
      image_init ();
  }
}


function loaded ()
{
  var loading = document.querySelectorAll ('.loading');
  loading.forEach (e => e.classList.replace ('loading', 'fade_in'));
  setTimeout (() => loading.forEach (e => e.classList.toggle('fade_in')), 330);
  spinner_init ();
  document.querySelector('.options').classList.toggle ('hide');
}


function spinner_init ()
{
  var spinnerElement = document.querySelector ('.spinner');
  spinnerElement.classList.toggle ('fade_out');
  setTimeout (() => spinnerElement.remove(), 330);
}


function fps_init ()
{
  FPS = 1;
  DECAY = get_iir_decay (1/4, 1/30); // 0.0510
  FPS_DECAY_THRESHOLD = 1000/5; // 5 fps => 1000/5 = 200 ms
  FPS_LABEL = document.querySelector('.fps');
  FPS_LABEL.innerHTML = FPS;
}


function update_frame_rate (delta)
{
  var save = FPS;
  DECAY = get_iir_decay (1/4, delta/1000);
  if (delta > FPS_DECAY_THRESHOLD)
    FPS = 1000/delta;
  else
    FPS = (1 - DECAY) * FPS + DECAY * 1000/delta;

  if (Math.trunc (FPS*10)/10 - Math.trunc (save*10)/10 != 0)
    FPS_LABEL.innerHTML = parseFloat(FPS).toFixed(1);
}


function render (timestamp)
{
  SINK.drawImage (SOURCE, 0, 0);
  var frame = SINK.getImageData (0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  if (filter_size_changed)
    set_filter_dims ();

  if (filter_on)
  {
    if (filter_size < 100)
    {
      SINK.putImageData (frame, 0, 0);

      let width = FILTER_BOUNDS.width;
      let height = FILTER_BOUNDS.height;
      let x = FILTER_BOUNDS.x;
      let y = FILTER_BOUNDS.y;

      frame = SINK.getImageData (x, y, width, height);
      let processed = videomag (frame.data, width, height);

      SINK.putImageData (new ImageData(processed, width, height), x, y);
    }
    else
    {
      let processed = videomag (frame.data, FRAME_WIDTH, FRAME_HEIGHT);
      SINK.putImageData (new ImageData(processed, FRAME_WIDTH, FRAME_HEIGHT), 0, 0);
    }

    if (show_pyramid)
      display_pyramid();

    blur_size_changed = false;
    filter_size_changed = false;
  }
  else
    SINK.putImageData (frame, 0, 0);

  // if (++counter == 1)
  //   throw 'one and done'

  update_frame_rate (timestamp - render.last);
  render.last = timestamp;
  requestAnimationFrame (render);
}
render.last = 0;
