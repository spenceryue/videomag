#include "color_space.h"
#include "utils.h"

void rgb2ntsc (float* input, int width, int height, float* output)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;
    }
  }
}


void rgb2ntsc_fscs (float* input, int width, int height, float* output)
{
  float min = 255;
  float max = 0;

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;

      int Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, 4*width*height, min, max);
}


void ntsc2rgb (float* input, int width, int height, float* output)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      int Y = input[index + 0];
      int I = input[index + 1];
      int Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


void ntsc2rgb_fscs (float* input, int width, int height, float* output)
{
  full_scale_contrast_stretch (input, 4*width*height, -1, -1);

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      int Y = input[index + 0];
      int I = input[index + 1];
      int Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


/*
  JPEG variant: https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
  Original spec: http://www.itu.int/rec/T-REC-T.871-201105-I/en

  FSCS packed in as well (not much effect).
*/
void rgb2ycbcr (float* input, int width, int height, float* output)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B + 128;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B + 128;
    }
  }
}


void ycbcr2rgb (float* input, int width, int height, float* output)
{
  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      int Y = input[index + 0];
      int Cb = input[index + 1];
      int Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +             +  1.402000 * (Cr - 128);
      output[index + 1] = 1.00000 * Y   + -0.344136 * (Cb - 128)  + -0.714136 * (Cr - 128);
      output[index + 2] = 1.00000 * Y   +  1.772000 * (Cb - 128);
    }
  }
}


void rgb2ycbcr_fscs (float* input, int width, int height, float* output)
{
  float min = 255;
  float max = 0;

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      float R = input[index + 0];
      float G = input[index + 1];
      float B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B + 128;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B + 128;

      int Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, 4*width*height, min, max);
}


void ycbcr2rgb_fscs (float* input, int width, int height, float* output)
{
  full_scale_contrast_stretch (input, 4*width*height, -1, -1);

  for (int y=0; y < height; y++)
  {
    int row_ofs = 4 * y * width;
    for (int x=0; x < width; x++)
    {
      int index = row_ofs + 4 * x;
      int Y = input[index + 0];
      int Cb = input[index + 1];
      int Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +             +  1.402000 * (Cr - 128);
      output[index + 1] = 1.00000 * Y   + -0.344136 * (Cb - 128)  + -0.714136 * (Cr - 128);
      output[index + 2] = 1.00000 * Y   +  1.772000 * (Cb - 128);
    }
  }
}
