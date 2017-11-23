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
  int pre = (window-1 + 1)/2;
  int post = (window-1)/2;

  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4*y*in_width;
    int output_row_ofs = 4*y*out_width;

    for (int x=0; x < operate_width; x++)
    {
      for (int xx=x*stride; xx < (x+1)*stride; xx++)
      {
        int output_col_idx = 4*xx;
        int output_idx = output_row_ofs + output_col_idx;

        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        // Start off aligned with a nonzero element of upsampled input.
        // Then loop by stride, since other elements are zero.
        /*
            Illustration:

            input:
              1 3 5
            upsampled input (by factor of 2):
              1 0 3 0 5 0
            kernel:
              a b c

            Execution trace (for xx=0 to xx=5):
              xx = 0:
                (edge) -> picks the if-branch in the code
              xx = 1:
                output = a*1 + b*0 + c*3
              xx = 2:
                output = a*0 + b*3 + c*0
              ...

            When xx = 1, we offset by 0 since the first input element is nonzero (upsampled_input[0+0]=1).
            When xx = 2, we offset by +1 to start on a nonzero element (upsampled_input[1+1]=3).
            We stride over kernel elements by the upsample factor, since the corresponding upsampled
            input elements in between strides are zero.
            We always use a non-negative offset so that the kernel array is not read out of bounds.
            The offset is calculated by the positive result of remainder(xx + pre, stride).
        */
        int kernel_ofs = ((xx + pre) % stride + stride) % stride;
        int w = -pre + kernel_ofs;

        // left edge
        if (xx < pre)
        {
          for (; w <= 0; w+=stride)
          {
            int input_idx = row_ofs + 4 * left_reflect((xx + w)/stride, 0);
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w < post; w+=stride)
          {
            int block_ofs = 4*w;
            int input_idx = row_ofs + (output_col_idx + block_ofs)/stride; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // right edge
        else if (xx >= operate_width - post)
        {
          for (; w <= 0; w+=stride)
          {
            int block_ofs = 4*w;
            int input_idx = row_ofs + (output_col_idx + block_ofs)/stride; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w < post; w+=stride)
          {
            int input_idx = row_ofs + 4 * right_reflect((xx + w)/stride, operate_width); // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w < post; w+=stride)
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
  int pre = (window-1 + 1)/2;
  int post = (window-1)/2;

  for (int y=0; y < operate_height; y++)
  {
    for (int x=0; x < operate_width; x++)
    {
      int col_idx = 4*x;

      for (int yy=y*stride; yy < (y+1)*stride; yy++)
      {
        int output_row_ofs = 4*yy*out_width;
        int output_idx = output_row_ofs + col_idx;

        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        int kernel_ofs = ((yy + pre) % stride + stride) % stride;
        int w = -pre + kernel_ofs;

        // left edge
        if (yy < pre)
        {
          for (; w <= 0; w+=stride)
          {
            int input_idx = 4*left_reflect((yy + w)/stride, 0)*in_width + col_idx; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w < post; w+=stride)
          {
            int input_idx = 4*(yy + w)/stride*in_width + col_idx; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // right edge
        else if (yy >= operate_height - post)
        {
          for (; w <= 0; w+=stride)
          {
            int input_idx = 4*(yy + w)/stride*in_width + col_idx; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w < post; w+=stride)
          {
            int input_idx = 4*right_reflect((yy + w)/stride, operate_height)*in_width + col_idx; // guaranteed to be divisible
            int kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w < post; w+=stride)
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
