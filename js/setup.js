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
    // frameRate: 30,
  }
}

function reset_frame_parameters (source=SOURCE)
{
  if (SOURCE.tagName == 'VIDEO')
  {
    FRAME_WIDTH = SOURCE.videoWidth;
    FRAME_HEIGHT = SOURCE.videoHeight;
  }
  else
  {
    FRAME_WIDTH = SOURCE.width;
    FRAME_HEIGHT = SOURCE.height;
  }

  document.querySelectorAll ('.sink').forEach (canvas => {
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
  });

  filter_size_changed = true;
}


function camera_error (error)
{
  console.error('Couldn\'t get access to webcam.', error);
}


function camera_init (mediaStream)
{
  window.stream = mediaStream;

  this.onloadedmetadata = function(e)
  {
    this.loaded = true;
    reset_frame_parameters (this);

    loaded ();
    console.log('camera source loaded.')
  };
  this.srcObject = mediaStream;
}


function image_init()
{
  SOURCE.onload = function ()
  {
    this.loaded = true;
    reset_frame_parameters (this);

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

    this.loaded = true;
    reset_frame_parameters ();

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
        then(camera_init.bind (SOURCE)).catch(camera_error);
      else
        video_source_init ();
      break;
    case 'IMG':
      image_init ();
  }
}


function loaded ()
{
  if (!loaded.done)
    loaded.done = true;
  else
    return;

  pyramids_init ();
  videomag_init ();
  blur_init ();

  var loading = document.querySelectorAll ('.loading');
  loading.forEach (e => e.classList.replace ('loading', 'fade_in'));
  spinner_init ();
  options_pane_init ();
  header_init ();
  setTimeout (() => loading.forEach (e => e.classList.toggle ('fade_in')), 1000);

  render.id = requestAnimationFrame (render);
}


function header_init ()
{
  var element = document.body.querySelector('.title');
  setTimeout(() => element.classList.toggle ('blur_focus'), 330);
  element.addEventListener ('mouseenter', () => {
    element.classList.toggle ('blur_focus');
    element.getBoundingClientRect();
    element.classList.toggle ('blur_focus');
  }, {passive:true});
}


function spinner_init ()
{
  var spinnerElement = document.querySelector ('.spinner');
  spinnerElement.classList.toggle ('fade_out');
  setTimeout (() => spinnerElement.remove(), 1000);
}


function options_pane_init ()
{
  var options_lock = document.querySelector('.options_lock');
  var options = document.querySelector('.options');
  if (document.body.getBoundingClientRect().width >= 1000)
  {
    options_lock.classList.toggle ('docked', true);
    options.classList.replace ('hide','docked');
  }
  else
  {
    setTimeout(() => options.classList.replace ('hide', 'undocked'), 1000);
  }

  window.addEventListener('resize', () => {
    if (document.body.getBoundingClientRect().width >= 1000)
    {
      options_lock.classList.toggle ('docked', true);
      options.classList.toggle ('docked', true);
      options.classList.toggle ('undocked', false);
    }
    else
    {
      options_lock.classList.toggle ('docked', false);
      options.classList.toggle ('docked', false);
      options.classList.toggle ('undocked', true);
    }
  }, {passive:true});
}


function fps_init ()
{
  FPS = 1;
  DECAY = get_iir_decay (1/4, 1/30); // 0.0510
  FPS_DECAY_THRESHOLD = 1000/5; // 5 fps => 1000/5 = 200 ms
  FPS_LABEL = document.querySelector('.fps');
  FPS_LABEL.innerHTML = FPS;
}
