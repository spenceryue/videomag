'use strict';


var show_original;
var show_filtered;
var use_fscs;
var show_pyramid;
var use_wasm;
var blur_size;
var filter_size;
var gamma_correction;
var exaggeration;
var chroma_attenuation;
var use_pyramid_level;
var f_low;
var f_high;
var amplification_factor;
var minimum_wavelength;
var color_space;
var time_filter;
var blur_size_changed;
var filter_size_changed;
var filter_toggled;


var defaults =
{
  'reflect_x': false,
  'show_original': true,
  'show_filtered': true,
  'use_fscs': false,
  'show_pyramid': false,
  'use_wasm': true,
  'blur_size': {min:1, max:50, step:2, value:5, print:(x => x + 'px')},
  'filter_size': {min:1, max:100, step:1, value:50, print:(x => x + '% of frame')},
  'gamma_correction': {min:0, max:100, step:1, value:50, print:(x => 'to the ' + calculate_gamma(x).toFixed(2) + ' power')},
  'exaggeration': {min:1, max:10, step:1, value:2, print:(x => x + 'x')},
  'chroma_attenuation': {min:0, max:100, step:1, value:10, print:(x => x + '%')},
  'use_pyramid_level': {min:0, max:9, step:1, value:6, print:(x => 'level ' + x)},
  'f_low': {min:0, max:15, step:.01, value:0.4},
  'f_high': {min:0, max:15, step:.01, value:3},
  'amplification_factor': {min:1, max:151, step:1, value:10},
  'minimum_wavelength': {min:0, max:100, step:1, value:16},
  'color_space': 'ycbcr',
  'time_filter': 'iir',
};


