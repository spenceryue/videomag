'use strict';


var DCT_BUFFER = Array (2*30 + 1);
var DCT_BUFFER_list;
var DCT_COEFS = Array (2*30 + 1);
var DCT_COEFS_list;
var DCT_minimum_pyramid_level = 4 - 1;
// var IdealTypedArray = Float64Array;


/* Must happen after pyramid_init(). */
function ideal_init ()
{
  console.assert (DCT_BUFFER.length % 2 == 1);
  console.assert (DCT_BUFFER.length == DCT_COEFS.length);

  var [width, height] = [PYRAMID[DCT_minimum_pyramid_level].width, PYRAMID[DCT_minimum_pyramid_level].height];

  DCT_BUFFER_list = malloc (Uint32Array, DCT_BUFFER.length);
  for (let i=0; i < DCT_BUFFER.length; i++)
  {
    DCT_BUFFER[i] = img_fill_alpha (malloc (PyramidTypedArray, 4 * width * height), 255);
    DCT_BUFFER[i].width = width;
    DCT_BUFFER[i].height = height;
    DCT_BUFFER_list[i] = DCT_BUFFER[i].ptr;
  }

  DCT_COEFS_list = malloc (Uint32Array, DCT_COEFS.length);
  for (let i=0; i < DCT_COEFS.length; i++)
  {
    DCT_COEFS[i] = img_fill_alpha (malloc (PyramidTypedArray, 4 * width * height), 255);
    DCT_COEFS[i].width = width;
    DCT_COEFS[i].height = height;
    DCT_COEFS_list[i] = DCT_COEFS[i].ptr;
  }
}


function ideal_resize (level=use_pyramid_level)
{
  var save = ideal_ready.error;

  ideal_ready.error = (level < DCT_minimum_pyramid_level);
  if (ideal_ready.error)
  {
    if (save != ideal_ready.error)
      document.getElementsByName('filter_size')[0].parentNode.classList.toggle ('error');

    ideal_ready.frames_buffered = 0;
    return;
  }
  else
  {
    if (save != ideal_ready.error)
      document.getElementsByName('filter_size')[0].parentNode.classList.toggle ('error');
  }

  ideal_resize.current_level = level;

  var [width, height] = [PYRAMID[level].width, PYRAMID[level].height];

  for (let i=0; i < DCT_BUFFER.length; i++)
    DCT_BUFFER[i] = get_resized_array (DCT_BUFFER[i], width, height);

  for (let i=0; i < DCT_COEFS.length; i++)
    DCT_COEFS[i] = get_resized_array (DCT_COEFS[i], width, height);
}


function get_current_ideal_level ()
{
  return ideal_resize.current_level;
}


function ideal_filter_pyramid (output, depth)
{
  console.assert (!ideal_ready.error);

  var level = ideal_resize.current_level;
  reconstruct_pyramid (PYRAMID, depth, level);

  /* Shift oldest to newest in preparation of replacement. */
  DCT_BUFFER.push (DCT_BUFFER.shift ());

  if (filter_size_changed || blur_size_changed || filter_toggled || ideal_ready.frames_buffered == 0)
  {
    if (!ideal_filter_pyramid.waiter)
      ideal_filter_pyramid.waiter = play_wait_a_bit ();

    for (let i=0; i < DCT_COEFS.length; i++)
      img_fill (DCT_COEFS[i], 0);

    for (let i=0; i < DCT_BUFFER.length; i++)
      img_fill (DCT_BUFFER[i], 0);

    update_dct_buffer_and_coefficients (PYRAMID[level], DCT_BUFFER[DCT_BUFFER.length - 1]);
    ideal_ready.frames_buffered = 1;
  }
  else if (!ideal_ready ())
  {
    update_dct_buffer_and_coefficients (PYRAMID[level], DCT_BUFFER[DCT_BUFFER.length - 1]);
    ideal_ready.frames_buffered++;
    update_wait_a_bit ();
  }
  else
  {
    update_dct_buffer_and_coefficients (PYRAMID[level], DCT_BUFFER[DCT_BUFFER.length - 1]);
    if (ideal_filter_pyramid.waiter)
      stop_wait_a_bit ();
    idct_with_mask (output[level]);
  }
}


