'use strict';


var counter = 0;

var OutputTypedArray = Uint8ClampedArray;
var OUTPUT = Array(3);


function videomag_init ()
{
  var depth = max_pyramid_depth (FRAME_WIDTH, FRAME_HEIGHT, 1);

  for (let i=0; i < PYRAMIDS.length; i++)
    OUTPUT[i] = make_pyramid (FRAME_WIDTH, FRAME_HEIGHT, depth, OutputTypedArray);
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


function videomag (input, width, height)
{
  var depth = max_pyramid_depth (width, height, blur_size);

  if (blur_size_changed || filter_size_changed)
  {
    resize_all (PYRAMIDS, width, height, depth);
    resize_all (OUTPUT, width, height, depth);
    validate_pyramid_memory ()

    if (blur_size_changed)
    {
      kernel = get_blur_kernel (blur_size);
      validate_pyramid_memory ()
    }
  }

  input.width = width;
  input.height = height;
  img_copy (input, PYRAMID[0], width, height, false);

  adjust_gamma (PYRAMID[0], width, height, PYRAMID[0], gamma_correction);
  rgb_to (color_space, PYRAMID[0], width, height);

  build_pyramid (width, height, depth);
  iir_bandpass_filter_pyramid (width, height, depth);
  // console.log (lowerpass_pyramid[0].slice(0,12));
  // console.log (higherpass_pyramid[0].slice(0,12));
  // console.log (PYRAMID[0].slice(0,12));
  // magnify_iir (width, height, depth, 100, 50, 200);
  // console.log (PYRAMID[0].slice(0,12));

  if (!show_pyramid)
    reconstruct_pyramid (width, height, depth);

  // to_rgb (color_space, PYRAMID[0], width, height);
  // adjust_gamma (PYRAMID[0], width, height, OUTPUT[0], 1 / gamma_correction);
  // var test = lowerpass_pyramid[0];
  // var test = higherpass_pyramid[0];
  var test = PYRAMID[0];
  to_rgb (color_space, test, test.width, test.height);
  adjust_gamma (test, test.width, test.height, OUTPUT[0][0], 1 / gamma_correction);

  // if (gamma_correction != 1)

  // return new Uint8ClampedArray (OUTPUT[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? 255 : 0) : x));
  // return new Uint8ClampedArray (OUTPUT[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? x : 0) : x));
  // return new Uint8ClampedArray (OUTPUT[0].map((x,i)=> (i%4!=3) ? input[i]-x : x));
  // return new Uint8ClampedArray (lowerpass_pyramid[0].map((x,i)=> (i%4!=3) ? (higherpass_pyramid[i]-x) ? 255 : 0 : x));

  return OUTPUT[0][0];
}


function magnify_iir (width, height, depth, amplification_amount, minimum_wavelength, exaggeration=1)
{
  var alpha = amplification_amount; // (1 + amplification_amount) is the amplification factor
  var lambda_c = minimum_wavelength; // in pixels
  var max_delta = lambda_c / 8 / (1 + alpha);

  // representative wavelength of lowest level of pyramid.
  // "3 is experimental constant" -- comments from original authors' MATLAB code.
  var lambda = (width**2 + height**2)**0.5 / 3;

  for (let i=0; i < depth; i++)
  // "ignore the highest and lowest frequency band" -- comments from original authors' MATLAB code.
  {
    // "amplify each spatial frequency bands according to Figure 6 of our paper"
    // -- comments from original authors' MATLAB code.
    // Note: in the original code, when the ceiling alpha value is reached,
    // the exaggeration is NOT applied. I think this is a mistake, hence I
    // have applied exaggeration regardless (after the min() is applied).
    let current_alpha = Math.min (lambda / 8 / max_delta - 1, alpha) * exaggeration;
    // let current_alpha = alpha * exaggeration;
    /*let current_alpha = lambda / 8 / max_delta;
    if (current_alpha > alpha) current_alpha = alpha;
    else current_alpha *= exaggeration;*/

    img_linear_combine (higherpass_pyramid[i], lowerpass_pyramid[i], current_alpha, -current_alpha, TEMP_PYRAMID[i]);
    img_linear_combine (PYRAMID[i], TEMP_PYRAMID[i], 0, 1, PYRAMID[i]);


    lambda /= 2;
  }
}
