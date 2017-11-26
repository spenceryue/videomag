
all: c/makefile
	cd c && $(MAKE)

rebuild: c/makefile
	cd c && $(MAKE) clean && $(MAKE)