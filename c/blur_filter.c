#include "blur_filter.h"
#include "utils.h"

void row_corr_down (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int stride, float* kernel, int window)
{
  int pre = (window-1 + 1)/2;
  int post = (window-1)/2;

  for (int y=0; y < operate_height; y++)
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


void col_corr_down (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int stride, float* kernel, int window)
{
  int pre = (window-1 + 1)/2;
  int post = (window-1)/2;

  for (int y=0; y < operate_height; y+=stride)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * (y / stride) * out_width;

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
      else if (y >= operate_height - post)
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
          int input_idx = 4 * right_reflect (y + w, operate_height) * in_width + col_idx;
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


void row_corr_up (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int stride, float* kernel, int window)
{
  int pre = (window-1+1)/2;
  int post = (window-1)/2;

  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4*y*in_width;
    int output_row_ofs = 4*y*out_width;

    for (int x=0; x < in_width; x++)
    {
      int col_idx = 4*x;
      int input_base_idx = row_ofs + col_idx;


      for (int xx=x*stride; xx < (x+1)*stride; xx++)
      {
        int output_col_idx = 4*xx;
        int output_idx = output_row_ofs + output_col_idx;

        // just copy the edges for now
        if (xx < pre || xx >= stride*in_width - post)
        {
          if (xx%stride == 0)
          {
            output[output_idx + 0] = input[input_base_idx + 0];
            output[output_idx + 1] = input[input_base_idx + 1];
            output[output_idx + 2] = input[input_base_idx + 2];
          }
          else
          {
            output[output_idx + 0] = 0;
            output[output_idx + 1] = 0;
            output[output_idx + 2] = 0;
          }
        }
        // filter the center
        else
        {
          output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
          int kernel_ofs = ((xx + pre) % stride + stride) % stride;
          for (int w=-pre + kernel_ofs; w < post; w+=stride)
          {
            int block_ofs = 4*w;
            int input_idx = row_ofs + (output_col_idx + block_ofs)/stride; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


void col_corr_up (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int stride, float* kernel, int window)
{
  int pre = (window-1+1)/2;
  int post = (window-1)/2;

  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4*y*in_width;

    for (int x=0; x < in_width; x++)
    {
      int col_idx = 4*x;
      int input_base_idx = row_ofs + col_idx;
      int output_col_idx = col_idx;

      for (int yy=y*stride; yy < (y+1)*stride; yy++)
      {
        int output_row_ofs = 4*yy*out_width;
        int output_idx = output_row_ofs + output_col_idx;

        // just copy the edges for now
        if (yy < pre || yy >= stride*operate_height - post)
        {
          if (yy%stride == 0)
          {
            output[output_idx + 0] = input[input_base_idx + 0];
            output[output_idx + 1] = input[input_base_idx + 1];
            output[output_idx + 2] = input[input_base_idx + 2];
          }
          else
          {
            output[output_idx + 0] = 0;
            output[output_idx + 1] = 0;
            output[output_idx + 2] = 0;
          }
        }
        // filter the center
        else
        {
          output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
          int kernel_ofs = ((yy + pre) % stride + stride) % stride;
          for (int w=-pre + kernel_ofs; w < post; w+=stride)
          {
            int input_idx = 4*(yy + w)/stride*in_width + col_idx; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}
