'use strict';


var SOURCE, SINK;
var FRAME_WIDTH, FRAME_HEIGHT;
var FPS, FPS_LABEL, DECAY, FPS_DECAY_THRESHOLD;
var FRAME_BOUNDS = {};
var FILTER_BOUNDS = {};
var filter_on;
var use_fscs;
var show_pyramid;
var use_wasm;
var blur_size;
var filter_size;
var gamma_correction;
var f_low;
var f_high;
var color_space;
var blur_size_changed;
var filter_size_changed;


var defaults =
{
  'reflect_x': false,
  'hide_original': false,
  'filter_on': true,
  'use_fscs': true,
  'show_pyramid': true,
  'use_wasm': true,
  'blur_size': {min:1, max:50, step:2, value:5, print:(x => x + 'px')},
  'filter_size': {min:1, max:100, step:1, value:50, print:(x => x + '%')},
  'gamma_correction': {min:0, max:100, step:1, value:50, print:(x => calculate_gamma(x).toFixed(2))},
  'f_low': {min:0, max:15, step:.01, value:0.2, print:(x => x + 'Hz')},
  'f_high': {min:0, max:15, step:.01, value:3, print:(x => x + 'Hz')},
  'color_space': 'ycbcr',
};


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
    buffer_init ();
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
    buffer_init ();
    blur_init ();

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
      document.getElementsByName(name)[0].checked = (value) ? value : defaults[name];
      break;
    case 'range':
      if (!value)
      {
        let element = document.getElementsByName(name)[0];
        element.defaultValue = defaults[name].value;
        element.value = defaults[name].value;
        element.min = defaults[name].min;
        element.max = defaults[name].max;
        element.step = defaults[name].step;
        element.print = defaults[name].print;

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
      document.getElementsByName(name)[0].onchange = updater
      break;
    case 'range':
      document.getElementsByName(name)[0].oninput = updater;
      break;
    case 'radio':
      document.getElementsByName(name).forEach(element => element.onchange = updater);
      break;
  }
}


function checkbox_ui_init (checkbox_element)
{
  var element = checkbox_element;
  var parent = element.parentNode;

  parent.onclick = function (event)
  {
    if (event.target == element)
      return;

    element.checked = !element.checked;
    element.onchange();
  };
}


function range_ui_init (range_element)
{
  var element = range_element;
  var parent = element.parentNode;
  var label = parent.querySelector('label');
  var save = label.innerHTML;
  var [min, step, max] = [Number (element.min), Number (element.step), Number (element.max)];
  var print = (element.print) ? element.print : (x => x);
  var left, right, start, width, scale, offset;

  function handler (event)
  {
    var x = event.clientX + pageXOffset;
    if (x < left || x > right)
    {
      detach ();
      return;
    }

    var new_input = clamp (scale * x + offset, min, max);
    element.value = Math.round ((new_input - min) / step) * step + min;

    label.innerHTML = print (element.value);

    element.oninput();
  }

  function detach ()
  {
    document.body.removeEventListener ('mousemove', handler);
    label.innerHTML = save;
    element.classList.toggle ('input_focus');
  }

  parent.addEventListener ('mousedown', function (event)
  {
    left = parent.getBoundingClientRect().left + pageXOffset;
    right = left + parent.getBoundingClientRect().width;
    start = event.clientX + pageXOffset;
    width = element.getBoundingClientRect().width;
    scale = (Number(element.max) - Number(element.min)) / width;
    offset = -start * scale + Number(element.value);

    document.body.addEventListener('mousemove', handler);
    element.classList.toggle ('input_focus');
  });

  parent.addEventListener('mouseup', detach);

  element.onmousedown = event => event.preventDefault();
}


function radio_ui_init (radio_elements)
{
  var elements = Array.from (radio_elements);
  var parent = elements[0].parentNode;
  var length = elements.length;
  var current, element;

  parent.onclick = function (event)
  {
    if (event.target.type == 'radio')
      return;

    current = (elements.findIndex (e => e.checked) + 1) % length;
    element = elements[current];
    element.checked = true;
    element.onchange();
    element.classList.toggle ('input_focus');
  };
}


