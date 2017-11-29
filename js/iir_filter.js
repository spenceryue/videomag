'use strict';


var lowerpass_pyramid;
var higherpass_pyramid;

var iir_decay_low;
var iir_decay_high;


function iir_init ()
{
  lowerpass_pyramid = PYRAMIDS[2];
  higherpass_pyramid = PYRAMIDS[2];
}


function get_iir_decay (cutoff_frequency, sampling_time, use_exponential=true)
{
  var time_constant = 1 / (2 * Math.PI * cutoff_frequency);

  if (use_exponential)
    return 1 - Math.exp (- sampling_time / time_constant);
  else
    return 1 - time_constant / (sampling_time + time_constant);
}


function update_iir_decays (fps_=FPS, f_low_=f_low, f_high_=f_high, use_exponential=true)
{
  iir_decay_low = get_iir_decay (f_low, 1/fps_, use_exponential);
  iir_decay_high = get_iir_decay (f_high, 1/fps_, use_exponential);
}


function iir_bandpass_filter_pyramid (width, height, depth)
{
  for (let i=depth-1; i >= 1; i--)
  {
    // lowerpass_pyramid = (1 - iir_weight_low) * PYRAMID + iir_decay_low * lowerpass_pyramid
    img_linear_combine (PYRAMID[i], lowerpass_pyramid[i], 1 - iir_decay_low, iir_decay_low, lowerpass_pyramid[i]);

    // higherpass_pyramid = (1 - iir_weight_high) * PYRAMID + iir_decay_high * higherpass_pyramid
    img_linear_combine (PYRAMID[i], higherpass_pyramid[i], 1 - iir_decay_low, iir_decay_high, higherpass_pyramid[i]);
  }
}
