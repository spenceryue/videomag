'use strict';


var SOURCE, SINK;
var FRAME_WIDTH, FRAME_HEIGHT;
var FPS, FPS_LABEL, DECAY, FPS_DECAY_THRESHOLD;
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
    loaded ();
    console.log('camera source loaded.')
  };
  SOURCE.srcObject = mediaStream;
}


function image_init()
{
  SOURCE.onload = function ()
  {
    FRAME_WIDTH = SINK.canvas.width = SOURCE.width;
    FRAME_HEIGHT = SINK.canvas.height = SOURCE.height;
    loaded ();
    console.log('image source loaded.')
  }
  SOURCE.src = SOURCE.src;
}


function video_source_init ()
{
  SOURCE.onloadeddata = function(e)
  {
    if (this.readyState < 2)
      return;

    FRAME_WIDTH = SINK.canvas.width = SOURCE.videoWidth;
    FRAME_HEIGHT = SINK.canvas.height = SOURCE.videoHeight;
    loaded ();
    console.log('video source loaded.')
  };
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
      else
        video_source_init ();
      break;
    case 'IMG':
      image_init ();
  }
}


function loaded ()
{
  pyramids_init ();
  videomag_init ();
  blur_init ();

  var loading = document.querySelectorAll ('.loading');
  loading.forEach (e => e.classList.replace ('loading', 'fade_in'));
  setTimeout (() => loading.forEach (e => e.classList.toggle ('fade_in')), 330);
  spinner_init ();
  document.querySelector('.options').classList.toggle ('hide');

  requestAnimationFrame (render);
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
  if (filter_size_changed)
    set_filter_dims ();

  // downsample input

  SINK.drawImage (SOURCE, 0, 0);

  if (filter_on)
  {
    if (filter_size < 100)
    {
      let width = FILTER_BOUNDS.width;
      let height = FILTER_BOUNDS.height;
      let x = FILTER_BOUNDS.x;
      let y = FILTER_BOUNDS.y;

      let frame = SINK.getImageData (x, y, width, height);
      let processed = videomag (frame.data, width, height);
      SINK.putImageData (new ImageData(processed, width, height), x, y);
    }
    else
    {
      let frame = SINK.getImageData (0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      let processed = videomag (frame.data, FRAME_WIDTH, FRAME_HEIGHT);
      SINK.putImageData (new ImageData(processed, FRAME_WIDTH, FRAME_HEIGHT), 0, 0);
    }

    if (show_pyramid)
      display_pyramid();

    blur_size_changed = false;
    filter_size_changed = false;
    filter_toggled = false;
  }

  /*if (++counter == 1)
    throw 'one and done'*/

  update_frame_rate (timestamp - render.last);
  render.last = timestamp;
  requestAnimationFrame (render);
}
render.last = 0;
