'use strict';


var SOURCE, SINK;
var FRAME_WIDTH, FRAME_HEIGHT;
var FPS, FPS_LABEL, DECAY, FPS_DECAY_THRESHOLD;
var FILTER_BOUNDS = {};
var VIEW_STATE = {};


var camera_constraints =
{
  audio: false,
  video:
  {
    facingMode: "user",
    width: {ideal: 640, max: 1024},
    height: {ideal: 480, max: 1024},
    // frameRate: 30,
  }
}

function reset_frame_parameters (source=SOURCE)
{
  if (source.tagName == 'VIDEO')
  {
    FRAME_WIDTH = source.videoWidth;
    FRAME_HEIGHT = source.videoHeight;
  }
  else
  {
    FRAME_WIDTH = source.width;
    FRAME_HEIGHT = source.height;
  }

  document.querySelectorAll ('.sink').forEach (canvas => {
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
  });

  filter_size_changed = true;
}


function camera_error (error)
{
  console.error(`Couldn't access webcam.`, error);

  SOURCE.failed = true;
  SOURCE.classList.toggle ('hide', true);
  document.querySelector ('.wait_spinner').classList.toggle ('hide', true);

  var parent = document.querySelector('.content');
  var dim = get_min_dim (parent);
  var fraction = 0.618;

  camera_error.element = parent = add_div (parent);
  var style = {
    color: 'var(--pink)',
    width: fraction * dim + 'px',
    height: fraction * dim + 'px',
    fontSize: fraction * dim + 'px',
    lineHeight: fraction * dim + 'px',
    opacity: .33,
  };
  var element = add_div (parent, style);

  element.innerHTML = '&#9785;';
  element.classList.toggle ('fade_in_out_from', true);
  element.classList.toggle ('timing_linear', true);
  element.classList.toggle ('duration_750', true);

  var message = add_div (parent, {color: 'var(--pink)', fontSize: '1.5rem', lineHeight: '1.5rem', textAlign: 'center', opacity: .33});
  message.innerHTML = `<br>Couldn't access webcam.`;
  message.classList.toggle ('fade_in_out_from', true);
  message.classList.toggle ('timing_linear', true);
  message.classList.toggle ('duration_750', true);
}


function camera_init (mediaStream)
{
  window.stream = mediaStream;

  this.onloadedmetadata = function(e)
  {
    if (this.loaded)
      return;

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
    if (this.loaded)
      return;

    this.loaded = true;
    reset_frame_parameters (this);

    loaded ();
    console.log('image source loaded.')
  }
  SOURCE.src = SOURCE.src;
}


function video_source_init (callback)
{
  SOURCE.onloadeddata = function(e)
  {
    if (this.readyState < 2 || this.loaded)
      return;

    this.loaded = true;
    reset_frame_parameters ();

    loaded ();
    console.log('video source loaded.')
    if (callback)
      callback();
  };
  SOURCE.src = SOURCE.getAttribute('data_src');
}


function init ()
{
  SOURCE = document.querySelector('.source');
  SINK = document.querySelector('.sink').getContext('2d');

  heap_init ();
  options_init ();
  fps_init ();
  pyramids_init ();
  videomag_init ();
  blur_init ();

  var loading = document.querySelectorAll ('.loading');
  loading.forEach (e => e.classList.replace ('loading', 'fade_in'));
  spinner_init ();
  options_pane_init ();
  header_init ();
  setTimeout (() => loading.forEach (e => e.classList.toggle ('fade_in')), 1000);

  var delay_source_init = function ()
  {
    document.querySelectorAll ('.source_select > div')[INITIAL_SOURCE_INDEX].click ();
    window.removeEventListener ('scroll', delay_source_init, {passive: true});
  }

  window.addEventListener ('scroll', delay_source_init, {passive: true});

  if (!SOURCE.loaded && pageYOffset > 0)
  {
    delay_source_init ();
  }
}


function is_camera_source (source)
{
  if (source)
    return source.srcObject == null && source.getAttribute('data_src') == null;
}


function source_init (source=SOURCE, callback)
{
  if (source.loaded)
  {
    return;
  }

  switch (source.tagName)
  {
    case 'VIDEO':
      if (is_camera_source (source))
      {
        navigator.mediaDevices.getUserMedia (camera_constraints).
        then (camera_init.bind (source)).catch (camera_error).then (callback);
      }
      else
      {
        video_source_init (callback);
      }
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
      document.querySelector('.options_container').classList.toggle ('undocked', false);
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
