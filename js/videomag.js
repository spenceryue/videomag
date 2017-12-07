'use strict';


var counter = 0;

var OutputTypedArray = Uint8ClampedArray;
var OUTPUT = Array(3);


function videomag_init ()
{
  var depth = max_pyramid_depth (pyramids_init.max_width, pyramids_init.max_height, 1);

  for (let i=0; i < PYRAMIDS.length; i++)
    OUTPUT[i] = make_pyramid (pyramids_init.max_width, pyramids_init.max_height, depth, OutputTypedArray);
}


function update_frame_rate (delta)
{
  var save = FPS;
  DECAY = get_iir_decay (1/4, delta/1000);
  if (delta > FPS_DECAY_THRESHOLD)
    FPS = 1000/delta;
  else
    FPS = DECAY * FPS + (1 - DECAY) * 1000/delta;

  if (Math.trunc (FPS*10)/10 - Math.trunc (save*10)/10 != 0)
    FPS_LABEL.innerHTML = parseFloat(FPS).toFixed(1);
}


function play_loop_notification (appent_to)
{
  var element = document.createElement ('div');
  element.innerHTML = '<i class="fa fa-undo" aria-hidden="true"></i>';
  element.style.width = '25vw';
  element.style.height = '25vw';
  element.style.fontSize = '25vw';
  element.style.color = 'rgba(255,255,255,.618)';
  element.style.opacity = 1;
  element.classList.toggle ('center');
  element.style.animation = '1s ease-out both fade_out';
  appent_to.appendChild (element);
  setTimeout (() => element.remove (), 2000);
}


function render (timestamp)
{
  SINK.drawImage (SOURCE, 0, 0);

  if (SOURCE.paused || !show_filtered || (SOURCE.currentTime == render.lastTime && SOURCE.src != ''))
  {
    if (!SOURCE.paused && show_filtered)
      console.log ('skipping render')

    if (show_pyramid)
      remove_previous_pyramids ();

    render.lastTime = SOURCE.currentTime;
    update_frame_rate (timestamp - render.last);
    render.last = timestamp;

    render.id = requestAnimationFrame (render);
    return;
  }

  if (SOURCE.currentTime < render.lastTime)
  {
    if (show_filtered)
      play_loop_notification (SINK.canvas.parentNode);
    if (show_original)
      play_loop_notification (SOURCE.parentNode);
    filter_toggled = true;
  }

  if (filter_size_changed)
  {
    set_filter_dims ();
    update_use_pyramid_level ();
  }

  if (filter_size < 100)
  {
    window.width = FILTER_BOUNDS.width;
    window.height = FILTER_BOUNDS.height;
    let x = FILTER_BOUNDS.x;
    let y = FILTER_BOUNDS.y;

    let frame = SINK.getImageData (x, y, width, height);
    window.processed = videomag (frame.data, width, height);
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

  /*if (++counter == 1)
    throw 'one and done'*/

  render.lastTime = SOURCE.currentTime;
  update_frame_rate (timestamp - render.last);
  render.last = timestamp;

  render.id = requestAnimationFrame (render);
}
render.last = 0;
render.lastTime = 0;


function videomag (input, width, height)
{
  var depth = max_pyramid_depth (width, height, blur_size);

  if (!depth)
    return input;

  if (blur_size_changed || filter_size_changed)
  {
    resize_all (PYRAMIDS, width, height, depth);
    ideal_resize ();
    resize_all (OUTPUT, width, height, depth);
    validate_pyramid_memory ();

    if (blur_size_changed)
    {
      kernel = get_blur_kernel (blur_size);
      validate_pyramid_memory ();
    }
  }

  input.width = width;
  input.height = height;
  img_copy (input, PYRAMID[0], width, height, false);

  adjust_gamma (PYRAMID[0], width, height, PYRAMID[0], gamma_correction);
  rgb_to (color_space, PYRAMID[0], width, height);

  build_pyramid (width, height, depth);

  if (time_filter == 'iir')
  {
    iir_bandpass_filter_pyramid (TEMP_PYRAMID, depth);
    if (iir_ready ())
      magnify_iir (TEMP_PYRAMID, width, height, depth);
  }
  else if (time_filter == 'ideal' && !ideal_ready.error)
  {
    ideal_filter_pyramid (TEMP_PYRAMID, depth);
    depth = get_current_ideal_level() + 1;

    if (ideal_ready ())
      magnify_ideal (TEMP_PYRAMID);
  }

  if (!show_pyramid)
    reconstruct_pyramid (PYRAMID, depth);

  to_rgb (color_space, PYRAMID[0], width, height);
  adjust_gamma (PYRAMID[0], width, height, OUTPUT[0][0], 1 / gamma_correction);

  // return new Uint8ClampedArray (OUTPUT[0][0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? 255 : 0) : x));
  // return new Uint8ClampedArray (OUTPUT[0][0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? x : 0) : x));
  // return new Uint8ClampedArray (OUTPUT[0][0].map((x,i)=> (i%4!=3) ? input[i]-x : x));
  // return new Uint8ClampedArray (lowerpass_pyramid[0].map((x,i)=> (i%4!=3) ? (higherpass_pyramid[i]-x) ? 255 : 0 : x));

  return OUTPUT[0][0];
}


function magnify_iir (time_filtered_input, width, height, depth)
{
  var alpha = amplification_factor - 1;
  var lambda_c = minimum_wavelength; /* in pixels */
  var max_delta = lambda_c / 8 / (1 + alpha); /* max_delta is the maximum allowed phase difference in pixels */

  // representative wavelength of lowest level of pyramid.
  // "3 is experimental constant"
  /* -- comments from original authors' MATLAB code. */
  var lambda = (width**2 + height**2)**0.5 / 3;
  lambda /= 2; /* adjustment for skipping first level */

  for (let i=1; i < depth-1; i++)
  // "ignore the highest and lowest frequency band" -- comments from original authors' MATLAB code.
  {
    // "amplify each spatial frequency bands according to Figure 6 of our paper"
    /* -- comments from original authors' MATLAB code. */
    let current_alpha = lambda / 8 / max_delta - 1;
    if (current_alpha > alpha) current_alpha = alpha;
    else current_alpha *= exaggeration;

    /* PYRAMID[i] = PYRAMID[i] * 1 + time_filtered_input[i] * current_alpha (with chrominance attenuated). */
    img_linear_combine_chroma_attenuate (PYRAMID[i], time_filtered_input[i], 1, current_alpha, chroma_attenuation/100, PYRAMID[i]);

    lambda /= 2;
  }
}


function magnify_ideal (time_filtered_input)
{
  var alpha = amplification_factor - 1;
  var level = get_current_ideal_level ();

  console.assert (ideal_ready ());

  /*
    PYRAMID[level] = PYRAMID[level] * 1 + time_filtered_input[level] * alpha (with chrominance attenuated).
  */
  img_linear_combine_chroma_attenuate (PYRAMID[level], time_filtered_input[level], 1, alpha, chroma_attenuation/100, PYRAMID[level]);
}
