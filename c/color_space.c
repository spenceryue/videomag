#include "color_space.h"
#include "utils.h"
#include <math.h>


void rgb2ntsc (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT R = input[index + 0];
      FLOAT G = input[index + 1];
      FLOAT B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;
    }
  }
}


void rgb2ntsc_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
{
  FLOAT min = 255;
  FLOAT max = 0;

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT R = input[index + 0];
      FLOAT G = input[index + 1];
      FLOAT B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;

      FLOAT Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, OUT_LENGTH, min, max);
}


void ntsc2rgb (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT Y = input[index + 0];
      FLOAT I = input[index + 1];
      FLOAT Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


void ntsc2rgb_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
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

      FLOAT Y = input[index + 0];
      FLOAT I = input[index + 1];
      FLOAT Q = input[index + 2];

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
void rgb2ycbcr (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT R = input[index + 0];
      FLOAT G = input[index + 1];
      FLOAT B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B;
    }
  }
}


void ycbcr2rgb (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT Y = input[index + 0];
      FLOAT Cb = input[index + 1];
      FLOAT Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +                 +  1.402000 * Cr;
      output[index + 1] = 1.00000 * Y   + -0.344136 * Cb  + -0.714136 * Cr;
      output[index + 2] = 1.00000 * Y   +  1.772000 * Cb;
    }
  }
}


void rgb2ycbcr_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
{
  FLOAT min = 255;
  FLOAT max = 0;

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT R = input[index + 0];
      FLOAT G = input[index + 1];
      FLOAT B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B;

      FLOAT Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, OUT_LENGTH, min, max);
}


void ycbcr2rgb_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH)
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

      FLOAT Y = input[index + 0];
      FLOAT Cb = input[index + 1];
      FLOAT Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +                 +  1.402000 * Cr;
      output[index + 1] = 1.00000 * Y   + -0.344136 * Cb  + -0.714136 * Cr;
      output[index + 2] = 1.00000 * Y   +  1.772000 * Cb;
    }
  }
}


void adjust_gamma (FLOAT* input, int width, int height, FLOAT* output, FLOAT gamma, int IN_LENGTH, int OUT_LENGTH)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;

    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      ASSERT (index + 2 < IN_LENGTH, "index + 3: %d, IN_LENGTH: %d\n", index + 3, IN_LENGTH);
      ASSERT (index + 2 < OUT_LENGTH, "index + 3: %d, OUT_LENGTH: %d\n", index + 3, OUT_LENGTH);

      FLOAT Y = input[index + 0];
      FLOAT Cb = input[index + 1];
      FLOAT Cr = input[index + 2];

      output[index + 0] = 255 * pow(Y/255, gamma);
      output[index + 1] = 255 * pow(Cb/255, gamma);
      output[index + 2] = 255 * pow(Cr/255, gamma);
    }
  }
}
