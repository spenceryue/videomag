'use strict';


var DCT_BUFFER = Array (31);
var DCT_COEFS = Array (2); /* [0] = Real components, [1] = Imaginary components */
var DCT_minimum_depth;


function ideal_init (minimum_depth)
{
  console.assert (DCT_BUFFER.length % 2 == 1);
  DCT_minimum_depth = minimum_depth;

  var [width, height] = [PYRAMID[DCT_minimum_depth].width, PYRAMID[DCT_minimum_depth].height];

  for (let i=0; i < DCT_BUFFER.length; i++)
  {
    DCT_BUFFER[i] = fill_alpha (malloc (PyramidTypedArray, 4 * width * height), 255);
    DCT_BUFFER[i].width = width;
    DCT_BUFFER[i].height = height;
  }

  for (let i=0; i < DCT_COEFS.length; i++)
  {
    DCT_COEFS[i] = fill_alpha (malloc (PyramidTypedArray, 4 * width * height), 255);
    DCT_COEFS[i].width = width;
    DCT_COEFS[i].height = height;
  }
}


function ideal_resize (depth=DCT_minimum_depth)
{
  console.assert (depth >= DCT_minimum_depth);

  var [width, height] = [PYRAMID[depth].width, PYRAMID[depth].height];

  for (let i=0; i < DCT_BUFFER.length; i++)
    DCT_BUFFER[i] = get_resized_array (DCT_BUFFER[i], width, height);

  for (let i=0; i < DCT_COEFS.length; i++)
    DCT_COEFS[i] = get_resized_array (DCT_COEFS[i], width, height);
}


function ideal_filter_pyramid (output, depth=DCT_minimum_depth)
{
  DCT_BUFFER.push (DCT_BUFFER.shift ());

  if (filter_size_changed || blur_size_changed || filter_toggled)
  {
    img_copy (DCT_BUFFER[DCT_BUFFER.length - 1], PYRAMID[depth]);

    ideal_ready.frames_buffered = 0;
  }
  else if (!ideal_ready ())
  {
    img_copy (DCT_BUFFER[DCT_BUFFER.length - 1], PYRAMID[depth]);

    ideal_ready.frames_buffered++;
  }
  else
  {
    img_linear_combine (PYRAMID[i], lowerpass_pyramid[i], 1 - iir_decay_low, iir_decay_low, lowerpass_pyramid[i]);
    img_linear_combine (PYRAMID[i], higherpass_pyramid[i], 1 - iir_decay_high, iir_decay_high, higherpass_pyramid[i]);
    img_subtract (higherpass_pyramid[i], lowerpass_pyramid[i], output[i]);

    ideal_ready.frames_buffered++;
  }
}


function ideal_ready ()
{
  return ideal_ready.frames_buffered >= DCT_BUFFER.length;
}
ideal_ready.frames_buffered = 0;
