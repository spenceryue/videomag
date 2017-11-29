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
  img_copy (input, PYRAMID[0], width, height, false);

  adjust_gamma (PYRAMID[0], width, height, PYRAMID[0], gamma_correction);
  rgb_to (color_space, PYRAMID[0], width, height, PYRAMID[0]);

  build_pyramid (width, height, depth);
  iir_bandpass_filter_pyramid (width, height, depth);

  reconstruct_pyramid (width, height, depth);

  to_rgb (color_space, PYRAMID[0], width, height, PYRAMID[0]);
  adjust_gamma (PYRAMID[0], width, height, OUTPUT[0], 1 / gamma_correction);

  // if (gamma_correction != 1)

  // return new Uint8ClampedArray (PYRAMID[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? 255 : 0) : x));
  // return new Uint8ClampedArray (PYRAMID[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? x : 0) : x));
  // return new Uint8ClampedArray (PYRAMID[0].map((x,i)=> (i%4!=3) ? input[i]-x : x));

  return OUTPUT[0];
  // return new Uint8ClampedArray (pyramid[0]);
}


/*function magnify (input, width, height, depth, amplification_factor, minimum_wavelength, exaggeration)
{
  var alpha = amplification_factor;
  var lambda_c = minimum_wavelength;
  var minimum_delta = lambda_c / 8 / (1 + alpha);

  // representative wavelength of lowest level of pyramid.
  // "3 is experimental constant" -- comments from original authors' MATLAB code.
  var lambda = (width**2 + height**2)**0.5 / 3;

  for (let i=0; i < depth; i++)
  {
    let current_alpha;

    if (lambda < lambda_c)
      let current_alpha = lambda / 8 / minimum_delta - 1;
    // img_linear_combine (PYRAMID[i], lowerpass_pyramid[i], 1 - iir_decay_low, iir_decay_low, lowerpass_pyramid[i]);
  }
}*/
