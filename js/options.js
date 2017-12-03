'use strict';


var hide_original;
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
var filter_toggled;


var defaults =
{
  'reflect_x': false,
  'hide_original': false,
  'filter_on': true,
  'use_fscs': false,
  'show_pyramid': false,
  'use_wasm': true,
  'blur_size': {min:1, max:50, step:2, value:5, print:(x => x + 'px')},
  'filter_size': {min:1, max:100, step:1, value:50, print:(x => x + '%')},
  'gamma_correction': {min:0, max:100, step:1, value:50, print:(x => calculate_gamma(x).toFixed(2))},
  'f_low': {min:0, max:15, step:.01, value:0.4, print:(x => x + 'Hz')},
  'f_high': {min:0, max:15, step:.01, value:3, print:(x => x + 'Hz')},
  'color_space': 'ycbcr',
};


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


function update_filter_size (new_filter_size)
{
  filter_size = new_filter_size;
  filter_size_changed = true;
}


function set_filter_dims ()
{
  FILTER_BOUNDS.width = Math.floor (FRAME_WIDTH * filter_size / 100);
  FILTER_BOUNDS.height = Math.floor (FRAME_HEIGHT * filter_size / 100);
  FILTER_BOUNDS.x = Math.floor ((FRAME_WIDTH - FILTER_BOUNDS.width) / 2);
  FILTER_BOUNDS.y = Math.floor ((FRAME_HEIGHT - FILTER_BOUNDS.height) / 2);
}


function update_blur_size (new_blur_size)
{
  blur_size = new_blur_size;
  blur_size_changed = true;
}


function source_select_init ()
{
  let sources = document.querySelectorAll ('.source_select > div');
  let queued = [];
  let current = 0;

  sources.forEach ((element, i) => {
    let next = SOURCE.parentNode.children[i];

    if (i == current)
      element.classList.toggle ('selected');

    element.onclick = function () {
      var save = SOURCE;

      if (SOURCE == next)
        return;

      SOURCE = next;
      filter_on = false;

      sources[current].classList.toggle ('selected');
      element.classList.toggle ('selected');
      current = i;

      if (!hide_original)
      {
        detach (save);
        save.classList.toggle ('fade_out', true);

        next.classList.toggle ('fade_in', true);
        next.classList.toggle ('hide', false);
      }

      queued.push (() => {
        if (!hide_original)
        {
          save.classList.toggle ('hide', true);
          undo_detach (save);
          save.classList.toggle ('fade_out', false);

          next.classList.toggle ('fade_in', false);
        }

        if (next.loaded)
        {
          next.currentTime = 0;
          render.lastTime = -1;
          next.play ()
        }

        filter_on = true;
      });

      setTimeout (() => queued.shift()(), 1000);

      if (next.tagName == 'VIDEO' && !next.loaded)
        if (next.src === '' && next.srcObject == null)
          navigator.mediaDevices.getUserMedia(camera_constraints).
          then(camera_init.bind (next)).catch(camera_error);
        else
          video_source_init ();
      else
        reset_frame_parameters (next);
    }
  });
}


function options_init ()
{
  for (let key in defaults)
  {
    set_option (key);
    custom_ui_init (key);
  }

  window.onresize = reset_frame_parameters;

  if (is_mobile_or_tablet() || document.body.getBoundingClientRect().width > 825)
  {
    let element = document.querySelector('.options_lock');
    element.classList.toggle ('options_lock_docked');
    element.parentNode.classList.toggle ('fade_in');
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
    hide_original = this.checked;
  });

  filter_on = defaults['filter_on'];
  bind_option ('filter_on', function () {
    filter_on = this.checked;
    if (!filter_on)
      remove_previous_pyramids();
    filter_toggled = true;
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

  source_select_init ();

  console.log('options initialized.')
}
