'use strict';


var SOURCE, SINK;
var FRAME_WIDTH, FRAME_HEIGHT;
var FPS, FPS_LABEL, DECAY, FPS_DECAY_THRESHOLD;
var FRAME_BOUNDS = {};
var FILTER_BOUNDS = {};
var filter_on;
var blur_size;
var filter_size;
var buf0_color;
var buf1_color;
var use_fscs;


var defaults =
{
  'reflect_x': false,
  'hide_original': false,
  'filter_on': true,
  'use_fscs': true,
  'blur_size': {min:1, max:50, step:1, value:50},
  'filter_size': {min:1, max:100, step:'any', value:100},
  'buf0_color': 'rgb',
  'buf1_color': 'rgb',
};


var camera_constraints =
{
  audio: false,
  video:
  {
    facingMode: "user",
    // frameRate: 30,
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
    buffer_init ();
    loaded ();
    console.log('camera source loaded.')

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
    buffer_init ();
    loaded ();
    console.log('image source loaded.')

    requestAnimationFrame (render);
  }
  SOURCE.src = SOURCE.src;
}


function get_option (name)
{
  switch (document.getElementsByName(name)[0].type)
  {
    case 'checkbox':
      return document.getElementsByName(name)[0].checked;
    case 'range':
      return document.getElementsByName(name)[0].value;
    case 'radio':
      return document.getElementsByName(name).find(element => element.checked).value;
  }
}


function set_option (name, value)
{
  switch (document.getElementsByName(name)[0].type)
  {
    case 'checkbox':
      document.getElementsByName(name)[0].checked = value || defaults[name];
      break;
    case 'range':
      if (!value)
      {
        document.getElementsByName(name)[0].value = defaults[name].value;
        document.getElementsByName(name)[0].min = defaults[name].min;
        document.getElementsByName(name)[0].max = defaults[name].max;
        document.getElementsByName(name)[0].step = defaults[name].step;
      }
      else
        document.getElementsByName(name)[0].value = value;
      break;
    case 'radio':
      if (!value)
        value = defaults[name];
      document.getElementsByName(name).forEach(element => element.checked = element.value == value);
      break;
  }
}


function bind_option (name, updater)
{
  switch (document.getElementsByName(name)[0].type)
  {
    case 'checkbox':
    case 'range':
      document.getElementsByName(name)[0].onchange = updater;
      break;
    case 'radio':
      document.getElementsByName(name).forEach(element => element.onchange = updater);
  }
}


function options_init ()
{
  for (let key in defaults)
    set_option (key);

  SOURCE.classList.toggle('hide', get_option('hide_original'));
  bind_option ('hide_original', event => SOURCE.classList.toggle ('hide', event.srcElement.checked));

  SINK.canvas.classList.toggle('reflect_x', get_option('reflect_x'));
  bind_option ('reflect_x', event => SINK.canvas.classList.toggle ('reflect_x', event.srcElement.checked));

  filter_on = defaults['filter_on'];
  bind_option ('filter_on', event => filter_on = event.srcElement.checked);

  use_fscs = defaults['use_fscs'];
  bind_option ('use_fscs', event => use_fscs = event.srcElement.checked);

  blur_size = defaults['blur_size'].value;
  bind_option ('blur_size', event => update_blur_size(event.srcElement.value));
  blur_size_changed = true;

  filter_size = defaults['filter_size'].value;
  bind_option ('filter_size', event => update_filter_size(event.srcElement.value));
  filter_size_changed = true;

  buf0_color = defaults['buf0_color'];
  bind_option ('buf0_color', event => {
    if (event.srcElement.checked)
      buf0_color = event.srcElement.value;
  });

  buf1_color = defaults['buf1_color'];
  bind_option ('buf1_color', event => {
    if (event.srcElement.checked)
      buf1_color = event.srcElement.value;
  });

  console.log('options initialized.')
}


function init ()
{
  SOURCE = document.querySelector('.source');
  SINK = document.querySelector('.sink').getContext('2d');

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
  SOURCE.classList.toggle ('loading');
  SINK.canvas.classList.toggle ('loading');
}


function fps_init()
{
  FPS = 1;
  DECAY = 14/15;
  FPS_DECAY_THRESHOLD = 1000/5; // 5 fps => 1000/5 = 200 ms
  FPS_LABEL = document.querySelector('.fps');
  FPS_LABEL.innerHTML = FPS;
}


function update_frame_rate (delta)
{
  var save = FPS;
  if (delta > FPS_DECAY_THRESHOLD)
    FPS = 1000/delta;
  else
    FPS = DECAY * FPS + (1 - DECAY) * 1000/delta;

  if (Math.trunc (FPS*10)/10 - Math.trunc (save*10)/10 != 0)
    FPS_LABEL.innerHTML = Math.trunc (FPS*10)/10;
}


function render (timestamp)
{
  SINK.drawImage (SOURCE, 0, 0);
  var frame = SINK.getImageData (0, 0, FRAME_WIDTH, FRAME_HEIGHT);

  if (filter_on)
  {
    if (filter_size < 100)
    {
      SINK.putImageData (frame, 0, 0);
      if (filter_size_changed)
        set_filter_dims ();

      let width = FILTER_BOUNDS.width;
      let height = FILTER_BOUNDS.height;
      let x = FILTER_BOUNDS.x;
      let y = FILTER_BOUNDS.y;

      frame = SINK.getImageData (x, y, width, height);
      let filtered = filter (frame.data, width, height);
      SINK.putImageData (new ImageData(filtered, width, height), x, y);
    }
    else
    {
      let filtered = filter (frame.data, FRAME_WIDTH, FRAME_HEIGHT);
      SINK.putImageData (new ImageData(filtered, FRAME_WIDTH, FRAME_HEIGHT), 0, 0);
    }
  }
  else
    SINK.putImageData (frame, 0, 0);

  // if (render.last==0)
    // display_pyramid();

  update_frame_rate (timestamp - render.last);
  render.last = timestamp;
  requestAnimationFrame (render);
}
render.last = 0;


function get_canvas (width, height, x, y)
{
  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = parseInt(x) + 'px';
  canvas.style.top  = parseInt(y) + 'px';
  canvas.style.width = parseInt(width) + 'px';
  canvas.style.height = parseInt(height) + 'px';
  canvas.classList.toggle('debug_border');

  return canvas;
}


init();
