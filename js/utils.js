'use strict';


function fill_alpha (input, value)
{
  for (let i=0; i < input.length; i+=4)
    input[i + 3] = value;

  return input;
}


function next_multiple (x, m)
{
  return x + (m - x % m) % m;
}


function full_scale_contrast_stretch (input, min, max)
{
  if (min == undefined || max == undefined)
  {
    min = 255;
    max = 0;
    for (let i=0; i < input.length; i+=4)
    {
      let value = input[i + 0];
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  var scale = 255 / (max - min);
  var offset = -min * scale;

  for (let i=0; i < input.length; i+=4)
    input[i + 0] = scale * input[i + 0] + offset;

  return input;
}
