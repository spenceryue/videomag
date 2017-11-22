# Modified from
# http://nuclear.mutantstargoat.com/articles/make/#a-makefile-for-99-of-your-programs

CC = emcc
CFLAGS = -O3 -Wall -std=gnu99
EMCC_FLAGS = -s WASM=1 -s NO_EXIT_RUNTIME=1 -s TOTAL_MEMORY=44236800
SRCS = $(wildcard *.c)
OBJS = $(SRCS:.c=.o)

videomag.js: $(OBJS)
	$(CC) -o $@ $^ $(CFLAGS) $(EMCC_FLAGS)

utils: utils.h
	gcc $(CFLAGS) -x c utils.h -o utils

.PHONY: clean
clean:
	rm -f $(OBJS) videomag.js && test ! -f utils || rm utils
