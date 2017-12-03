'use strict';


var lowerpass_pyramid;
var higherpass_pyramid;

var iir_decay_low;
var iir_decay_high;


function iir_init ()
{
  lowerpass_pyramid = PYRAMIDS[2];
  higherpass_pyramid = PYRAMIDS[3];
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

  console.assert (0 <= iir_decay_low && iir_decay_low <= 1);
  console.assert (0 <= iir_decay_high && iir_decay_high <= 1);
}


function iir_bandpass_filter_pyramid (width, height, depth)
{
  update_iir_decays ();

  for (let i=1; i < depth-1; i++)
  // "ignore the highest and lowest frequency band" -- comments from original authors' MATLAB code.
  {
    if (filter_size_changed || blur_size_changed || filter_toggled)
    {
      img_copy (PYRAMID[i], lowerpass_pyramid[i]);
      img_copy (PYRAMID[i], higherpass_pyramid[i]);
    }
    else
    {
      img_linear_combine (PYRAMID[i], lowerpass_pyramid[i], 1 - iir_decay_low, iir_decay_low, lowerpass_pyramid[i]);
      img_linear_combine (PYRAMID[i], higherpass_pyramid[i], 1 - iir_decay_high, iir_decay_high, higherpass_pyramid[i]);
    }
    // console.log (PYRAMID[i], higherpass_pyramid[i], lowerpass_pyramid[i])
  }
}