function play_wait_a_bit (appent_to=SINK.canvas.parentNode)
{
  var element = document.createElement ('div');
  var dim = Math.min (FILTER_BOUNDS.width, FILTER_BOUNDS.height);
  element.style.width = 0.618 * dim + 'px';
  element.style.height = 0.618 * dim + 'px';
  element.style.color = 'rgba(255,255,255,.382)';
  element.style.fontFamily = 'Varela Round';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.justifyContent = 'center';
  element.style.fontSize = '1rem';
  element.style.lineHeight = '1.5rem';
  element.style.filter = 'grayscale(100%) brightness(200%)';
  element.style.textAlign = 'center';
  update_wait_a_bit (element, 1);
  element.classList.toggle ('generic_spinner');
  element.classList.toggle ('center');
  appent_to.appendChild (element);

  return element;
}


function update_wait_a_bit (element=ideal_filter_pyramid.waiter, value=ideal_ready.frames_buffered)
{
  element.innerHTML = 'DCT buffering...<br>' + parseFloat(value/DCT_BUFFER.length * 100).toFixed(1) + '%';
}


function stop_wait_a_bit (element=ideal_filter_pyramid.waiter)
{
  if (!element)
    return;

  addClassFor (element, ['fade_out', 'duration_150'], 300);
  setTimeout (() => element.remove (), 300);

  if (element == ideal_filter_pyramid.waiter)
    ideal_filter_pyramid.waiter = null;
}


function ideal_ready ()
{
  return ideal_ready.frames_buffered >= DCT_BUFFER.length && !ideal_ready.error;
}
ideal_ready.frames_buffered = 0;
ideal_ready.error = false;


/* Candidate for js->C->WebAssembly conversion. */
function update_dct_buffer_and_coefficients (newest_frame, oldest_frame)
{
  console.assert (!ideal_ready.error);

  console.assert (newest_frame.width == oldest_frame.width);
  console.assert (newest_frame.height == oldest_frame.height);

  const [width, height] = [DCT_BUFFER[0].width, DCT_BUFFER[0].height];
  const N = DCT_COEFS.length;

  if (use_wasm && window.yesss)
  {
    _update_dct_buffer_and_coefficients (newest_frame.ptr, oldest_frame.ptr, DCT_BUFFER_list.ptr, DCT_COEFS_list.ptr, width, height, N);
    return;
  }


  console.assert ((N-1) % 2 == 0); // guaranteed divisible
  for (let i=0; i <= (N - 1) / 2; i++)
  {
    for (let y=0; y < height; y++)
    {
      const row_ofs = 4 * y * width;

      for (let x=0; x < width; x++)
      {
        const col_idx = 4 * x;
        const index = row_ofs + col_idx;
        console.assert (index + 3 < newest_frame.length);

        if (i == 0)
        {
          /*
            Update DC coefficient.
            new DC = (old DC) - oldest_frame + newest_frame
          */
          console.assert (index + 3 < DCT_COEFS[i].length);
          console.assert (index + 3 < oldest_frame.length);
          DCT_COEFS[i][index + 0] += -oldest_frame[index + 0] + newest_frame[index + 0];
          DCT_COEFS[i][index + 1] += -oldest_frame[index + 1] + newest_frame[index + 1];
          DCT_COEFS[i][index + 2] += -oldest_frame[index + 2] + newest_frame[index + 2];
        }
        else
        {
          /*
            Intermediate result:
            REAL = (previous real component) - oldest_frame + newest_frame
          */
          console.assert (index + 3 < oldest_frame.length);
          const REAL_0 = DCT_COEFS[i][index + 0] - oldest_frame[index + 0] + newest_frame[index + 0];
          const REAL_1 = DCT_COEFS[i][index + 1] - oldest_frame[index + 1] + newest_frame[index + 1];
          const REAL_2 = DCT_COEFS[i][index + 2] - oldest_frame[index + 2] + newest_frame[index + 2];

          const THETA = 2 * Math.PI * i / N;
          const [COS, SIN] = [Math.cos (THETA), Math.sin (THETA)];

          /*
            Update real component.
            new real component = cos(THETA) * REAL - sin(THETA) * (previous imaginary component)
          */
          console.assert (index + 3 < DCT_COEFS[i].length);
          DCT_COEFS[i][index + 0] = COS * REAL_0 - SIN * DCT_COEFS[N - i][index + 0];
          DCT_COEFS[i][index + 1] = COS * REAL_1 - SIN * DCT_COEFS[N - i][index + 1];
          DCT_COEFS[i][index + 2] = COS * REAL_2 - SIN * DCT_COEFS[N - i][index + 2];

          /*
            Update imaginary component.
            new imaginary component = sin(THETA) * REAL + cos(THETA) * (previous imaginary component)
          */
          console.assert (index + 3 < DCT_COEFS[N - i].length);
          DCT_COEFS[N - i][index + 0] = SIN * REAL_0 + COS * DCT_COEFS[N - i][index + 0];
          DCT_COEFS[N - i][index + 1] = SIN * REAL_1 + COS * DCT_COEFS[N - i][index + 1];
          DCT_COEFS[N - i][index + 2] = SIN * REAL_2 + COS * DCT_COEFS[N - i][index + 2];
        }

        if (i == (N - 1) / 2)
        {
          /* At this point also copy newest_frame to DCT_BUFFER. */
          console.assert (index + 3 < DCT_BUFFER[N - 1].length);
          DCT_BUFFER[N - 1][index + 0] = newest_frame[index + 0];
          DCT_BUFFER[N - 1][index + 1] = newest_frame[index + 1];
          DCT_BUFFER[N - 1][index + 2] = newest_frame[index + 2];
        }
      }
    }
  }
}