var recommended = {
  'baby.mp4': {
    'amplification_factor': 10,
    'minimum_wavelength': 16,
    'f_low': .4,
    'f_high': 3,
    'exaggeration': 2,
    'chroma_attenuation': 10,
    'time_filter': 'iir',
  },
  'baby2.mp4': {
    'amplification_factor': 150,
    'use_pyramid_level': 6,
    'f_low': Math.round(140/60/.01)*.01,
    'f_high': Math.round(160/60/.01)*.01,
    'chroma_attenuation': 100,
    'time_filter': 'ideal',
  },
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
    case 'number':
      return document.getElementsByName(name)[0].value;
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
    case 'number':
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
    case 'number':
      document.getElementsByName(name)[0].onchange = updater
      break;
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


function use_recomended_settings (source_selected)
{
  var settings = recommended[source_selected];
  Object.assign(window, settings);

  for (let each in settings)
  {
    set_option (each, settings[each]);
    addClassFor (document.getElementsByName (each)[0].parentNode, ['white_bg_inv_phi', 'black'], 500);
    addClassFor (document.getElementsByName (each)[0].parentNode, ['ease_500'], 1000);
  }
}


function source_select_init ()
{
  let sources = document.querySelectorAll ('.source_select > div');
  let queued = [];
  let queued_set = new Set ();
  let current = 0;

  let consume_next = () => {
    let f = queued.shift();
    if (f)
      f();
  };

  sources.forEach ((element, i) => {
    let next = SOURCE.parentNode.children[i];

    if (i == current)
      element.classList.toggle ('selected');

    element.onclick = function () {
      var save = SOURCE;
      var save_show_filtered = show_filtered;

      if (SOURCE == next)
        return;
      else if (queued_set.has (next))
      {
        while (queued_set.has (next))
          consume_next();
      }
      else{
        console.log (queued)
        queued_set.add (save);
      }

      SOURCE = next;
      show_filtered = false;

      sources[current].classList.toggle ('selected');
      element.classList.toggle ('selected');
      current = i;

      if (show_original)
      {
        detach (save);
        save.classList.toggle ('fade_out', true);

        next.classList.toggle ('fade_in', true);
        next.classList.toggle ('hide', false);
      }

      use_recomended_settings (next.src.split ('/').slice (-1));
      queued.push (() => {
        if (show_original)
        {
          save.classList.toggle ('hide', true);
          undo_detach (save);
          save.classList.toggle ('fade_out', false);

          next.classList.toggle ('fade_in', false);
        }

        if (next.loaded)
        {
          render.lastTime = next.currentTime;
          next.play ();
        }

        show_filtered = save_show_filtered;
        queued_set.delete (save);
      });

      if (next.tagName == 'VIDEO' && !next.loaded)
        if (next.src === '' && next.srcObject == null)
          navigator.mediaDevices.getUserMedia(camera_constraints).
          then(camera_init.bind (next)).catch(camera_error).then(consume_next);
        else
          video_source_init (consume_next);
      else
      {
        reset_frame_parameters (next);
        setTimeout (consume_next, 330);
      }

      remove_previous_pyramids ();
    }
  });
}


function options_lock_init ()
{
  document.querySelector('.options_lock').addEventListener ('click', function () {
    this.classList.toggle ('docked');
    document.querySelector('.options').classList.toggle ('docked');
    document.querySelector('.options').classList.toggle ('undocked');
    document.querySelector('.options_container').classList.toggle ('undocked');
  });

  document.querySelector('.options_lock').addEventListener ('mouseover', function () {
    if (this.classList.contains('docked'))
      this.children[0].classList.replace ('fa-cog', 'fa-arrow-right');
    else
      this.children[0].classList.replace ('fa-cog', 'fa-arrow-left');
  });

  document.querySelector('.options_lock').addEventListener ('mouseout', function () {
    this.children[0].classList.replace ('fa-arrow-left', 'fa-cog');
    this.children[0].classList.replace ('fa-arrow-right', 'fa-cog');
  });
}


function check_time_filter (value)
{
  if (value == 'iir')
  {
    document.getElementsByName('exaggeration')[0].disabled = false;
    document.getElementsByName('minimum_wavelength')[0].disabled = false;
    document.getElementsByName('use_pyramid_level')[0].disabled = true;
  }
  else if (value == 'ideal')
  {
    document.getElementsByName('exaggeration')[0].disabled = true;
    document.getElementsByName('minimum_wavelength')[0].disabled = true;
    document.getElementsByName('use_pyramid_level')[0].disabled = false;
  }
}


function check_double ()
{
  var double = (show_original + show_filtered == 1);
  document.querySelectorAll ('.source').forEach ((each) => each.classList.toggle ('double', double));
  SINK.canvas.classList.toggle ('double', double);
}


function options_init ()
{
  for (let key in defaults)
  {
    set_option (key);
    custom_ui_init (key);
  }

  window.addEventListener ('resize', () => reset_frame_parameters());

  options_lock_init ();

  SINK.canvas.classList.toggle('reflect_x', get_option('reflect_x'));
  bind_option ('reflect_x', function () {
    document.querySelectorAll('canvas').forEach(e => e.classList.toggle ('reflect_x', this.checked));
  });

  show_original = defaults['show_original'];
  bind_option ('show_original', function () {
    SOURCE.classList.toggle ('hide', !this.checked);
    show_original = this.checked;

    check_double ();
  });
  SOURCE.classList.toggle('hide', !show_original);

  show_filtered = defaults['show_filtered'];
  bind_option ('show_filtered', function () {
    SINK.canvas.classList.toggle ('hide', !this.checked);
    show_filtered = this.checked;
    if (!show_filtered)
      remove_previous_pyramids();
    filter_toggled = true;

    check_double ();
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

  exaggeration = defaults['exaggeration'].value;
  bind_option ('exaggeration', function () {
    exaggeration = Number(this.value);
  });

  chroma_attenuation = defaults['chroma_attenuation'].value;
  bind_option ('chroma_attenuation', function () {
    chroma_attenuation = Number(this.value);
  });

  use_pyramid_level = defaults['use_pyramid_level'].value;
  bind_option ('use_pyramid_level', function () {
    use_pyramid_level = Number(this.value);
  });

  amplification_factor = defaults['amplification_factor'].value;
  bind_option ('amplification_factor', function () {
    amplification_factor = Number(this.value);
  });

  minimum_wavelength = defaults['minimum_wavelength'].value;
  bind_option ('minimum_wavelength', function () {
    minimum_wavelength = Number(this.value);
  });

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
  });

  time_filter = defaults['time_filter'];
  bind_option ('time_filter', function () {
    time_filter = this.value;
    filter_toggled = true;
    check_time_filter (this.value);
  });
  check_time_filter (time_filter)

  source_select_init ();

  console.log('options initialized.')
}
