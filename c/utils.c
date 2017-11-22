#include "utils.h"
#include <stdbool.h>


void fill_alpha (float* input, int length, float value)
{
  for (int i=0; i < length; i+=4)
    input[i + 3] = value;
}


void full_scale_contrast_stretch (float* input, int length, float min, float max)
{
  if (min < 0 || max < 0)
  {
    min = 255;
    max = 0;
    for (int i=0; i < length; i+=4)
    {
      int value = input[i + 0];
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  float scale = 255 / (max - min);
  float offset = -min * scale;

  for (int i=0; i < length; i+=4)
    input[i + 0] = scale * input[i + 0] + offset;
}
