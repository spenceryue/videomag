# Modified from
# http://nuclear.mutantstargoat.com/articles/make/#a-makefile-for-99-of-your-programs

CC = emcc
CFLAGS = -O3 -Wall -std=gnu99
EMCC_FLAGS = -s WASM=1 -s NO_EXIT_RUNTIME=1
# TOTAL_MEMORY:
# ~ (frame # pixels * 4) * (sizeof float) * (# pyramids * 4/3) + (frame # pixels * 4) * (sizeof uint8_t) * (# output type pyramids * 4/3) + (? unaccounted for space)
# ~ (640 * 480 * 4) * (4) * (4 * 4/3) + (640 * 480 * 4) * (1) * (1 * 4/3) + (4.5MB)
EMCC_FLAGS += -s TOTAL_MEMORY=32MB
SRCS = $(wildcard *.c)
OBJS = $(SRCS:.c=.o)

ifdef debug
CFLAGS +=  -g -Werror
EMCC_FLAGS += -s ASSERTIONS=1 #-s SAFE_HEAP=1
else
CFLAGS += -DNDEBUG
endif


wasm.js: $(OBJS)
	$(CC) -o $@ $^ $(CFLAGS) $(EMCC_FLAGS)

utils: utils.h
	gcc $(CFLAGS) -x c utils.h

hello: hello.c
	gcc $(CFLAGS) $^

.PHONY: clean
clean:
	rm -f $(OBJS) wasm.js wasm.wasm* wasm.wast* a.out