function custom_ui_init (name)
{
  var elements = document.getElementsByName(name);
  switch (elements[0].type)
  {
    case 'checkbox':
    {
      checkbox_ui_init (elements[0]);
      break;
    }
    case 'range':
    {
      range_ui_init (elements[0]);
      break;
    }
    case 'radio':
    {
      radio_ui_init (elements);
      break;
    }
  }
}


/* Disable full-scale contrast stretch option in RGB color space. */
function check_fscs ()
{
  check_fscs.element = document.getElementsByName('use_fscs')[0];
  check_fscs.element.disabled = color_space == 'rgb';
  if (check_fscs.element.disabled)
  {
    use_fscs = false;
    check_fscs.element.checked = false;
  }
}


function calculate_gamma (percent)
{
  return 2.2 ** ((percent - 50)/25);
}


function options_init ()
{
  for (let key in defaults)
  {
    set_option (key);
    custom_ui_init (key);
  }

  document.querySelector('.options_lock').addEventListener ('click', function () {
    this.classList.toggle ('options_lock_docked');
    this.parentNode.classList.toggle ('fade_in');
  });

  SINK.canvas.classList.toggle('reflect_x', get_option('reflect_x'));
  bind_option ('reflect_x', function () {
    document.querySelectorAll('canvas').forEach(e => e.classList.toggle ('reflect_x', this.checked));
  });

  SOURCE.classList.toggle('hide', get_option('hide_original'));
  bind_option ('hide_original', function () {
    SOURCE.classList.toggle ('hide', this.checked);
  });

  filter_on = defaults['filter_on'];
  bind_option ('filter_on', function () {
    filter_on = this.checked;
    if (!filter_on)
      remove_previous_pyramids();
  });

  use_fscs = defaults['use_fscs'];
  bind_option ('use_fscs', function () {
    use_fscs = this.checked;
  });

  show_pyramid = defaults['show_pyramid'];
  bind_option ('show_pyramid', function () {
    show_pyramid = this.checked;
    if (!show_pyramid)
      remove_previous_pyramids ();
  });

  use_wasm = defaults['use_wasm'];
  bind_option ('use_wasm', function () {
    use_wasm = this.checked;
  });

  blur_size = defaults['blur_size'].value;
  bind_option ('blur_size', function () {
    update_blur_size(Number(this.value));
  });
  blur_size_changed = true;

  filter_size = defaults['filter_size'].value;
  bind_option ('filter_size', function () {
    update_filter_size(Number(this.value));
  });
  filter_size_changed = true;

  f_low = defaults['f_low'].value;
  bind_option ('f_low', function () {
    f_low = Number(this.value);
  });

  f_high = defaults['f_high'].value;
  bind_option ('f_high', function () {
    f_high = Number(this.value);
  });

  gamma_correction = calculate_gamma (defaults['gamma_correction'].value);
  bind_option ('gamma_correction', function () {
    gamma_correction = calculate_gamma (Number(this.value));
  });

  color_space = defaults['color_space'];
  bind_option ('color_space', function () {
    color_space = this.value;
    check_fscs ();
  });
  check_fscs ();

  console.log('options initialized.')
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
      let filtered = filter (frame.data, width, height);
      SINK.putImageData (new ImageData(filtered, width, height), x, y);
    }
    else
    {
      let filtered = filter (frame.data, FRAME_WIDTH, FRAME_HEIGHT);
      SINK.putImageData (new ImageData(filtered, FRAME_WIDTH, FRAME_HEIGHT), 0, 0);
    }

    if (show_pyramid)
      display_pyramid();

    blur_size_changed = false;
    filter_size_changed = false;
  }
  else
    SINK.putImageData (frame, 0, 0);

  // if (++counter == 1)
    // throw 'one and done'

  update_frame_rate (timestamp - render.last);
  render.last = timestamp;
  requestAnimationFrame (render);
}
render.last = 0;
