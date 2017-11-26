#include "color_space.h"
#include "utils.h"
#include <math.h>


void rgb2ntsc (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;
    }
  }
}


void rgb2ntsc_fscs (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  float min = 255;
  float max = 0;

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;

      float Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, OUT_LENGTH, min, max);
}


void ntsc2rgb (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float Y = input[index + 0];
      float I = input[index + 1];
      float Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


void ntsc2rgb_fscs (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  full_scale_contrast_stretch (input, IN_LENGTH, -1, -1);

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float Y = input[index + 0];
      float I = input[index + 1];
      float Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


/*
  JPEG variant: https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
  Original spec: http://www.itu.int/rec/T-REC-T.871-201105-I/en

  Note: The +/- 128 offsets are not included due to complications
  with the scale when applying the blur filter.
*/
void rgb2ycbcr (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B;
    }
  }
}


void ycbcr2rgb (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float Y = input[index + 0];
      float Cb = input[index + 1];
      float Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +                 +  1.402000 * Cr;
      output[index + 1] = 1.00000 * Y   + -0.344136 * Cb  + -0.714136 * Cr;
      output[index + 2] = 1.00000 * Y   +  1.772000 * Cb;
    }
  }
}


void rgb2ycbcr_fscs (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  float min = 255;
  float max = 0;

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B;

      float Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, OUT_LENGTH, min, max);
}


void ycbcr2rgb_fscs (float* input, int width, int height, float* output, int IN_LENGTH, int OUT_LENGTH)
{
  full_scale_contrast_stretch (input, IN_LENGTH, -1, -1);

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float Y = input[index + 0];
      float Cb = input[index + 1];
      float Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +                 +  1.402000 * Cr;
      output[index + 1] = 1.00000 * Y   + -0.344136 * Cb  + -0.714136 * Cr;
      output[index + 2] = 1.00000 * Y   +  1.772000 * Cb;
    }
  }
}


void adjust_gamma (float* input, int width, int height, float* output, float gamma, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      float Y = input[index + 0];
      float Cb = input[index + 1];
      float Cr = input[index + 2];

      output[index + 0] = 255 * pow(Y/255, gamma);
      output[index + 1] = 255 * pow(Cb/255, gamma);
      output[index + 2] = 255 * pow(Cr/255, gamma);
    }
  }
}
