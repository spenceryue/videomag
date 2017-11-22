#include "blur_filter.h"
#include "utils.h"

void row_corr_down (float* input, int in_width, int in_height, float* output, int out_width, int stride, float* kernel, int window)
{
  int pre = (window-1 + 1)/2;
  int post = (window-1)/2;

  for (int y=0; y < in_height; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < in_width; x+=stride)
    {
      int col_idx = 4 * x;
      int output_col_idx = (col_idx / stride);
      int output_idx = output_row_ofs + output_col_idx;
      int input_base_idx = row_ofs + col_idx;

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (x < pre)
      {
        for (int w=-pre; w <= 0; w++)
        {
          int input_idx = row_ofs + 4 * left_reflect (x + w, 0);
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int block_ofs = 4 * w;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // right edge
      else if (x >= in_width - post)
      {
        for (int w=-pre; w <= 0; w++)
        {
          int block_ofs = 4 * w;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int input_idx = row_ofs + 4 * right_reflect (x + w, in_width);
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // center
      else
      {
        for (int w=-pre; w <= post; w++)
        {
          int block_ofs = 4 * w;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


void col_corr_down (float* input, int in_width, int in_height, float* output, int out_width, int stride, float* kernel, int window)
{
  int pre = (window-1 + 1)/2;
  int post = (window-1)/2;

  for (int y=0; y < in_height; y+=stride)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * out_width;
    int floor = y / stride;
    output_row_ofs *= floor;

    for (int x=0; x < in_width; x++)
    {
      int col_idx = 4 * x;
      int output_idx = output_row_ofs + col_idx;
      int input_base_idx = row_ofs + col_idx;

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (y < pre)
      {
        for (int w=-pre; w <= 0; w++)
        {
          int input_idx = 4 * left_reflect (y + w, 0) * in_width + col_idx;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int block_ofs = 4 * w * in_width;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // right edge
      else if (y >= in_height - post)
      {
        for (int w=-pre; w <= 0; w++)
        {
          int block_ofs = 4 * w * in_width;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int input_idx = 4 * right_reflect (y + w, in_height) * in_width + col_idx;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // center
      else
      {
        for (int w=-pre; w <= post; w++)
        {
          int block_ofs = 4 * w * in_width;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}
