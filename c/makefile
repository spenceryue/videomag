# Modified from
# http://nuclear.mutantstargoat.com/articles/make/#a-makefile-for-99-of-your-programs

CC = emcc
CFLAGS = -O3 -Wall -std=gnu99
EMCC_FLAGS = -s WASM=1 -s NO_EXIT_RUNTIME=1
# TOTAL_MEMORY:
# (frame # pixels * 4) * (sizeof float) * (# general purpose buffers + # pyramids * 2) + (1.5M for program and library code)
# ~ (640 * 480 * 4) * (4) * (3 + 1 * 2) + (1.5M)
EMCC_FLAGS += -s TOTAL_MEMORY=26MB
SRCS = $(wildcard *.c)
OBJS = $(SRCS:.c=.o)

ifdef debug
CFLAGS +=  -g -Werror
EMCC_FLAGS += -s ASSERTIONS=1 #-s SAFE_HEAP=1
else
CFLAGS += -DNDEBUG
endif


videomag.js: $(OBJS)
	$(CC) -o $@ $^ $(CFLAGS) $(EMCC_FLAGS)

utils: utils.h
	gcc $(CFLAGS) -x c utils.h

hello: hello.c
	gcc $(CFLAGS) $^

.PHONY: clean
clean:
	rm -f $(OBJS) videomag.js videomag.wasm* videomag.wast* a.out
