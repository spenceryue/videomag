'use strict';


var counter = 0;

var OutputTypedArray = Uint8ClampedArray;
var OUTPUT;


function videomag_init ()
{
  var depth = max_pyramid_depth (FRAME_WIDTH, FRAME_HEIGHT, 1);
  OUTPUT = make_pyramid (FRAME_WIDTH, FRAME_HEIGHT, depth, OutputTypedArray);
}


function videomag (input, width, height)
{
  var depth = max_pyramid_depth (width, height, blur_size);

  if (blur_size_changed || filter_size_changed)
  {
    resize_all (PYRAMIDS, width, height, depth);
    resize_pyramid (OUTPUT, width, height, depth);
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
  magnify_iir (width, height, depth, 100, 16, 20);
  // console.log (PYRAMID[0].slice(0,12));

  reconstruct_pyramid (width, height, depth);

  // to_rgb (color_space, PYRAMID[0], width, height);
  // adjust_gamma (PYRAMID[0], width, height, OUTPUT[0], 1 / gamma_correction);
  var test = higherpass_pyramid[0];
  to_rgb (color_space, test, test.width, test.height, test);
  adjust_gamma (test, test.width, test.height, OUTPUT[0], 1 / gamma_correction);

  // if (gamma_correction != 1)

  // return new Uint8ClampedArray (PYRAMID[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? 255 : 0) : x));
  // return new Uint8ClampedArray (PYRAMID[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? x : 0) : x));
  // return new Uint8ClampedArray (PYRAMID[0].map((x,i)=> (i%4!=3) ? input[i]-x : x));

  return OUTPUT[0];
  // return new Uint8ClampedArray (pyramid[0]);
}


function magnify_iir (width, height, depth, amplification_amount, minimum_wavelength, exaggeration=1)
{
  var alpha = amplification_amount; // (1 + amplification_amount) is the amplification factor
  var lambda_c = minimum_wavelength; // in pixels
  var max_delta = lambda_c / 8 / (1 + alpha);

  // representative wavelength of lowest level of pyramid.
  // "3 is experimental constant" -- comments from original authors' MATLAB code.
  var lambda = (width**2 + height**2)**0.5 / 3;

  for (let i=1; i < depth-1; i++)
  // "ignore the highest and lowest frequency band" -- comments from original authors' MATLAB code.
  {
    // "amplify each spatial frequency bands according to Figure 6 of our paper"
    // -- comments from original authors' MATLAB code.
    // Note: in the original code, when the ceiling alpha value is reached,
    // the exaggeration is NOT applied. I think this is a mistake, hence I
    // have applied exaggeration regardless (after the min() is applied).
    let current_alpha = Math.min (lambda / 8 / max_delta - 1, alpha) * exaggeration;
    /*let current_alpha = lambda / 8 / max_delta;
    if (current_alpha > alpha) current_alpha = alpha;
    else current_alpha *= exaggeration;*/

    img_linear_combine (higherpass_pyramid[i], lowerpass_pyramid[i], current_alpha, -current_alpha, TEMP_PYRAMID[i]);
    img_linear_combine (PYRAMID[i], TEMP_PYRAMID[i], 1, 1, PYRAMID[i]);


    lambda /= 2;
  }
}
