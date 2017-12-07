#include "ideal_filter.h"
#include "utils.h"
#include <math.h>

void update_dct_buffer_and_coefficients (FLOAT* newest_frame, FLOAT* oldest_frame, FLOAT** DCT_BUFFER, FLOAT** DCT_COEFS, uint16_t width, uint16_t height, uint16_t N)
{
  ASSERT ((N-1) % 2 == 0, ""); // guaranteed divisible
  for (int i=0; i <= (N - 1) / 2; i++)
  {
    for (int y=0; y < height; y++)
    {
      const int row_ofs = 4 * y * width;

      for (int x=0; x < width; x++)
      {
        const int col_idx = 4 * x;
        const int index = row_ofs + col_idx;

        if (i == 0)
        {
          /*
            Update DC coefficient.
            new DC = (old DC) - oldest_frame + newest_frame
          */
          DCT_COEFS[i][index + 0] += -oldest_frame[index + 0] + newest_frame[index + 0];
          DCT_COEFS[i][index + 1] += -oldest_frame[index + 1] + newest_frame[index + 1];
          DCT_COEFS[i][index + 2] += -oldest_frame[index + 2] + newest_frame[index + 2];
        }
        else
        {
          /*
            Intermediate result:
            REAL = (previous real component) - oldest_frame + newest_frame
          */
          const FLOAT REAL_0 = DCT_COEFS[i][index + 0] - oldest_frame[index + 0] + newest_frame[index + 0];
          const FLOAT REAL_1 = DCT_COEFS[i][index + 1] - oldest_frame[index + 1] + newest_frame[index + 1];
          const FLOAT REAL_2 = DCT_COEFS[i][index + 2] - oldest_frame[index + 2] + newest_frame[index + 2];

          const FLOAT THETA = (2 * 3.14159 * i) / N;
          const FLOAT COS = cos (THETA);
          const FLOAT SIN = sin (THETA);

          /*
            Update real component.
            new real component = cos(THETA) * REAL - sin(THETA) * (previous imaginary component)
          */
          DCT_COEFS[i][index + 0] = COS * REAL_0 - SIN * DCT_COEFS[N - i][index + 0];
          DCT_COEFS[i][index + 1] = COS * REAL_1 - SIN * DCT_COEFS[N - i][index + 1];
          DCT_COEFS[i][index + 2] = COS * REAL_2 - SIN * DCT_COEFS[N - i][index + 2];

          /*
            Update imaginary component.
            new imaginary component = sin(THETA) * REAL + cos(THETA) * (previous imaginary component)
          */
          DCT_COEFS[N - i][index + 0] = SIN * REAL_0 + COS * DCT_COEFS[N - i][index + 0];
          DCT_COEFS[N - i][index + 1] = SIN * REAL_1 + COS * DCT_COEFS[N - i][index + 1];
          DCT_COEFS[N - i][index + 2] = SIN * REAL_2 + COS * DCT_COEFS[N - i][index + 2];
        }

        if (i == (N - 1) / 2)
        {
          /* At this point also copy newest_frame to DCT_BUFFER. */
          DCT_BUFFER[N - 1][index + 0] = newest_frame[index + 0];
          DCT_BUFFER[N - 1][index + 1] = newest_frame[index + 1];
          DCT_BUFFER[N - 1][index + 2] = newest_frame[index + 2];
        }
      }
    }
  }
}