/* Candidate for js->C->WebAssembly conversion. */
function idct_with_mask (output, samples_ago=0, f_low_=f_low, f_high_=f_high)
{
  console.assert (!ideal_ready.error);

  const [operate_width, operate_height] = [DCT_BUFFER[0].width, DCT_BUFFER[0].height];
  const [in_width, out_width] = [DCT_COEFS[0].width, output.width];

  const N = DCT_COEFS.length;
  const [low, high] = [Math.max (Math.floor (f_low_ / FPS * N), 1), Math.min (Math.ceil (f_high_ / FPS * N), (N - 1) / 2)];
  const time_point = (N - 1) - samples_ago;

  for (let y=0; y < operate_height; y++)
  {
    const row_ofs = 4 * y * in_width;
    const output_row_ofs = 4 * y * out_width;

    for (let x=0; x < operate_width; x++)
    {
      const col_idx = 4 * x;
      const output_idx = output_row_ofs + col_idx;
      const input_idx = row_ofs + col_idx;

      console.assert (output_idx + 3 < output.length);
      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      for (let i=low; i <= high; i++)
      {
        console.assert (input_idx + 3 < DCT_COEFS[i].length);
        if (i == 0)
        {
          output[output_idx + 0] = DCT_COEFS[i][input_idx + 0];
          output[output_idx + 1] = DCT_COEFS[i][input_idx + 1];
          output[output_idx + 2] = DCT_COEFS[i][input_idx + 2];
        }
        else
        {
          const THETA = 2 * Math.PI * i * time_point / N;
          const [COS, SIN] = [2 * Math.cos (THETA), 2 * Math.sin (THETA)];

          /*
            output += 2 * cos(THETA) * (real component) - 2 * sin(THETA) * (imaginary component)
          */
          console.assert (input_idx + 3 < DCT_COEFS[N - i].length);
          output[output_idx + 0] += COS * DCT_COEFS[i][input_idx + 0] - SIN * DCT_COEFS[N - i][input_idx + 0];
          output[output_idx + 1] += COS * DCT_COEFS[i][input_idx + 1] - SIN * DCT_COEFS[N - i][input_idx + 1];
          output[output_idx + 2] += COS * DCT_COEFS[i][input_idx + 2] - SIN * DCT_COEFS[N - i][input_idx + 2];
        }
      }

      /* normalize */
      output[output_idx + 0] /= N;
      output[output_idx + 1] /= N;
      output[output_idx + 2] /= N;
    }
  }
}
